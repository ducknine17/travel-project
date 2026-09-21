import unittest
from unittest.mock import patch

from fastapi import HTTPException

from main import get_bus_location, get_bus_route_path, get_bus_routes


class BusLocationTest(unittest.TestCase):
    @patch("main.get_seoul_bus_locations")
    def test_uses_seoul_api_for_seoul_city_code(self, get_locations):
        expected = [{"vehicleId": "1234567"}]
        get_locations.return_value = expected

        self.assertEqual(get_bus_location("11", "100100118"), expected)
        get_locations.assert_called_once_with("100100118")

    @patch("main.get_seoul_bus_locations", side_effect=ValueError("failed"))
    def test_hides_seoul_api_credentials_when_request_fails(self, _get_locations):
        with self.assertRaises(HTTPException) as context:
            get_bus_location("11", "100100118")

        self.assertEqual(context.exception.status_code, 502)
        self.assertNotIn("serviceKey", context.exception.detail)

    @patch("main.get_seoul_bus_arrivals")
    def test_filters_routes_with_arrivals_for_the_exact_seoul_station(self, arrivals):
        arrivals.return_value = [
            {"routeId": "100100118", "routeName": "701", "routeType": "3"},
            {"routeId": "100100118", "routeName": "701", "routeType": "3"},
        ]

        routes = get_bus_routes("11", "100000001", "02128")

        self.assertEqual([route["routeName"] for route in routes], ["701"])
        arrivals.assert_called_once_with("02128", "100000001")

    @patch("main.get_seoul_bus_route_path")
    def test_uses_seoul_api_for_route_path(self, get_path):
        expected = [{"latitude": "37.5666", "longitude": "126.9781"}]
        get_path.return_value = expected

        self.assertEqual(get_bus_route_path("11", "100100118"), expected)
        get_path.assert_called_once_with("100100118")

    @patch("main._get_tago_bus_arrival_items")
    def test_uses_arrivals_to_find_routes_for_a_tago_station(self, arrivals):
        arrivals.return_value = [
            {"routeid": "DJB30300002", "routeno": 2, "routetp": "간선버스"},
            {"routeid": "DJB30300002", "routeno": 2, "routetp": "간선버스"},
            {"routeid": "DJB30300042", "routeno": 107, "routetp": "간선버스"},
        ]

        routes = get_bus_routes("25", "DJB8001415")

        self.assertEqual([route["routeId"] for route in routes], [
            "DJB30300002",
            "DJB30300042",
        ])
        arrivals.assert_called_once_with("25", "DJB8001415")


if __name__ == "__main__":
    unittest.main()
