# vibeapp/utils/token_utils.py
import requests
from datetime import datetime, timezone

from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.services.spotify_auth_service import SpotifyAuthService

def refresh_access_token(connection: PlatformConnection) -> str:
    token = connection.token

    # 토큰이 아직 유효하면 반환
    if token.expire_at and token.expire_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        return token.access_token

    # 플랫폼에 따라 갱신 처리
    if connection.platform == "spotify":
        return SpotifyAuthService.refresh_token(token)

    # 추후 다른 플랫폼 추가
    #elif connection.platform == "youtube":
    
    raise NotImplementedError("Token refresh not implemented for this platform")