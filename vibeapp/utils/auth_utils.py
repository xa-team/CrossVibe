# vibeapp/utils/auth_utils.py - 인증 관련 유틸리티 함수들

from functools import wraps
from flask import abort, session, redirect, url_for, flash
from flask_login import current_user, logout_user

from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.models.user import User


def get_current_connection():
    """현재 활성 플랫폼 연결 정보 반환"""
    user_data = session.get("user")
    if not user_data:
        return None

    platforms = user_data.get("platforms", {})
    active_platform = user_data.get("active_platform")
    platform_info = platforms.get(active_platform)
    if not platform_info:
        return None

    connection_id = platform_info.get("connection_id")
    if not connection_id:
        return None

    return PlatformConnection.query.get(connection_id)


def get_current_user_safely():
    """
    안전하게 현재 사용자 객체를 가져오는 함수
    
    Returns:
        User: 현재 사용자 객체 또는 None
        
    Note:
        - 세션과 DB 상태 불일치 시 자동으로 세션 정리
        - Flask-Login current_user와 세션 user 모두 고려
    """
    user_data = session.get("user")
    current_user_obj = None
    
    # 1. 세션에서 사용자 조회
    if user_data and "id" in user_data:
        current_user_obj = User.query.get(user_data["id"])
        
        # 세션의 사용자가 DB에 없으면 세션 정리
        if not current_user_obj:
            session.pop("user", None)
            logout_user()
            return None
    
    # 2. 세션에 없으면 current_user 사용
    if not current_user_obj and current_user.is_authenticated:
        current_user_obj = current_user
    
    return current_user_obj


def require_user_safely(redirect_to="public.home"):
    """
    안전한 사용자 인증 데코레이터
    
    Args:
        redirect_to: 인증 실패 시 리다이렉트할 엔드포인트
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user_safely()
            
            if not user:
                flash("로그인이 만료되었습니다. 다시 로그인해주세요.", "warning")
                return redirect(url_for(redirect_to))
            
            # 함수에 user 객체를 전달
            return f(user, *args, **kwargs)
        return decorated_function
    return decorator


def require_username(redirect_to="public.set_username_page"):
    """사용자명이 설정된 사용자만 접근 가능한 데코레이터"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user_safely()
            
            if not user:
                flash("로그인이 필요합니다.", "warning")
                return redirect(url_for("public.home"))
            
            if not user.username:
                flash("먼저 사용자명을 설정해주세요.", "info")
                return redirect(url_for(redirect_to))
            
            return f(user, *args, **kwargs)
        return decorated_function
    return decorator


def validate_session_consistency():
    """
    세션과 DB 상태 일관성 검증
    
    Returns:
        dict: 검증 결과 {'valid': bool, 'user': User|None, 'message': str}
    """
    user = get_current_user_safely()
    
    if not user:
        return {
            'valid': False, 
            'user': None, 
            'message': '사용자 인증이 필요합니다.'
        }
    
    # 추가 검증 로직 (필요시)
    user_data = session.get("user", {})
    if user_data.get("id") != user.id:
        return {
            'valid': False,
            'user': None,
            'message': '세션 정보가 일치하지 않습니다.'
        }
    
    return {
        'valid': True,
        'user': user,
        'message': '인증 성공'
    }


def cleanup_invalid_session():
    """무효한 세션 정보 정리"""
    try:
        session.pop("user", None)
        logout_user()
        return True
    except Exception as e:
        print(f"세션 정리 중 오류: {e}")
        return False