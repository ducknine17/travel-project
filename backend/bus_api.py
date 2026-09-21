import os
import socket
from functools import lru_cache
from math import asin, cos, radians, sin, sqrt
from urllib.parse import unquote

import requests


OVERPASS_URLS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)
SEOUL_OPEN_DATA_BASE_URL = "http://openapi.seoul.go.kr:8088"
SEOUL_STATION_SERVICE = "busStopLocationXyInfo"
SEOUL_STATION_PAGE_SIZE = 1000
SEOUL_REALTIME_BUS_API_BASE_URL = "http://ws.bus.go.kr/api/rest"
SEOUL_REALTIME_BUS_HOST = "ws.bus.go.kr"
NEARBY_STATION_RADIUS_KM = 1.5

# A bounding box is sufficient for choosing the provider. If a point near the
# city boundary is classified incorrectly, the empty-result fallback still
# returns OSM stops.
SEOUL_BOUNDS = {
    "min_latitude": 37.413,
    "max_latitude": 37.715,
    "min_longitude": 126.734,
    "max_longitude": 127.269,
}


def get_service_key() -> str:
    """Return the decoded key so the HTTP client encodes it exactly once."""
    service_key = os.environ.get("OPENAPI_KEY")
    if not service_key:
        raise RuntimeError("OPENAPI_KEY environment variable is not set")

    return unquote(service_key)


def get_seoul_service_key() -> str:
    """Return the key issued for the Seoul bus API."""
    service_key = os.environ.get("SEOUL_KEY")
    if not service_key:
        raise RuntimeError("SEOUL_KEY environment variable is not set")

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


def is_seoul_coordinate(latitude: float, longitude: float) -> bool:
    """Return whether coordinates are inside Seoul's approximate bounds."""
    return (
        SEOUL_BOUNDS["min_latitude"] <= latitude <= SEOUL_BOUNDS["max_latitude"]
        and SEOUL_BOUNDS["min_longitude"]
        <= longitude
        <= SEOUL_BOUNDS["max_longitude"]
    )


