import requests
from flask import Blueprint, redirect, render_template, request, session, url_for
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from vibeapp.config import Config
from vibeapp.extensions import db
from vibeapp.models.user import User

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
    refresh_token = res_data.get("refresh_token")
    expires_in = res_data.get("expires_in", 3600)
    expire_time = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # 사용자 정보 요청
    user_info = requests.get(
        "https://api.spotify.com/v1/me",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()
    
    spotify_id = user_info["id"]
    display_name = user_info.get("display_name", "이름을 모르겠는 익명의 사용자")
    
    # DB에 사용자 존재 여부 확인
    user = User.query.filter_by(spotify_id=spotify_id).first()
    
    if user:
        user.access_token = access_token
        user.display_name = display_name
        user.token_expire_at = expire_time
        if refresh_token: # refres_token은 한 번만 주어질 수도 있음
            user.refresh_token = refresh_token
    else:
        user = User(
            spotify_id = spotify_id,
            display_name = display_name,
            access_token = access_token,
            refresh_token = refresh_token,
            token_expire_at = expire_time
        )
        db.session.add(user)
        
    db.session.commit()
    

    # 세션에 저장 (간단한 정보만)
    session["user"] = {"spotify_id": spotify_id, "display_name": display_name}
    print("세션 상태:", dict(session))
    
    return redirect(url_for("public.home"))