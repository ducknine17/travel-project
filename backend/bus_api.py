import os
from urllib.parse import unquote

import requests


OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def get_service_key() -> str:
    """Return the decoded key so the HTTP client encodes it exactly once."""
    service_key = os.environ.get("OPENAPI_KEY")
    if not service_key:
        raise RuntimeError("OPENAPI_KEY environment variable is not set")

    return unquote(service_key)


def get_response_items(data: dict) -> list[dict]:
    body = data.get("response", {}).get("body", {})
    items_container = body.get("items") if isinstance(body, dict) else None
    items = (
        items_container.get("item", [])
        if isinstance(items_container, dict)
        else []
    )

    if isinstance(items, dict):
        return [items]
    if isinstance(items, list):
        return items
    return []


def get_osm_bus_stations(latitude: float, longitude: float) -> list[dict]:
    """Return nearby bus stops when the national public API is unavailable."""
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise ValueError("invalid coordinates")

    query = f"""
    [out:json][timeout:10];
    (
      node(around:1500,{latitude},{longitude})[highway=bus_stop];
      node(around:1500,{latitude},{longitude})[public_transport=platform][bus=yes];
    );
    out body 100;
    """
    response = requests.get(
        OVERPASS_URL,
        params={"data": query},
        headers={"User-Agent": "BEF-Trip/1.0 bus-stop fallback"},
        timeout=15,
    )
    response.raise_for_status()

    stations = []
    for element in response.json().get("elements", []):
        tags = element.get("tags") or {}
        element_id = element.get("id")
        latitude_value = element.get("lat")
        longitude_value = element.get("lon")
        if element_id is None or latitude_value is None or longitude_value is None:
            continue

        route_refs = tags.get("route_ref", "")
        stations.append({
            "id": f"osm-{element_id}",
            "name": tags.get("name") or tags.get("ref") or "버스 정류장",
            "latitude": latitude_value,
            "longitude": longitude_value,
            "cityCode": None,
            "routes": [route for route in route_refs.split(";") if route],
            "arrivalSupported": False,
            "source": "openstreetmap",
        })

    return stations
