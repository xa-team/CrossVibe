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
    user_data = session.get("user")
    user = None
    if user_data:
        user = User.query.get(user_data["id"])
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
    # 1.플랫폼 설정 확인
    platform_config = Config.PLATFORM_OAUTH.get(platform)
    if not platform_config:
        return f"{platform} 콜백은 아직 지원되지 않습니다.", 400

    code = request.args.get("code")
    if not code:
        return "Authorization code가 없습니다.", 400
    
    # 2. 토큰 요청
    token_payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": platform_config["REDIRECT_URI"],
        "client_id": platform_config["CLIENT_ID"],
        "client_secret": platform_config["CLIENT_SECRET"],
    }
    token_res = requests.post(platform_config["TOKEN_URL"], data=token_payload)
    if token_res.status_code != 200:
        return "토큰 요청 실패", 400

    token_data = token_res.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)
    expire_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # 3. 사용자 정보 요청
    user_info_res = requests.get(
        platform_config["USER_INFO_URL"],
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if user_info_res.status_code != 200:
        return "사용자 정보 요청 실패", 400

    user_info = user_info_res.json()
    platform_user_id = user_info.get("id")
    display_name = user_info.get("display_name", "익명의 사용자")

    # 4. 기존 연결 확인
    connection = PlatformConnection.query.filter_by(
        platform=platform,
        platform_user_id=platform_user_id
    ).first()

    if connection:
        user = connection.user
        token = connection.token
        
        #기존 토큰 업데이트
        token.access_token = access_token
        token.refresh_token = refresh_token or token.refresh_token
        token.expire_at = expire_at
        db.session.commit()
        
    else:
        # 5. 새 유저 + 연결 생성성
        user = User(display_name=display_name)
        db.session.add(user)
        db.session.flush() # user.id 확보

        # 토큰 저장
        token = PlatformToken(
            access_token=access_token,
            refresh_token=refresh_token,
            expire_at=expire_at
        )
        db.session.add(token)
        db.session.flush() # token.id 확보

        # 플랫폼 연결 저장
        connection = PlatformConnection(
            user_id=user.id,
            platform=platform,
            platform_user_id=platform_user_id,
            token_id=token.id
        )
        db.session.add(connection)
        db.session.commit()

    # 6. 세션 저장 (멀티플랫폼 대응)
    session_user = session.get("user", {"id": user.id, "platforms": {}})
    session_user["platforms"][platform] = {
        "platform_user_id": platform_user_id,
        "connection_id": connection.id
    }
    session_user["active_platform"] = platform
    session["user"] = session_user
    
    return redirect(url_for("public.home"))

# 테스트용 관리자 권한 설정
@public_bp.route("/make-admin")
def make_admin():
    user_session = session.get("user")
    if not user_session:
        return "세션에 사용자 정보가 없습니다.", 400

    user_id = user_session.get("id")
    if not user_id:
        return "세션에 사용자 ID가 없습니다.", 400

    user = User.query.get(user_id)
    if not user:
        return "DB에서 사용자를 찾을 수 없습니다.", 404

    user.is_admin = True
    db.session.commit()
    return f"{user.display_name or '사용자'}님은 이제 관리자입니다."