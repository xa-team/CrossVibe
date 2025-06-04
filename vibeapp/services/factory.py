from vibeapp.services.spotify.auth_service import SpotifyAuthService
#추후 다른 플랫폼 추가 가능

def get_auth_service(platform: str):
    if platform == "spotify":
        return SpotifyAuthService
    #elif platform == "youtube":
    #   return YoutubeAuthService
    else:
        raise NotImplementedError(f"{platform} AuthService is not implemented.")