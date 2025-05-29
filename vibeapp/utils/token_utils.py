import requests
from datetime import datetime, timezone, timedelta

from vibeapp.config import Config
from vibeapp.models.user import User
from vibeapp.extensions import db
from vibeapp.config import Config

def refresh_access_token(user: User) -> str:
    if user.token_expire_at and user.token_expire_at > datetime.now(timezone.utc):
        return user.access_token # 아직 유효함
    
    if not user.refresh_token:
        raise ValueError("Refresh token is missing")
    
    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": user.refresh_token,
        "client_id": Config.CLIENT_ID,
        "client_secret": Config.CLIENT_SECRET,
    }
    
    res = requests.post(token_url, data=payload)
    if res.status_code != 200:
        raise RuntimeError("Token refresh failed")
    
    res_data = res.json()
    user.access_token = res_data.get("access_token")
    
    new_refresh_token = res_data.get("refresh_token")
    if new_refresh_token:
        user.refresh_token = new_refresh_token
        
    expires_in = res_data.get("expires_in", 3600)
    user.token_expire_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    
    db.session.commit()
    
    return user.access_token