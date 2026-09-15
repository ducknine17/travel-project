import os
import unittest
from unittest.mock import patch

from auth.jwt_manager import (
    create_password_change_token,
    verify_password_change_token,
)
from main import edit_user, verify_password_change_email
from util.body import UserEdit


class FakeCursor:
    def __init__(self):
        self.executions = []
        self.rowcount = 1
        self.closed = False

    def execute(self, query, params):
        self.executions.append((" ".join(query.split()), params))

    def fetchone(self):
        return ("password-change-id",)

    def close(self):
        self.closed = True


class FakeConnection:
    def __init__(self):
        self.cursor_value = FakeCursor()
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


class PasswordChangeTest(unittest.TestCase):
    def test_password_token_supplies_user_identity_without_access_token(self):
        with patch.dict(os.environ, {"JWT_SECRET_KEY": "test-secret"}):
            token = create_password_change_token(
                "uid-1",
                "password-change-verification",
            )
            self.assertEqual(
                verify_password_change_token(token),
                ("uid-1", "password-change-verification"),
            )

    @patch("main.bcrypt.hashpw", return_value=b"hashed-password")
    @patch(
        "main.verify_password_change_token",
        return_value=("uid-1", "password-change-verification"),
    )
    @patch("main.db.connect")
    def test_changes_password_using_email_token_only(
        self,
        connect,
        _verify_token,
        _hash_password,
    ):
        connection = FakeConnection()
        connect.return_value = connection

        result = edit_user(UserEdit(
            password="new-password",
            verification_token="email-token",
        ))

        self.assertEqual(result, {"message": "success"})
        self.assertEqual(
            connection.cursor_value.executions[1][1],
            ("hashed-password", "uid-1"),
        )
        self.assertTrue(connection.committed)
        self.assertTrue(connection.closed)

    @patch(
        "main.verify_password_change_token",
        return_value=("uid-1", "password-change-verification"),
    )
    @patch("main.db.executeQuery", return_value=[(1,)])
    @patch("main.db.connect")
    def test_verifies_unused_email_record(
        self,
        connect,
        execute_query,
        _verify_token,
    ):
        connection = FakeConnection()
        connect.return_value = connection

        self.assertEqual(
            verify_password_change_email("email-token"),
            {"verified": True},
        )
        self.assertEqual(
            execute_query.call_args.args[2],
            ("password-change-verification", "uid-1"),
        )
        self.assertTrue(connection.closed)


if __name__ == "__main__":
    unittest.main()
