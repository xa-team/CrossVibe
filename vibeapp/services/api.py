from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.exceptions import UnsupportedPlatformError
# 추후 youtube, apple 등도 여기 추가

def get_playlist_service(connection:PlatformConnection):
    from vibeapp.services.spotify.playlist_service import SpotifyPlaylistService
    platform = connection.platform.lower()
    if platform == "spotify":
        return SpotifyPlaylistService(connection)
    
    #나중에 확장
    #elif platform == "youtube":
    #   return YoutubeService()
    
    raise UnsupportedPlatformError(f"{platform}은 지원하지 않는 플랫폼입니다.")

def get_auth_service(platform: str):
    from vibeapp.services.spotify.auth_service import SpotifyAuthService
    if platform == "spotify":
        return SpotifyAuthService()
    #elif platform == "youtube":
    #   return YoutubeAuthService()
    else:
        raise UnsupportedPlatformError(f"{platform} 의 인증서비스는 아직 구현되지 않았습니다.")