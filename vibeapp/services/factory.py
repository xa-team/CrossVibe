from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.services.spotify.auth_service import SpotifyAuthService
from vibeapp.services.spotify.playlist_service import SpotifyPlaylistService
from vibeapp.exceptions import UnsupportedPlatformError
#추후 다른 플랫폼 추가 가능

def get_auth_service(platform: str):
    if platform == "spotify":
        return SpotifyAuthService
    #elif platform == "youtube":
    #   return YoutubeAuthService
    else:
        raise UnsupportedPlatformError(f"{platform} 의 인증서비스는 아직 구현되지 않았습니다.")
    
def get_playlist_service(connection: PlatformConnection):
    platform = connection.platform.lower()
    
    if platform == "spotify":
        return SpotifyPlaylistService()
    #elif platform == "youtube";
    #   return YoutubePlaylistService()
    else:
        raise UnsupportedPlatformError(f"{platform} 의 인증서비스는 아직 구현되지 않았습니다.")