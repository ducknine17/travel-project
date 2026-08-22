import os
import unittest
from urllib.parse import urlencode
from unittest.mock import patch

from bus_api import get_response_items, get_service_key


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


if __name__ == "__main__":
    unittest.main()
