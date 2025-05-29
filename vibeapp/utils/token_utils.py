import requests
from datetime import datetime, timezone, timedelta

from vibeapp.config import Config
from vibeapp.extensions import db
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.models.platform_token import PlatformToken


def refresh_access_token(connection: PlatformToken) -> str:
    token = connection.token
    
    #만료되지 않았다면 기존 토큰 반환    
    if token.expire_at and token.expire_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        return token.access_token # 아직 유효함
    
    if not token.refresh_token:
        raise ValueError("Refresh token is missing")
    
    #플랫폼 별 로직 분기
    #Spotify
    if connection.platform == "spotify":
        token_url = "https://accounts.spotify.com/api/token"
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": token.refresh_token,
            "client_id": Config.CLIENT_ID,
            "client_secret": Config.CLIENT_SECRET,
        }
    
        res = requests.post(token_url, data=payload)
        if res.status_code != 200:
            raise RuntimeError("Token refresh failed")
    
        res_data = res.json()
        token.access_token = res_data.get("access_token")
    
        new_refresh_token = res_data.get("refresh_token")
        if new_refresh_token:
            token.refresh_token = new_refresh_token
        
        expires_in = res_data.get("expires_in", 3600)
        token.expire_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    
        db.session.commit()
    
    #Youtube
    #elif connection.platform == "youtube":
    
    else:
        raise NotImplementedError("Token refresh not implemented for this platform")
    
    return token.access_token