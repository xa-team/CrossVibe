import requests
from flask import Blueprint, redirect, render_template, request, session, url_for
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from vibeapp.config import Config
from vibeapp.extensions import db
from vibeapp.models.user import User
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.models.platform_token import PlatformToken
from vibeapp.utils import refresh_access_token

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
@public_bp.route("/login/<platform>")
def login_platform(platform):
    platform_config = Config.PLATFORM_OAUTH.get(platform)
    if not platform_config:
        return f"{platform}은(는) 아직 지원하지 않는 플랫폼입니다.", 400
    
    params = {
        **platform_config["PARAMS"],
        "client_id": platform_config["CLIENT_ID"],
        "redirect_uri": platform_config["REDIRECT_URI"],
    }

    auth_url = platform_config["AUTH_URL"]
    return redirect(f"{auth_url}?{urlencode(params)}")
    
    #elif platform == "Youtube":
    

# 로그아웃 라우터
@public_bp.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("public.home"))

# 콜백 라우터
@public_bp.route("/callback/<platform>")
def callback_platform(platform):
    platform_config = Config.PLATFORM_OAUTH.get(platform)
    if not platform_config:
        return f"{platform} 콜백은 아직 지원되지 않습니다.", 400

    code = request.args.get("code")
    token_url = platform_config["TOKEN_URL"]

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": platform_config["REDIRECT_URI"],
        "client_id": platform_config["CLIENT_ID"],
        "client_secret": platform_config["CLIENT_SECRET"],
    }
    # 토큰 요청
    res = requests.post(token_url, data=payload)
    if res.status_code != 200:
        return "토큰 요청 실패", 400

    res_data = res.json()
    access_token = res_data.get("access_token")
    refresh_token = res_data.get("refresh_token")
    expires_in = res_data.get("expires_in", 3600)
    expire_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # 사용자 정보 요청
    user_info_res = requests.get(
        platform_config["USER_INFO_URL"],
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if user_info_res.status_code != 200:
        return "사용자 정보 요청 실패", 400

    user_info = user_info_res.json()
    platform_user_id = user_info.get("id")
    display_name = user_info.get("display_name", "익명의 사용자")

    # 기존 유저 존재 여부 확인 (플랫폼 ID 기반 연결)
    connection = PlatformConnection.query.filter_by(
        platform=platform,
        platform_user_id=platform_user_id
    ).first()

    if connection:
        user = connection.user
    else:
        user = User(display_name=display_name)
        db.session.add(user)
        db.session.flush()

    # 토큰 저장
    token = PlatformToken(
        access_token=access_token,
        refresh_token=refresh_token,
        token_expire_at=expire_at
    )
    db.session.add(token)
    db.session.flush()

    # 플랫폼 연결 저장
    new_connection = PlatformConnection(
        user_id=user.id,
        platform=platform,
        platform_user_id=platform_user_id,
        token_id=token.id
    )
    db.session.add(new_connection)
    db.session.commit()

    # 세션에 저장
    session["user"] = {"id": user.id, "platform": platform}
    return redirect(url_for("public.home"))