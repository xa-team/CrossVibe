import requests
import time

from vibeapp.utils.token_utils import refresh_access_token
from vibeapp.models.user import User

def get_user_playlists(user: User) -> dict:
    #토큰 자동 갱신
    access_token = refresh_access_token(user)
    
    url = "https://api.spotify.com/v1/me/playlists"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    playlists = []

    while url:
        res = requests.get(url, headers=headers)

        if res.status_code == 429:
            # Spotify Rate Limit: 기다릴 시간 (초)
            retry_after = int(res.headers.get("Retry-After", 5))
            print(f"Rate limit exceeded. Retrying after {retry_after} seconds...")
            time.sleep(retry_after)
            continue  # 재요청

        elif res.status_code != 200:
            raise RuntimeError(f"플레이리스트 가져오기 실패: {res.status_code} - {res.text}")

        data = res.json()
        playlists.extend(data.get("items", []))
        url = data.get("next")  # 다음 페이지 URL (없으면 None)

    return playlists