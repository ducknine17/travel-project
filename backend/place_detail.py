"""On-demand tourism detail. Missing upstream data never hides the saved place."""
import html
import re
import time
from concurrent.futures import ThreadPoolExecutor

import requests
import util.db as db
from place_filter import ACCESSIBILITY_FILTER_GROUPS
from update_place import API_BASE_URL, get_service_key, response_items

_cache = {}

def plain_text(value):
    return html.unescape(re.sub(r"<[^>]+>", " ", str(value or ""))).strip()

def fetch_detail(place_id):
    cached = _cache.get(place_id)
    if cached and cached[0] > time.monotonic():
        return cached[1]
    def fetch(endpoint):
        try:
            response = requests.get(f"{API_BASE_URL}/{endpoint}", params={
                "serviceKey": get_service_key(), "MobileOS": "ETC", "MobileApp": "bef",
                "_type": "json", "contentId": place_id,
            }, timeout=(2, 4))
            response.raise_for_status()
            return next(iter(response_items(response.json())), {})
        except (requests.RequestException, RuntimeError, ValueError):
            return {}
    with ThreadPoolExecutor(max_workers=2) as executor:
        common, facilities = list(executor.map(fetch, ["detailCommon2", "detailWithTour2"]))
    labels = {f["key"]: f["label"] for group in ACCESSIBILITY_FILTER_GROUPS for f in group["filters"]}
    photos = [common[key] for key in ("firstimage", "firstimage2") if str(common.get(key, "")).startswith(("https://", "http://"))]
    result = {
        "overview": plain_text(common.get("overview")), "phone": plain_text(common.get("tel")),
        "photos": list(dict.fromkeys(photos)),
        "facilities": [{"key": key, "label": label, "description": plain_text(facilities[key])}
                       for key, label in labels.items() if facilities.get(key)],
        "detail_available": bool(common or facilities),
    }
    if len(_cache) >= 256:
        _cache.pop(next(iter(_cache)))
    _cache[place_id] = (time.monotonic() + (3600 if result["detail_available"] else 30), result)
    return result

def get_place_detail(place_id):
    connection = db.connect()
    try:
        rows = db.executeQuery(connection, "SELECT id, name, lat, lng, address, type, tag FROM place.place WHERE id = %s", (place_id,))
    finally:
        connection.close()
    if not rows:
        return None
    result = dict(zip(("id", "name", "lat", "lng", "address", "type", "tags"), rows[0]))
    result.update(fetch_detail(place_id))
    return result
