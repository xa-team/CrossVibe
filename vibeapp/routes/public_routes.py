import requests
from flask import Blueprint, jsonify, redirect, render_template, request, session, url_for
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from flask_login import current_user, login_required, login_user, logout_user

from vibeapp.config import Config
from vibeapp.extensions import db
from vibeapp.models.user import User
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.models.platform_token import PlatformToken
from vibeapp.models.playlist import Playlist
from vibeapp.models.friend import Friend
from vibeapp.exceptions import UnsupportedPlatformError, TokenRefreshError
from vibeapp.utils.auth_utils import get_current_user_safely, require_user_safely


public_bp = Blueprint("public", __name__,)


@public_bp.route("/")
def home():
    """홈페이지 - 로그인 상태에 따라 다른 화면 표시"""
    user = None
    pending_requests_count = 0
    
    if current_user.is_authenticated:
        user = get_current_user_safely()
        if user:
            pending_requests_count = user.get_pending_friend_requests_count()
    
    return render_template("public/home.html", user=user, pending_requests_count=pending_requests_count)
    

# ===== 사용자 설정 관련 =====

@public_bp.route("/settings")
@require_user_safely()
def settings(user):
    """사용자 설정 페이지"""
    return render_template("user/settings.html", user=user)


@public_bp.route("/set-username")
@require_user_safely()
def set_username_page(user):
    """사용자명 설정 페이지"""
    #이미 사용자명이 있으면 설정 페이지로 리다이렉트
    if user.username:
        return redirect(url_for("public.settings"))
    
    return render_template("user/set_username.html", user=user)



@public_bp.route("/update-username", methods=["POST"])
@require_user_safely()
def update_username(user):
    """사용자명 설정/변경 처리"""
    try:
        data = request.get_json()
        new_username = data.get("username", "").strip()
        
        if not new_username:
            return jsonify({"error": "사용자명을 입력해주세요."}), 400
        
        # 사용자명 유효성 검사 (영문, 숫자, 언더스코어만 허용, 3-20자)
        import re
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', new_username):
            return jsonify({"error": "사용자명은 영문, 숫자, 언더스코어만 사용하여 3-20자로 입력해주세요."}), 400
        
        # 중복 확인 (자신 제외)
        existing_user = User.query.filter(
            User.username == new_username,
            User.id != user.id
        ).first()
        
        if existing_user:
            return jsonify({"error": "이미 사용중인 사용자명입니다."}), 400
        
        # 사용자명 업데이트
        user.username = new_username
        db.session.commit()
        
        return jsonify({"success": True, "message": "사용자명이 설정되었습니다!"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "사용자명 설정 중 오류가 발생했습니다."}), 500
    


# ===== 인증 관련
@public_bp.route("/login/<platform>")
def login_platform(platform):
    """플랫폼별 OAuth 로그인 시작"""
    platform_config = Config.PLATFORM_OAUTH.get(platform)
    if not platform_config:
        raise UnsupportedPlatformError(f"{platform}은(는) 아직 지원하지 않는 플랫폼입니다.", 400)
    
    params = {
        **platform_config["PARAMS"],
        "client_id": platform_config["CLIENT_ID"],
        "redirect_uri": platform_config["REDIRECT_URI"],
    }

    auth_url = platform_config["AUTH_URL"]
    return redirect(f"{auth_url}?{urlencode(params)}")
    
    #elif platform == "Youtube":
    

@public_bp.route("/logout")
def logout():
    """로그아웃 처리"""
    logout_user()
    session.pop("user", None)
    return redirect(url_for("public.home"))


@public_bp.route("/callback/<platform>")
def callback_platform(platform):
    """OAuth 콜백 처리"""
    # 1.플랫폼 설정 확인
    platform_config = Config.PLATFORM_OAUTH.get(platform)
    if not platform_config:
        raise UnsupportedPlatformError(f"{platform} 콜백은 아직 지원되지 않습니다.", 400)

    code = request.args.get("code")
    if not code:
        raise TokenRefreshError("Authorization code가 없습니다.", 400)
    
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
        raise TokenRefreshError(f"토큰 요청 실패", 400)

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
        print("📡 user_info_res.status:", user_info_res.status_code)
        print("📡 user_info_res.text:", user_info_res.text) 
        raise TokenRefreshError(f"사용자 정보 요청 실패", 400)

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
        # 5. 새 유저 + 연결 생성
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

    login_user(user)
    

    # 6. 세션 저장 (멀티플랫폼 대응)
    session_user = session.get("user", {"id": user.id, "platforms": {}})
    session_user["platforms"][platform] = {
        "platform_user_id": platform_user_id,
        "connection_id": connection.id
    }
    session_user["active_platform"] = platform
    session["user"] = session_user

    # 사용자명이 없으면 설정 페이지로 리다이렉트
    if not user.username:
        return redirect(url_for("public.set_username_page"))

    return redirect(url_for("public.home"))


# ===== 개발/테스트용 =====
@public_bp.route("/make-admin")
@login_required
def make_admin(user):
    """테스트용 관리자 권한 설정"""
    user.is_admin = True
    db.session.commit()
    return f"{user.display_name or '사용자'}님은 이제 관리자입니다."