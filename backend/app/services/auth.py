from datetime import datetime, timedelta, timezone
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import jwt, JWTError
from app.core.config import settings


class AuthService:
    @staticmethod
    def verify_google_token(token: str) -> dict:
        """Verifies Google ID token and returns user info."""
        try:
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            return {
                "email": idinfo["email"],
                "full_name": idinfo.get("name", idinfo["email"]),
                "oauth_sub": idinfo["sub"]
            }
        except ValueError:
            # Invalid token
            return None

    @staticmethod
    def create_access_token(data: dict) -> str:
        """Creates an app-level JWT."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def decode_access_token(token: str) -> dict:
        """Decodes and validates an app-level JWT."""
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None


auth_service = AuthService()
