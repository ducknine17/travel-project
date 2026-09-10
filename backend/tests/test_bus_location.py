import unittest
from unittest.mock import patch

from fastapi import HTTPException

from main import get_bus_location


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


if __name__ == "__main__":
    unittest.main()
