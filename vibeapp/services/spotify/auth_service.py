import requests
from datetime import datetime, timezone, timedelta

from vibeapp.config import Config
from vibeapp.extensions import db
from vibeapp.models.platform_token import PlatformToken
from vibeapp.services.base_auth_service import BaseAuthService


class SpotifyAuthService(BaseAuthService):
    @staticmethod
    def refresh_token(token: PlatformToken) -> str:
        if token.expire_at and token.expire_at > datetime.now(timezone.utc):
            return token.access_token

        if not token.refresh_token:
            raise ValueError("Refresh token is missing")

        payload = {
            "grant_type": "refresh_token",
            "refresh_token": token.refresh_token,
            "client_id": Config.PLATFORM_OAUTH["spotify"]["CLIENT_ID"],
            "client_secret": Config.PLATFORM_OAUTH["spotify"]["CLIENT_SECRET"],
        }
        res = requests.post(Config.PLATFORM_OAUTH["spotify"]["TOKEN_URL"], data=payload)
        if res.status_code != 200:
            raise RuntimeError("Token refresh failed")

        res_data = res.json()
        token.access_token = res_data["access_token"]

        new_refresh_token = res_data.get("refresh_token")
        if new_refresh_token:
            token.refresh_token = new_refresh_token

        expires_in = res_data.get("expires_in", 3600)
        token.expire_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        db.session.commit()
        return token.access_token