def _distance_km(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float:
    """Return the great-circle distance between two WGS84 points."""
    latitude_delta = radians(latitude_b - latitude_a)
    longitude_delta = radians(longitude_b - longitude_a)
    value = (
        sin(latitude_delta / 2) ** 2
        + cos(radians(latitude_a))
        * cos(radians(latitude_b))
        * sin(longitude_delta / 2) ** 2
    )
    return 6371 * 2 * asin(sqrt(value))


@lru_cache(maxsize=2)
def _load_seoul_bus_station_rows(service_key: str) -> tuple[dict, ...]:
    """Load and cache Seoul's station-location dataset."""
    rows = []
    start = 1
    total_count = None

    while total_count is None or start <= total_count:
        end = start + SEOUL_STATION_PAGE_SIZE - 1
        response = requests.get(
            (
                f"{SEOUL_OPEN_DATA_BASE_URL}/{service_key}/json/"
                f"{SEOUL_STATION_SERVICE}/{start}/{end}/"
            ),
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        payload = data.get(SEOUL_STATION_SERVICE)
        if not isinstance(payload, dict):
            error = data.get("RESULT", {})
            raise ValueError(error.get("MESSAGE") or "Seoul Open Data API error")

        result = payload.get("RESULT", {})
        if result.get("CODE") not in (None, "INFO-000"):
            raise ValueError(result.get("MESSAGE") or "Seoul Open Data API error")

        total_count = int(payload.get("list_total_count", 0))
        rows.extend(payload.get("row") or [])
        start = end + 1

    return tuple(rows)


def get_seoul_bus_stations(latitude: float, longitude: float) -> list[dict]:
    """Return nearby stops from Seoul's cached station-location dataset."""
    stations = []
    for item in _load_seoul_bus_station_rows(get_seoul_service_key()):
        try:
            station_latitude = float(item["YCRD"])
            station_longitude = float(item["XCRD"])
        except (KeyError, TypeError, ValueError):
            continue

        distance = _distance_km(
            latitude,
            longitude,
            station_latitude,
            station_longitude,
        )
        if distance > NEARBY_STATION_RADIUS_KM:
            continue

        # STOPS_NO is Seoul's internal station ID. NODE_ID is the ARS number
        # shown on the stop sign and used by the station-info API.
        station_id = item.get("STOPS_NO") or item.get("NODE_ID")
        if not station_id:
            continue
        stations.append((distance, {
            "id": str(station_id),
            "arsId": item.get("NODE_ID"),
            "name": item.get("STOPS_NM") or "버스 정류장",
            "latitude": station_latitude,
            "longitude": station_longitude,
            "cityCode": "11",
            "routes": [],
            "arrivalSupported": False,
            "locationSupported": bool(item.get("NODE_ID")),
            "source": "seoul-public-data",
        }))

    stations.sort(key=lambda station: station[0])
    return [station for _, station in stations[:100]]


def _seoul_realtime_items(data: dict) -> list[dict]:
    """Normalize items returned by Seoul's real-time bus API."""
    header = data.get("msgHeader", {})
    header_code = str(header.get("headerCd", "0"))
    if header_code not in {"0", "00"}:
        raise ValueError(header.get("headerMsg") or "Seoul bus API error")

    items = data.get("msgBody", {}).get("itemList", [])
    if isinstance(items, dict):
        return [items]
    return items if isinstance(items, list) else []


def _get_seoul_realtime_response(path: str, params: dict):
    """Call Seoul's API, retrying by IP when the hostname route returns 502.

    Some production networks fail only for plain-HTTP requests addressed to
    ws.bus.go.kr. The service itself is still reachable by its resolved IPv4
    address, but it requires the original Host header for key validation.
    """
    url = f"{SEOUL_REALTIME_BUS_API_BASE_URL}/{path.lstrip('/')}"
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response
    except requests.RequestException as original_error:
        try:
            address = socket.gethostbyname(SEOUL_REALTIME_BUS_HOST)
            response = requests.get(
                f"http://{address}/api/rest/{path.lstrip('/')}",
                params=params,
                headers={"Host": SEOUL_REALTIME_BUS_HOST},
                timeout=10,
            )
            response.raise_for_status()
            return response
        except (OSError, requests.RequestException):
            raise original_error


def get_seoul_bus_locations(route_id: str) -> list[dict]:
    """Return real-time vehicle positions for a Seoul bus route."""
    response = _get_seoul_realtime_response(
        "buspos/getBusPosByRtid",
        {
            # This service uses the public/shared-data service key, not the
            # Seoul Open Data key used by busStopLocationXyInfo.
            "serviceKey": get_service_key(),
            "busRouteId": route_id,
            "resultType": "json",
        },
    )
    response.raise_for_status()

    vehicle_types = {
        "0": "일반버스",
        "1": "저상버스",
        "2": "굴절버스",
    }
    return [
        {
            "routeName": None,
            "latitude": item.get("gpsY"),
            "longitude": item.get("gpsX"),
            "nodeOrder": item.get("sectOrd"),
            "nodeName": None,
            "nodeId": item.get("nextStId"),
            "routeType": item.get("busType"),
            "vehicleType": vehicle_types.get(
                str(item.get("busType")),
                "차량 정보 미제공",
            ),
            "lowFloor": str(item.get("busType")) == "1",
            "vehicleNumber": item.get("plainNo"),
            "vehicleId": item.get("vehId"),
            "updatedAt": item.get("dataTm"),
            "source": "seoul-public-data",
        }
        for item in _seoul_realtime_items(response.json())
        if item.get("gpsX") is not None and item.get("gpsY") is not None
    ]


def get_seoul_bus_route_path(route_id: str) -> list[dict]:
    """Return the ordered station coordinates for a Seoul bus route."""
    response = _get_seoul_realtime_response(
        "busRouteInfo/getStaionByRoute",
        {
            "serviceKey": get_service_key(),
            "busRouteId": route_id,
            "resultType": "json",
        },
    )
    response.raise_for_status()

    points = []
    for item in _seoul_realtime_items(response.json()):
        latitude = item.get("gpsY")
        longitude = item.get("gpsX")
        if latitude is None or longitude is None:
            continue
        points.append({
            "latitude": latitude,
            "longitude": longitude,
            "nodeOrder": item.get("seq"),
            "nodeName": item.get("stationNm"),
            "nodeId": item.get("station"),
        })

    return points


def get_seoul_station_routes(ars_id: str) -> list[dict]:
    """Return routes that pass a Seoul station identified by its ARS ID."""
    response = _get_seoul_realtime_response(
        "stationinfo/getRouteByStation",
        {
            "serviceKey": get_service_key(),
            "arsId": ars_id,
            "resultType": "json",
        },
    )
    response.raise_for_status()

    routes = []
    seen_route_ids = set()
    for item in _seoul_realtime_items(response.json()):
        route_id = item.get("busRouteId")
        if route_id is None or str(route_id) in seen_route_ids:
            continue
        seen_route_ids.add(str(route_id))
        routes.append({
            "routeId": str(route_id),
            "routeName": item.get("busRouteNm"),
            "routeType": item.get("routeType"),
            "startName": item.get("stBegin"),
            "endName": item.get("stEnd"),
        })

    return routes


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
    last_error = None
    for url in OVERPASS_URLS:
        try:
            # POST avoids proxy failures caused by the long encoded query URL.
            response = requests.post(
                url,
                data={"data": query},
                headers={"User-Agent": "BEF-Trip/1.0 bus-stop fallback"},
                timeout=15,
            )
            response.raise_for_status()
            break
        except requests.RequestException as exc:
            last_error = exc
    else:
        raise last_error or requests.RequestException(
            "No Overpass endpoint is available"
        )

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
            "locationSupported": False,
            "source": "openstreetmap",
        })

    return stations
