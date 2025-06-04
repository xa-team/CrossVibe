from vibeapp.services.spotify.service import SpotifyService
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.exceptions import UnsupportedPlatformError
# 추후 youtube, apple 등도 여기 추가

def get_platform_service(connection:PlatformConnection):
    platform = connection.platform.lower()
    if platform == "spotify":
        return SpotifyService(connection)
    
    #나중에 확장
    #elif platform == "youtube":
    #   return YoutubeService(connection)
    
    raise UnsupportedPlatformError(f"{platform}은 지원하지 않는 플랫폼입니다.")