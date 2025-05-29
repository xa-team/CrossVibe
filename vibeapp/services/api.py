from vibeapp.services import SpotifyService
from vibeapp.models.platform_connection import PlatformConnection
# 추후 youtube, apple 등도 여기 추가

def get_platform_service(connection:PlatformConnection):
    if connection.platform == "spotify":
        return SpotifyService(connection)
    
    #나중에 확장
    #elif connection.platform == "youtube":
    #   return YoutubeService(connection)
    
    raise ValueError(f"Unsupported platform: {connection.platform}")
