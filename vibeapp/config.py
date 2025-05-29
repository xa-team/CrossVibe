import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # .env에서 값 가져오기
    SECRET_KEY = os.getenv("SECRET_KEY")
    
    #SQLite DB 설정
    SQLALCHEMY_DATABASE_URI = 'sqlite:///users.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    #플랫폼별 OAuth 설정
    PLATFORM_OAUTH = {
        "spotify": {
            "CLIENT_ID": os.getenv("SPOTIFY_CLIENT_ID"),
            "CLIENT_SECRET": os.getenv("SPOTIFY_CLIENT_SECRET"),
            "REDIRECT_URI": os.getenv("SPOTIFY_REDIRECT_URI"),
            "AUTH_URL": "https://accounts.spotify.com/authorize",
            "TOKEN_URL": "https://accounts.spotify.com/api/token",
            "USER_INFO_URL": "https://api.spotify.com/v1/me",
            "PARAMS": {
                "response_type": "code",
                "scope": "user-read-private user-read-email",
                "show_dialog": "true"
            },
        },
        "youtube": {
            "CLIENT_ID": os.getenv("YOUTUBE_CLIENT_ID"),
            "CLIENT_SECRET": os.getenv("YOUTUBE_CLIENT_SECRET"),
            "REDIRECT_URI": os.getenv("YOUTUBE_REDIRECT_URI"),
            "AUTH_URL": "https://accounts.google.com/o/oauth2/auth",
            "TOKEN_URL": "https://oauth2.googleapis.com/token",
            "USER_INFO_URL": "https://www.googleapis.com/oauth2/v2/userinfo",
            "PARAMS": {
                "access_type": "offline",
                "include_granted_scopes": "true",
                "response_type": "code",
                "scope": "https://www.googleapis.com/auth/youtube.readonly",
                "prompt": "consent"
            }
        },
        # "applemusic": {...},
    }