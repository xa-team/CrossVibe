from flask import json
import requests
import time

from vibeapp.extensions import db
from vibeapp.models.platform_token import PlatformToken
from vibeapp.models.playlist import Playlist
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.services.base_playlist_service import BasePlaylistService
# from vibeapp.services.spotify.auth_service import 
from vibeapp.exceptions import PlaylistFetchError
from vibeapp.services.spotify.auth_service import SpotifyAuthService

class SpotifyPlaylistService(BasePlaylistService):
    def __init__(self, connection: PlatformConnection):
        self.connection = connection
        self.token: PlatformToken = connection.token
        self.token.access_token = SpotifyAuthService.refresh_token(self.connection)

    def get_playlists(self) -> list:
        url = "https://api.spotify.com/v1/me/playlists"
        headers = {"Authorization": f"Bearer {self.token.access_token}"}
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

    def save_or_update_playlists(self, playlists_data: list) -> None:
        for item in playlists_data:
            external_id = item["id"]
            name = item["name"]
            snapshot_id = item.get("snapshot_id")
            is_public = item.get("public", True)

            existing = Playlist.query.filter_by(
                platform=self.connection.platform,
                platform_user_id=self.connection.platform_user_id,
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
                    platform=self.connection.platform,
                    platform_user_id=self.connection.platform_user_id,
                    platform_connection_id=self.connection.id
                )
                db.session.add(new_playlist)

        db.session.commit()