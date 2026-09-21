import unittest
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

from main import me, update_character, update_character_customization
from util.body import CharacterCustomizationUpdate, CharacterUpdate


class FakeCursor:
    def __init__(self, rowcount=1):
        self.rowcount = rowcount
        self.executions = []
        self.closed = False

    def execute(self, query, params):
        self.executions.append((" ".join(query.split()), params))

    def close(self):
        self.closed = True


class FakeConnection:
    def __init__(self, select_rows=None, rowcount=1):
        self.select_rows = select_rows or []
        self.cursor_value = FakeCursor(rowcount)
        self.committed = False
        self.rolled_back = False
        self.closed = False

    def cursor(self):
        return self.cursor_value

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


class CharacterSettingsTest(unittest.TestCase):
    def test_rejects_unknown_character(self):
        with self.assertRaises(ValidationError):
            CharacterUpdate(character=4)

    def test_rejects_unknown_or_too_many_custom_items(self):
        with self.assertRaises(ValidationError):
            CharacterCustomizationUpdate(items=["unknown"])
        with self.assertRaises(ValidationError):
            CharacterCustomizationUpdate(
                items=["compass", "camera", "bottle", "book"]
            )

    def test_me_returns_saved_character(self):
        customization = {
            "badges": ["first"],
            "items": ["book"],
            "friendName": "몽이",
        }
        connection = FakeConnection(select_rows=[
            ("uid-1", "traveler", 1, None, None, customization)
        ])

        with patch("main.db.connect", return_value=connection), patch(
            "main.db.executeQuery", return_value=connection.select_rows
        ) as execute_query:
            result = me("uid-1")

        self.assertEqual(result["character"], 1)
        self.assertEqual(result["character_customization"], customization)
        self.assertIn("COALESCE(character, 0)", execute_query.call_args.args[1])
        self.assertTrue(connection.closed)

    def test_updates_character_for_authenticated_user(self):
        connection = FakeConnection(rowcount=1)

        with patch("main.db.connect", return_value=connection):
            result = update_character(CharacterUpdate(character=2), "uid-1")

        self.assertEqual(result, {"character": 2})
        self.assertEqual(
            connection.cursor_value.executions[0][1],
            (2, "uid-1"),
        )
        self.assertTrue(connection.committed)
        self.assertTrue(connection.cursor_value.closed)
        self.assertTrue(connection.closed)

    def test_missing_user_does_not_save_character(self):
        connection = FakeConnection(rowcount=0)

        with patch("main.db.connect", return_value=connection):
            with self.assertRaises(HTTPException) as raised:
                update_character(CharacterUpdate(character=3), "missing")

        self.assertEqual(raised.exception.status_code, 404)
        self.assertTrue(connection.rolled_back)

    def test_updates_character_customization_for_authenticated_user(self):
        connection = FakeConnection(rowcount=1)
        request = CharacterCustomizationUpdate(
            badges=["first", "culture", "first"],
            items=["book", "scarf"],
            friend_name="  베프  ",
        )

        with patch("main.db.connect", return_value=connection):
            result = update_character_customization(request, "uid-1")

        self.assertEqual(result, {
            "badges": ["first", "culture"],
            "items": ["book", "scarf"],
            "friendName": "베프",
        })
        saved_json, saved_uid = connection.cursor_value.executions[0][1]
        self.assertEqual(saved_uid, "uid-1")
        self.assertIn('"friendName": "베프"', saved_json)
        self.assertTrue(connection.committed)


if __name__ == "__main__":
    unittest.main()
