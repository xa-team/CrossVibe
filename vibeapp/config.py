import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # .env에서 값 가져오기
    CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
    REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
    SECRET_KEY = os.getenv("SECRET_KEY")