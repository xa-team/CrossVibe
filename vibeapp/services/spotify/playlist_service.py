import requests
import time

from vibeapp.extensions import db
from vibeapp.utils.token_utils import refresh_access_token
from vibeapp.models.playlist import Playlist
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.services.base_playlist_service import BasePlaylistService

class SpotifyPlaylistService(BasePlaylistService):
    def get_playlists(self, connection: PlatformConnection) -> list:
        access_token = refresh_access_token(connection)
        url = "https://api.spotify.com/v1/me/playlists"
        headers = {"Authorization": f"Bearer {access_token}"}
        playlists = []
        
        while url:
            res = requests.get(url, headers=headers)
            
            if res.status_code == 429:
                retry_after = int(res.headers.get("Retry-After", 5))
                time.sleep(retry_after)
                continue
             
            if res.status_code != 200:
                raise RuntimeError(f"플레이리스트 가져오기 실패: {res.status_code} - {res.text}")
            
            data = res.json()
            playlists.extend(data.get("items", []))
            url = data.get("next")
            
        return playlists
    

    def save_or_update_playlists(self, connection: PlatformConnection, playlists_data: list) -> None:
        for item in playlists_data:
            spotify_id = item["id"]
            name = item["name"]
            snapshot_id = item.get("snapshot_id")
            is_public = item.get("public", True)
            
            existing = Playlist.query.filter_by(
                platform=connection.platform,
                platform_user_id=connection.platform_user_id,
                spotify_id=spotify_id
            ).first()
            
            if existing:
                existing.name = name
                existing.snapshot_id = snapshot_id
                existing.is_public = is_public
            else:
                new_playlist = Playlist(
                    platform=connection.platform,
                    platform_user_id=connection.platform_user_id,
                    spotify_id=spotify_id,
                    name=name,
                    snapshot_id=snapshot_id,
                    is_public=is_public,
                    platform_connection_id=connection.id
                )
                db.session.add(new_playlist)
                
        db.session.commit()