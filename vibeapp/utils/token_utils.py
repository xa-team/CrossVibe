# vibeapp/utils/token_utils.py
import requests
from datetime import datetime, timezone

from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.services.api import get_auth_service

def refresh_access_token(connection: PlatformConnection) -> str:
    token = connection.token

    # 토큰이 아직 유효하면 반환
    if token.expire_at and token.expire_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        return token.access_token

    auth_service = get_auth_service(connection.platform)
    return auth_service.refresh_token(token)