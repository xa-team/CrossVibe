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
    if platform == "spotify":
        scope = "user-read-private user-read-email"
        params = {
            "client_id": Config.CLIENT_ID,
            "response_type": "code",
            "redirect_uri": url_for("public.callback_platform", platform=platform, _external=True),
            "scope": scope,
            "show_dialog": "true",
        }
        auth_url = "https://accounts.spotify.com/authorize"
        return redirect(f"{auth_url}?{urlencode(params)}")
    
    #elif platform == "Youtube":
    
    return f"{platform} 로그인은 아직 지원되지 않습니다.", 400

# 로그아웃 라우터
@public_bp.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("public.home"))

# 콜백 라우터
@public_bp.route("/callback/<platform>")
def callback_platform(platform):
    if platform == "spotify":
        code = request.args.get("code")

        token_url = "https://accounts.spotify.com/api/token"
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": url_for("public.callback_platform", platform=platform, _external=True),
            "client_id": Config.CLIENT_ID,
            "client_secret": Config.CLIENT_SECRET,
        }

        # 토큰 요청
        res = requests.post(token_url, data=payload)
        if res.status_code != 200:
            return "Token 요청 실패", 400
        
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
    
        # User 생성 또는 업데이트
        user = User.query.filter_by(spotify_id=spotify_id).first()

        if not user:
            user = User(display_name=display_name)
            db.session.add(user)
            db.session.flush() # user.id 확보
            
        #PlatformToken 저장
        token = PlatformToken(
            access_token=access_token,
            refresh_token=refresh_token,
            expire_at=expire_time
        )
        db.session.add(token)
        db.session.flush()
        
        #PlatformConnection 저장
        connection = PlatformConnection(
            user_id=user.id,
            platform="spotify",
            toekn_id=token.id
        )
        db.session.add(connection)
        db.session.commit()
    
        # 세션에 저장 (간단한 정보만)
        session["user"] = {"id": user.id, "platform": "spotify"}
        return redirect(url_for("public.home"))
    
    #elif platform == "Youtube":
    
    else:
        return f"{platform} 콜백은 아직 지원되지 않습니다.", 400