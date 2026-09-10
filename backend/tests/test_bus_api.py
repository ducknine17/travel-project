import os
import unittest
from urllib.parse import urlencode
from unittest.mock import patch

import requests

from bus_api import (
    get_osm_bus_stations,
    get_response_items,
    get_seoul_bus_locations,
    get_seoul_bus_stations,
    get_seoul_station_routes,
    get_seoul_service_key,
    get_service_key,
    is_seoul_coordinate,
)


class FakeResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {
            "elements": [
                {
                    "id": 123,
                    "lat": 37.5,
                    "lon": 127.0,
                    "tags": {
                        "name": "테스트 정류장",
                        "route_ref": "100;200",
                    },
                }
            ]
        }


class FakeFailedResponse:
    def raise_for_status(self):
        raise requests.HTTPError("temporary failure")


class FakeSeoulResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {
            "busStopLocationXyInfo": {
                "list_total_count": 1,
                "RESULT": {"CODE": "INFO-000", "MESSAGE": "정상 처리"},
                "row": [{
                    "STOPS_NO": "100000001",
                    "STOPS_NM": "서울역버스환승센터",
                    "XCRD": "126.9781",
                    "YCRD": "37.5666",
                    "NODE_ID": "02128",
                }]
            },
        }


class FakeSeoulBusLocationResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {
            "msgHeader": {"headerCd": "0", "headerMsg": "정상 처리"},
            "msgBody": {
                "itemList": [{
                    "gpsX": "126.9781",
                    "gpsY": "37.5666",
                    "sectOrd": "12",
                    "nextStId": "100000001",
                    "busType": "0",
                    "plainNo": "서울70사1234",
                    "vehId": "1234567",
                    "dataTm": "20260909153000",
                }]
            },
        }


class FakeSeoulStationRoutesResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {
            "msgHeader": {"headerCd": "0", "headerMsg": "정상 처리"},
            "msgBody": {
                "itemList": [{
                    "busRouteId": "100100118",
                    "busRouteNm": "701",
                    "routeType": "3",
                    "stBegin": "진관공영차고지",
                    "stEnd": "종로2가",
                }]
            },
        }


class BusApiTest(unittest.TestCase):
    def test_decodes_service_key_before_query_encoding(self):
        with patch.dict(os.environ, {"OPENAPI_KEY": "abc%2Fdef%2Bghi%3D%3D"}):
            query = urlencode({"serviceKey": get_service_key()})

        self.assertEqual(query, "serviceKey=abc%2Fdef%2Bghi%3D%3D")
        self.assertNotIn("%25", query)

    def test_uses_separate_seoul_service_key(self):
        with patch.dict(os.environ, {"SEOUL_KEY": "seoul%2Fkey"}):
            self.assertEqual(get_seoul_service_key(), "seoul/key")

    def test_returns_one_item_as_a_list(self):
        data = {"response": {"body": {"items": {"item": {"routeid": "1"}}}}}

        self.assertEqual(get_response_items(data), [{"routeid": "1"}])

    def test_returns_empty_list_for_null_items(self):
        data = {"response": {"body": {"items": None}}}

        self.assertEqual(get_response_items(data), [])

    @patch("bus_api.requests.post", return_value=FakeResponse())
    def test_returns_osm_stations_as_non_arrival_fallback(self, post):
        stations = get_osm_bus_stations(37.5, 127.0)

        self.assertEqual(stations[0]["id"], "osm-123")
        self.assertEqual(stations[0]["name"], "테스트 정류장")
        self.assertEqual(stations[0]["routes"], ["100", "200"])
        self.assertFalse(stations[0]["arrivalSupported"])
        self.assertEqual(stations[0]["source"], "openstreetmap")
        self.assertIn("around:1500,37.5,127.0", post.call_args.kwargs["data"]["data"])

    @patch(
        "bus_api.requests.post",
        side_effect=[FakeFailedResponse(), FakeResponse()],
    )
    def test_tries_next_overpass_server_after_failure(self, post):
        stations = get_osm_bus_stations(37.5, 127.0)

        self.assertEqual(stations[0]["id"], "osm-123")
        self.assertEqual(post.call_count, 2)

    def test_detects_seoul_coordinates(self):
        self.assertTrue(is_seoul_coordinate(37.5665, 126.9780))
        self.assertFalse(is_seoul_coordinate(35.1796, 129.0756))

    @patch.dict(os.environ, {"SEOUL_KEY": "test-key"})
    @patch("bus_api.requests.get", return_value=FakeSeoulResponse())
    def test_returns_seoul_bus_stations(self, get):
        stations = get_seoul_bus_stations(37.5665, 126.9780)

        self.assertEqual(stations[0]["id"], "100000001")
        self.assertEqual(stations[0]["arsId"], "02128")
        self.assertEqual(stations[0]["cityCode"], "11")
        self.assertFalse(stations[0]["arrivalSupported"])
        self.assertTrue(stations[0]["locationSupported"])
        self.assertEqual(stations[0]["source"], "seoul-public-data")
        self.assertIn(
            "/test-key/json/busStopLocationXyInfo/1/1000/",
            get.call_args.args[0],
        )

    @patch.dict(os.environ, {"OPENAPI_KEY": "test-key"})
    @patch(
        "bus_api.requests.get",
        return_value=FakeSeoulBusLocationResponse(),
    )
    def test_returns_seoul_realtime_bus_locations(self, get):
        buses = get_seoul_bus_locations("100100118")

        self.assertEqual(buses[0]["vehicleId"], "1234567")
        self.assertEqual(buses[0]["vehicleNumber"], "서울70사1234")
        self.assertEqual(buses[0]["source"], "seoul-public-data")
        self.assertEqual(
            get.call_args.kwargs["params"]["busRouteId"],
            "100100118",
        )

    @patch.dict(os.environ, {"OPENAPI_KEY": "test-key"})
    @patch(
        "bus_api.requests.get",
        return_value=FakeSeoulStationRoutesResponse(),
    )
    def test_returns_routes_for_seoul_station(self, get):
        routes = get_seoul_station_routes("02128")

        self.assertEqual(routes[0]["routeId"], "100100118")
        self.assertEqual(routes[0]["routeName"], "701")
        self.assertEqual(get.call_args.kwargs["params"]["arsId"], "02128")


if __name__ == "__main__":
    unittest.main()
