from flask import Blueprint, render_template, session, redirect, url_for

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin",
    
    #Blueprint가 각자 독립적인 template 디렉토리 사용을 위해 template_folder 옵션 명시
    template_folder="templates"
)

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("is_admin"):
            return redirect(url_for("public.home"))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route("/dashboard")
@admin_required
def dashboard():
    return render_template("admin_dashboard.html")