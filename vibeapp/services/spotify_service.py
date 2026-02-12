import requests
from datetime import datetime, time, timezone, timedelta

from vibeapp.config import Config
from vibeapp.extensions import db
from vibeapp.models.playlist import Playlist, Track, PlaylistItem
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
        """사용자 본인의 플레이리스트 가져오기"""

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

    def get_tracks(self, access_token, spotify_playlist_id):
        """ 임의의 유저의 플레이리스트 수록곡 가져오기 """
        url = f"https://api.spotify.com/v1/playlists/{spotify_playlist_id}/tracks"
        headers = {"Authorization": f"Bearer {access_token}"}

        tracks = []
        limit = 50
        offset = 0

        while True:
            params = {"limit": limit, "offset": offset}
            res = requests.get(url, headers = headers, params=params)

            if res.status_code == 429:
                retry_after = int(res.headers.get("Retry-After", 5))
                time.sleep(retry_after)
                continue

            if res.status_code != 200:
                raise PlaylistFetchError(f"수록곡 가져오기 실패: {res.status_code} - {res.text}")

            data = res.json()
            tracks.extend(data.get("items", []))

            if not data.get("next"):
                break
            offset += limit

        return tracks

    def save_tracks_and_link(self, playlist_db_obj, tracks_data):
        """
        수록곡(track) DB 저장 및 PlaylistItem 연결
        :param playlist_db_obj: DB에 저장된 Playlist 객체 (ID 필요)
        :param tracks_data: Spotify API에서 가져온 items 리스트
        """

        PlaylistItem.query.filter_by(playlist_id=playlist_db_obj.id).delete()

        for idx, item in enumerate(tracks_data):
            track_data = item.get("track")

            if not track_data or not track_data.get("id"):
                continue

            spotify_id = track_data.get("id")
            title = track_data.get("name")

            artist_data = track_data.get("artists", [])
            artist = ", ".join([artist["name"] for artist in artist_data])

            album_data = track_data.get("album", {})
            album = album_data.get("name")

            images = album_data.get("images", [])
            if images and len(images) > 0:
                image_url = images[0].get("url")
            else:
                image_url = None

            duration_ms = track_data.get("duration_ms", 0)
            external_urls = track_data.get("external_urls", {})
            external_url = external_urls.get("spotify")

            minutes = duration_ms // 60000
            seconds = (duration_ms % 60000) // 1000
            duration_formatted = f"{minutes}:{seconds:02d}"

            track = Track.query.filter_by(
                platform='spotify',
                platform_track_id=spotify_id
            ).first()

            if not track:
                track = Track(
                    title=title,
                    artist=artist,
                    album=album,
                    duration_ms=duration_ms,
                    duration_formatted=duration_formatted,
                    external_url=external_url,
                    image_url=image_url,
                    platform='spotify',
                    platform_track_id=spotify_id
                    )
                db.session.add(track)

            else:
                track.title = title
                track.artist = artist
                track.album = album
                track.image_url = image_url
                track.external_url=external_url
                track.duration_formatted = duration_formatted

            db.session.flush()

            playlist_item = PlaylistItem(
                playlist_id=playlist_db_obj.id,
                track_id=track.id,
                order=idx,
                added_at=db.func.now()
            )
            db.session.add(playlist_item)

        db.session.commit()
