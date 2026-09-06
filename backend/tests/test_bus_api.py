import os
import unittest
from urllib.parse import urlencode
from unittest.mock import patch

from bus_api import get_osm_bus_stations, get_response_items, get_service_key


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


class BusApiTest(unittest.TestCase):
    def test_decodes_service_key_before_query_encoding(self):
        with patch.dict(os.environ, {"OPENAPI_KEY": "abc%2Fdef%2Bghi%3D%3D"}):
            query = urlencode({"serviceKey": get_service_key()})

        self.assertEqual(query, "serviceKey=abc%2Fdef%2Bghi%3D%3D")
        self.assertNotIn("%25", query)

    def test_returns_one_item_as_a_list(self):
        data = {"response": {"body": {"items": {"item": {"routeid": "1"}}}}}

        self.assertEqual(get_response_items(data), [{"routeid": "1"}])

    def test_returns_empty_list_for_null_items(self):
        data = {"response": {"body": {"items": None}}}

        self.assertEqual(get_response_items(data), [])

    @patch("bus_api.requests.get", return_value=FakeResponse())
    def test_returns_osm_stations_as_non_arrival_fallback(self, get):
        stations = get_osm_bus_stations(37.5, 127.0)

        self.assertEqual(stations[0]["id"], "osm-123")
        self.assertEqual(stations[0]["name"], "테스트 정류장")
        self.assertEqual(stations[0]["routes"], ["100", "200"])
        self.assertFalse(stations[0]["arrivalSupported"])
        self.assertEqual(stations[0]["source"], "openstreetmap")
        self.assertIn("around:1500,37.5,127.0", get.call_args.kwargs["params"]["data"])


if __name__ == "__main__":
    unittest.main()
