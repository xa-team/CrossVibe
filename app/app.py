from flask import Flask, redirect, render_template, request, session, url_for
import requests
import os
from dotenv import load_dotenv
from urllib.parse import urlencode

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)  # 세션 암호화용

# .env에서 값 가져오기
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

# 초기화면 라우터
@app.route("/")
def index():
    user = session.get("user")
    return render_template("index.html", user=user)
    

# 로그인 라우터
@app.route("/login")
def login():
    scope = "user-read-private user-read-email"
    auth_url = "https://accounts.spotify.com/authorize"
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": scope,
        "show_dialog": "true",
    }
    return redirect(f"{auth_url}?{urlencode(params)}")

# 로그아웃 라우터
@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("index"))

# 콜백 라우터
@app.route("/callback")
def callback():
    code = request.args.get("code")

    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    # 토큰 요청
    res = requests.post(token_url, data=payload)
    res_data = res.json()
    access_token = res_data.get("access_token")

    # 사용자 정보 요청
    user_info = requests.get(
        "https://api.spotify.com/v1/me",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    # 세션에 저장
    session["user"] = user_info
    return render_template("index.html", user=session["user"])

if __name__ == "__main__":
    app.run(debug=True)