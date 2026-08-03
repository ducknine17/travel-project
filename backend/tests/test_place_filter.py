import unittest
from unittest.mock import patch

from place_filter import AccessibilityFilter, search_places


class FakeCursor:
    def __init__(self, total=1, rows=None):
        self.total = total
        self.rows = rows or []
        self.executions = []
        self.closed = False

    def execute(self, query, params):
        self.executions.append((" ".join(query.split()), params))

    def fetchone(self):
        return (self.total,)

    def fetchall(self):
        return self.rows

    def close(self):
        self.closed = True


class FakeConnection:
    def __init__(self, cursor):
        self._cursor = cursor
        self.closed = False

    def cursor(self):
        return self._cursor

    def close(self):
        self.closed = True


class SearchPlacesTest(unittest.TestCase):
    def test_uses_all_selected_tags_and_pagination(self):
        cursor = FakeCursor(
            total=1,
            rows=[
                (
                    "129619",
                    "테스트 관광지",
                    127.1,
                    37.5,
                    "서울특별시",
                    "tour",
                    ["parking", "wheelchair"],
                )
            ],
        )
        connection = FakeConnection(cursor)

        with patch("place_filter.db.connect", return_value=connection):
            result = search_places(
                [
                    AccessibilityFilter.parking,
                    AccessibilityFilter.wheelchair,
                    AccessibilityFilter.parking,
                ],
                page=2,
                page_size=10,
            )

        self.assertEqual(result["filters"], ["parking", "wheelchair"])
        self.assertEqual(result["items"][0]["id"], "129619")
        self.assertEqual(result["total"], 1)
        self.assertEqual(cursor.executions[0][1], (["parking", "wheelchair"],))
        self.assertEqual(
            cursor.executions[1][1],
            (["parking", "wheelchair"], 10, 10),
        )
        self.assertIn("tag, ARRAY[]::text[]) @> %s::text[]", cursor.executions[0][0])
        self.assertTrue(cursor.closed)
        self.assertTrue(connection.closed)

    def test_without_filters_returns_all_places(self):
        cursor = FakeCursor(total=0)
        connection = FakeConnection(cursor)

        with patch("place_filter.db.connect", return_value=connection):
            result = search_places([], page=1, page_size=20)

        self.assertEqual(result["filters"], [])
        self.assertEqual(cursor.executions[0][1], ())
        self.assertNotIn("WHERE", cursor.executions[0][0])
        self.assertEqual(cursor.executions[1][1], (20, 0))


if __name__ == "__main__":
    unittest.main()
