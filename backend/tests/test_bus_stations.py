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


if __name__ == "__main__":
    unittest.main()
