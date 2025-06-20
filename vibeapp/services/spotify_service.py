import requests
from datetime import datetime, time, timezone, timedelta

from vibeapp.config import Config
from vibeapp.extensions import db
from vibeapp.models.playlist import Playlist
from vibeapp.exceptions import PlaylistFetchError, TokenRefreshError

class SpotifyService:
    """Spotify API와 직접 통신하는 서비스"""
    
    def refresh_token(self, connection):
        """토큰 갱신"""
        token = connection.token
        
        if token.expire_at and token.expire_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
            return token.access_token
        
        if not token.refresh_token:
            raise TokenRefreshError("Refresh token is missing")
        
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": token.refresh_token,
            "client_id": Config.PLATFORM_OAUTH["spotify"]["CLIENT_ID"],
            "client_secret": Config.PLATFORM_OAUTH["spotify"]["CLIENT_SECRET"],
        }
        
        res = requests.post(Config.PLATFORM_OAUTH["spotify"]["TOKEN_URL"], data=payload)
        if res.status_code != 200:
            raise TokenRefreshError("Token refresh failed")
        
        res_data = res.json()
        token.access_token = res_data["access_token"]
        
        new_refresh_token = res_data.get("refresh_token")
        if new_refresh_token:
            token.refresh_token = new_refresh_token

        expires_in = res_data.get("expires_in", 3600)
        token.expire_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        db.session.commit()
        return token.access_token
    
    def get_playlists(self, access_token):
        """플레이리스트 가져오기"""
        url = "https://api.spotify.com/v1/me/playlists"
        headers = {"Authorization": f"Bearer {access_token}"}
        playlists = []
        limit = 50
        offset = 0

        while True:
            params = {"limit": limit, "offset": offset}
            res = requests.get(url, headers=headers, params=params)

            if res.status_code == 429:
                retry_after = int(res.headers.get("Retry-After", 5))
                time.sleep(retry_after)
                continue

            if res.status_code != 200:
                raise PlaylistFetchError(f"플레이리스트 가져오기 실패: {res.status_code} - {res.text}")

            data = res.json()
            playlists.extend(data.get("items", []))

            if not data.get("next"):
                break
            offset += limit

        return playlists
    
    def save_playlists(self, connection, playlists_data):
        """플레이리스트 DB 저장"""
        for item in playlists_data:
            external_id = item["id"]
            name = item["name"]
            snapshot_id = item.get("snapshot_id")
            is_public = item.get("public", True)

            existing = Playlist.query.filter_by(
                platform=connection.platform,
                platform_user_id=connection.platform_user_id,
                spotify_id=external_id
            ).first()

            if existing:
                existing.name = name
                existing.snapshot_id = snapshot_id
                existing.is_public = is_public
            else:
                new_playlist = Playlist(
                    external_id=external_id,
                    spotify_id=external_id,
                    name=name,
                    snapshot_id=snapshot_id,
                    is_public=is_public,
                    platform=connection.platform,
                    platform_user_id=connection.platform_user_id,
                    platform_connection_id=connection.id
                )
                db.session.add(new_playlist)

        db.session.commit()