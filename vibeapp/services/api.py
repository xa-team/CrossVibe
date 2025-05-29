from vibeapp.services import SpotifyService
from vibeapp.models.platform_connection import PlatformConnection
# 추후 youtube, apple 등도 여기 추가

def get_platform_service(platform_connection:PlatformConnection):
    if platform_connection.platform == "spotify":
        return SpotifyService(platform_connection)
    
    #나중에 확장
    #elif platform_connection.platform == "youtube":
    #   return YoutubeService(platform_connection)
    
    raise ValueError(f"Unsupported platform: {platform_connection.platform}")
