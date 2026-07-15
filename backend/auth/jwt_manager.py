import base64
import datetime
import hashlib
import hmac
import json
import os

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


JWT_ALGORITHM = "HS256"


def _jwt_secret_key() -> str:
    return os.environ.get("JWT_SECRET_KEY") or os.environ.get("SECRET_KEY") or "change-this-jwt-secret"


def _jwt_expire_minutes() -> int:
    return int(os.environ.get("JWT_EXPIRE_MINUTES", "60"))


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(uid: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": uid,
        "iat": int(now.timestamp()),
        "exp": int((now + datetime.timedelta(minutes=_jwt_expire_minutes())).timestamp()),
    }
    header = {
        "alg": JWT_ALGORITHM,
        "typ": "JWT",
    }

    encoded_header = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(_jwt_secret_key().encode("utf-8"), signing_input, hashlib.sha256).digest()

    return f"{encoded_header}.{encoded_payload}.{_base64url_encode(signature)}"


def verify_access_token(token: str) -> dict:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_signature = hmac.new(_jwt_secret_key().encode("utf-8"), signing_input, hashlib.sha256).digest()
        signature = _base64url_decode(encoded_signature)

        if not hmac.compare_digest(signature, expected_signature):
            raise ValueError("invalid signature")

        header = json.loads(_base64url_decode(encoded_header))
        payload = json.loads(_base64url_decode(encoded_payload))

        if header.get("alg") != JWT_ALGORITHM:
            raise ValueError("invalid algorithm")

        now = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        if payload.get("exp") is None or payload["exp"] < now:
            raise ValueError("expired token")

        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token")


def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    payload = verify_access_token(credentials.credentials)
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="invalid token")

    return uid
