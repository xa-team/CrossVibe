import requests
from flask import Blueprint, redirect, render_template, request, session, url_for
from urllib.parse import urlencode

from vibeapp.config import Config

public_bp = Blueprint(
    "public",
    __name__,
    
    #Blueprint가 각자 독립적인 template 디렉토리 사용을 위해 template_folder 옵션 명시
    template_folder="templates"
)


# 초기화면 라우터
@public_bp.route("/")
def home():
    user = session.get("user")
    return render_template("home.html", user=user)
    

# 로그인 라우터
@public_bp.route("/login")
def login():
    scope = "user-read-private user-read-email"
    auth_url = "https://accounts.spotify.com/authorize"
    params = {
        "client_id": Config.CLIENT_ID,
        "response_type": "code",
        "redirect_uri": Config.REDIRECT_URI,
        "scope": scope,
        "show_dialog": "true",
    }
    return redirect(f"{auth_url}?{urlencode(params)}")

# 로그아웃 라우터
@public_bp.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("public.home"))

# 콜백 라우터
@public_bp.route("/callback")
def callback():
    code = request.args.get("code")

    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": Config.REDIRECT_URI,
        "client_id": Config.CLIENT_ID,
        "client_secret": Config.CLIENT_SECRET,
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
    print("세션 상태:", dict(session))
    return redirect(url_for("public.home"))