from functools import wraps

from flask import abort, flash, redirect, session, url_for
from vibeapp.models.user import User


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_session = session.get("user")
        if not user_session:
            return redirect(url_for("public.login"))
        
        user_id = user_session.get("id")
        if not user_id:
            return redirect(url_for("public.login"))
        
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            abort(403) #403 Forbidden
        
        return f(*args, **kwargs)
    return decorated_function


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_session = session.get("user")
        if not user_session or "id" not in user_session:
            flash("로그인이 필요한 서비스입니다.", "warning")
            return redirect(url_for("public.login"))
        
        #플랫폼 연결 여부 검사
        active = user_session.get("active_platform")
        platforms = user_session.get("platforms", {})
        if not active or active not in platforms:
            flash("플랫폼이 연결되어 있지 않습니다. 먼저 플랫폼을 연결해주세요.", "danger")
            return redirect(url_for("public.home"))
        
        return f(*args, **kwargs)
    return decorated_function