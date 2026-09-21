import unittest
from unittest.mock import patch

import requests

from main import get_bus_stations


class BusStationsTest(unittest.TestCase):
    @patch("main.get_osm_bus_stations")
    @patch("main.requests.get", side_effect=requests.RequestException("timeout"))
    def test_uses_osm_fallback_when_public_api_fails(self, _get, fallback):
        expected = [{"id": "osm-123", "name": "테스트 정류장"}]
        fallback.return_value = expected

        self.assertEqual(get_bus_stations(37.5, 127.0), expected)
        fallback.assert_called_once_with(37.5, 127.0)

    @patch("main.get_osm_bus_stations")
    @patch("main.requests.get")
    @patch("main.get_seoul_bus_stations", return_value=[])
    def test_uses_osm_when_seoul_and_tago_return_no_stations(
        self, _seoul, get, fallback
    ):
        get.return_value.json.return_value = {
            "response": {"header": {"resultCode": "00"}, "body": {"items": ""}}
        }
        expected = [{"id": "osm-456", "name": "서울 정류장"}]
        fallback.return_value = expected

        self.assertEqual(get_bus_stations(37.5665, 126.9780), expected)
        fallback.assert_called_once_with(37.5665, 126.9780)

    @patch("main.get_osm_bus_stations")
    @patch("main.requests.get")
    @patch("main.get_seoul_bus_stations", return_value=[])
    def test_uses_tago_for_bucheon_near_seoul_boundary(
        self, seoul, get, fallback
    ):
        get.return_value.json.return_value = {
            "response": {
                "header": {"resultCode": "00"},
                "body": {
                    "items": {
                        "item": {
                            "nodeid": "GGB210000537",
                            "nodenm": "송내역.로데오거리",
                            "gpslati": 37.48965,
                            "gpslong": 126.7536833,
                            "citycode": "31050",
                        }
                    }
                },
            }
        }

        result = get_bus_stations(37.48965, 126.7536833)

        self.assertEqual(result[0]["id"], "GGB210000537")
        self.assertEqual(result[0]["cityCode"], "31050")
        self.assertTrue(result[0]["arrivalSupported"])
        self.assertEqual(result[0]["source"], "public-data")
        seoul.assert_not_called()
        fallback.assert_not_called()

    @patch("main.get_osm_bus_stations")
    @patch("main.requests.get")
    def test_uses_osm_when_tago_returns_no_stations(self, get, fallback):
        get.return_value.json.return_value = {
            "response": {"header": {"resultCode": "00"}, "body": {"items": ""}}
        }
        expected = [{"id": "osm-789", "name": "보조 정류장"}]
        fallback.return_value = expected

        self.assertEqual(get_bus_stations(35.1796, 129.0756), expected)
        fallback.assert_called_once_with(35.1796, 129.0756)


if __name__ == "__main__":
    unittest.main()
