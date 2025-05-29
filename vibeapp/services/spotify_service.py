import requests

from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.models.platform_token import PlatformToken
from vibeapp.extensions import db
from vibeapp.utils.token_utils import refresh_access_token


class SpotifyService:
    def __init__(self, platform_connection: PlatformConnection):
        self.connection = platform_connection
        self.token: PlatformToken = platform_connection.token
        self.access_token = refresh_access_token(self.token)
        
    def get_playlist(self):
        url = "http://api.spotify.com/v1/me/playlists"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        playlists = []
        limit = 50
        offset = 0
        
        while True:
            params = {"limit": limit, "offset": offset}
            res = requests.get(url, headers=headers, params=params)
            
            if res.status_code != 200:
                raise RuntimeError("Spotify API 요청 실패")
            
            data = res.json()
            playlists.extend(data.get("items", []))
            
            if data.get("next") is None:
                break;
            offset += limit
            
        return playlists