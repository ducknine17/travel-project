import unittest
from unittest.mock import patch

from auth.checker import loginChecker


class FakeCursor:
    def __init__(self, row):
        self.row = row

    def execute(self, _query, _params):
        pass

    def fetchall(self):
        return [self.row]

    def close(self):
        pass


class FakeConnection:
    def __init__(self, row):
        self.row = row

    def cursor(self):
        return FakeCursor(self.row)

    def close(self):
        pass


class LoginCheckerTest(unittest.TestCase):
    @patch("auth.checker.bcrypt.checkpw", return_value=True)
    @patch("auth.checker.connect")
    def test_rejects_user_before_email_verification(self, connect, checkpw):
        connect.return_value = FakeConnection(("uid", "hashed-password", False))

        self.assertIsNone(loginChecker("traveler", "password"))
        checkpw.assert_not_called()

    @patch("auth.checker.bcrypt.checkpw", return_value=True)
    @patch("auth.checker.connect")
    def test_allows_verified_user_with_valid_password(self, connect, _checkpw):
        connect.return_value = FakeConnection(("uid", "hashed-password", True))

        self.assertEqual(loginChecker("traveler", "password"), "uid")


if __name__ == "__main__":
    unittest.main()
