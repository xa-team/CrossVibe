from vibeapp.services.spotify_service import SpotifyService
from vibeapp.services.auth_service import AuthService
from vibeapp.exceptions import UnsupportedPlatformError

class PlaylistService:
    """플랫폼별 플레이리스트를 관리하는 서비스"""
    
    def __init__(self, spotify_service=None, auth_service=None):
        self.spotify = spotify_service or SpotifyService()
        self.auth = auth_service or AuthService(self.spotify) #같은 spotify_service
        
        
    def get_and_save_playlists(self, connection):
        """플레이리스트 가져와서 저장"""
        platform = connection.platform.lower()
        
        if platform == "spotify":
            #토큰 갱신
            access_token = self.auth.refresh_token(connection)
            #플레이리스트 가져오기
            playlists_data = self.spotify.get_playlists(access_token)
            #DB 저장
            self.spotify.save_playlists(connection, playlists_data)
            
            return playlists_data
        
        else:
            raise UnsupportedPlatformError(f"{platform} 플레이리스트는 지원되지 않습니다.")