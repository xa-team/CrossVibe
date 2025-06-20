from vibeapp.services.spotify_service import SpotifyService
from vibeapp.exceptions import UnsupportedPlatformError

class AuthService:
    """플랫폼별 인증을 관리하는 서비스"""
    
    def __init__(self, spotify_service=None):
        self.spotify = spotify_service or SpotifyService()

    
    def refresh_token(self, connection):
        """플랫폼에 따라 토큰 갱신"""
        platform = connection.platform.lower()
        
        if platform == "spotify":
            return self.spotify.refresh_token(connection)
        #elif platform == "youtube":
        #   return self.youtube.refresh_token(connection)
        else:
            raise UnsupportedPlatformError(f"{platform} 인증은 지원되지 않습니다.")