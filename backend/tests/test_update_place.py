import os
import unittest
from unittest.mock import Mock, patch

from update_place import fetch_json, get_service_key, response_items


class UpdatePlaceTest(unittest.TestCase):
    def test_decodes_service_key_before_requests_encodes_it(self):
        with patch.dict(
            os.environ, {"OPENAPI_KEY": "abc%2Fdef%2Bghi%3D%3D"}
        ):
            self.assertEqual(get_service_key(), "abc/def+ghi==")

    def test_fetch_json_sets_timeout_and_common_parameters(self):
        response = Mock()
        response.json.return_value = {"response": {}}
        session = Mock()
        session.get.return_value = response

        with patch.dict(os.environ, {"OPENAPI_KEY": "test-key"}):
            result = fetch_json(session, "example", numOfRows=10)

        self.assertEqual(result, {"response": {}})
        _, kwargs = session.get.call_args
        self.assertEqual(kwargs["timeout"], (10, 30))
        self.assertEqual(kwargs["params"]["serviceKey"], "test-key")
        self.assertEqual(kwargs["params"]["numOfRows"], 10)
        response.raise_for_status.assert_called_once_with()

    def test_response_items_normalizes_one_item_to_list(self):
        data = {
            "response": {
                "header": {"resultCode": "0000"},
                "body": {"items": {"item": {"contentid": "1"}}},
            }
        }

        self.assertEqual(response_items(data), [{"contentid": "1"}])

    def test_response_items_raises_for_api_error(self):
        data = {
            "response": {
                "header": {"resultCode": "30", "resultMsg": "KEY ERROR"}
            }
        }

        with self.assertRaisesRegex(RuntimeError, "KEY ERROR"):
            response_items(data)


if __name__ == "__main__":
    unittest.main()
