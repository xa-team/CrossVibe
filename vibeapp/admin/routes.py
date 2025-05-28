from flask import Blueprint, abort, render_template, session, redirect, url_for
from functools import wraps

from vibeapp.models.user import User

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin",
    
    #Blueprint가 각자 독립적인 template 디렉토리 사용을 위해 template_folder 옵션 명시
    template_folder="templates"
)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_session = session.get("user")
        if not user_session:
            return redirect(url_for("public.login"))
        
        user = User.query.filter_by(spotify_id=user_session.get("spotify_id")).first()
        if not user or not user.is_admin:
            abort(403)  # 403 Forbidden
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route("/")
@admin_required
def admin_index():
    return redirect(url_for("admin.dashboard"))

@admin_bp.route("/dashboard")
@admin_required
def dashboard():
    return render_template("admin_dashboard.html")

@admin_bp.route("/database")
@admin_required
def show_database():
    users = User.query.all()
    return render_template("admin_database.html", users=users)