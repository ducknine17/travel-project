import base64
import datetime
import hashlib
import hmac
import json
import os
from pathlib import Path
from typing import Optional

import dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


JWT_ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)
dotenv.load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def _jwt_secret_key() -> str:
    secret_key = os.environ.get("JWT_SECRET_KEY") or os.environ.get("SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY is not configured")
    return secret_key


def _jwt_expire_minutes() -> int:
    return int(os.environ.get("JWT_EXPIRE_MINUTES", "60"))


def _password_change_expire_minutes() -> int:
    return int(os.environ.get("PASSWORD_CHANGE_TOKEN_EXPIRE_MINUTES", "10"))


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(uid: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": uid,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + datetime.timedelta(minutes=_jwt_expire_minutes())).timestamp()),
    }
    return _encode_token(payload)


def create_password_change_token(uid: str, verification_id: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": uid,
        "type": "password_change",
        "jti": verification_id,
        "iat": int(now.timestamp()),
        "exp": int(
            (now + datetime.timedelta(minutes=_password_change_expire_minutes())).timestamp()
        ),
    }
    return _encode_token(payload)


def _encode_token(payload: dict) -> str:
    header = {
        "alg": JWT_ALGORITHM,
        "typ": "JWT",
    }

    encoded_header = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(_jwt_secret_key().encode("utf-8"), signing_input, hashlib.sha256).digest()

    return f"{encoded_header}.{encoded_payload}.{_base64url_encode(signature)}"


def _verify_token(token: str) -> dict:
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


def verify_access_token(token: str) -> dict:
    payload = _verify_token(token)
    # type이 없던 기존 로그인 토큰은 만료 시점까지 호환한다.
    if payload.get("type") not in (None, "access"):
        raise HTTPException(status_code=401, detail="invalid token")
    return payload


def verify_password_change_token(token: str) -> tuple[str, str]:
    payload = _verify_token(token)
    uid = payload.get("sub")
    verification_id = payload.get("jti")
    if (
        payload.get("type") != "password_change"
        or not isinstance(uid, str)
        or not uid
        or not isinstance(verification_id, str)
        or not verification_id.startswith("password-change-")
    ):
        raise HTTPException(status_code=403, detail="email verification failed")
    return uid, verification_id


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    if credentials is None:
        raise HTTPException(status_code=401, detail="authentication required")

    payload = verify_access_token(credentials.credentials)
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="invalid token")

    return uid
