import os
from pathlib import Path
from urllib.parse import unquote

import dotenv
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

import util.db as db


dotenv.load_dotenv(Path(__file__).resolve().parents[1] / ".env")

API_BASE_URL = "https://apis.data.go.kr/B551011/KorWithService2"
REQUEST_TIMEOUT = (10, 30)

TYPE_CODE_TO_TEXT = {
    "12": "tour",
    "14": "culture",
    "15": "festival",
    "28": "sports",
    "32": "stay",
    "38": "shopping",
    "39": "food",
}


def get_service_key() -> str:
    """Return a decoded key so requests URL-encodes it exactly once."""
    service_key = os.environ.get("OPENAPI_KEY")
    if not service_key:
        raise RuntimeError("OPENAPI_KEY environment variable is not set")
    return unquote(service_key)


def create_session() -> requests.Session:
    """Create an HTTP session that retries transient API and TLS failures."""
    retry = Retry(
        total=5,
        connect=5,
        read=5,
        status=5,
        backoff_factor=1,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
        respect_retry_after_header=True,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session = requests.Session()
    session.mount("https://", adapter)
    return session


def fetch_json(
    session: requests.Session, endpoint: str, **params: object
) -> dict:
    common_params = {
        "MobileOS": "IOS",
        "MobileApp": "bef",
        "_type": "json",
        "serviceKey": get_service_key(),
    }
    response = session.get(
        f"{API_BASE_URL}/{endpoint}",
        params={**common_params, **params},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def response_items(data: dict) -> list[dict]:
    response = data.get("response", {})
    header = response.get("header", {}) if isinstance(response, dict) else {}
    result_code = header.get("resultCode")
    if result_code not in (None, "0000"):
        message = header.get("resultMsg", "Unknown OpenAPI error")
        raise RuntimeError(f"OpenAPI error {result_code}: {message}")

    body = response.get("body", {}) if isinstance(response, dict) else {}
    items = body.get("items") if isinstance(body, dict) else None
    if not isinstance(items, dict):
        return []

    item = items.get("item", [])
    if isinstance(item, dict):
        return [item]
    return item if isinstance(item, list) else []


def update_places() -> None:
    session = create_session()
    place_list = response_items(
        fetch_json(session, "areaBasedSyncList2", numOfRows=20000)
    )

    for place in place_list:
        place_id = place["contentid"]
        name = place["title"]
        address = f"{place.get('addr1', '')} {place.get('addr2', '')}".strip()
        address_parts = address.split()
        city = address_parts[0] if address_parts else None
        district = address_parts[1] if len(address_parts) > 1 else None
        place_type = TYPE_CODE_TO_TEXT.get(place.get("contenttypeid"))
        if place_type is None:
            print(f"{name}: skipped unknown content type")
            continue

        con = db.connect()
        try:
            query = "SELECT * FROM place.place WHERE id = %s"
            if db.executeQuery(con, query, (place_id,)):
                print(f"{name}: Exists")
                continue

            detail_items = response_items(
                fetch_json(session, "detailWithTour2", contentId=place_id)
            )
            if not detail_items:
                continue

            detail = detail_items[0]
            tags = [
                key
                for key, value in detail.items()
                if key != "contentid" and value != ""
            ]
            if not tags:
                continue

            query = (
                "INSERT INTO place.place "
                "(id, name, lat, lng, post, tag, address, type, city, district) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            )
            params = (
                place_id,
                name,
                place["mapx"],
                place["mapy"],
                [],
                tags,
                address,
                place_type,
                city,
                district,
            )
            db.executeQuery(con, query, params)
            print(f"{name} : {tags}")
        finally:
            con.close()


def main() -> None:
    try:
        update_places()
    except requests.RequestException as exc:
        raise SystemExit(
            "Tour API request failed after retries. Check access to "
            f"apis.data.go.kr and try again. Details: {exc}"
        ) from exc


if __name__ == "__main__":
    main()
