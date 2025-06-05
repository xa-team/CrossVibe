from flask import Blueprint, render_template, redirect, url_for

from vibeapp.models.user import User
from vibeapp.utils.auth_utils import admin_required

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin",
    
    #Blueprint가 각자 독립적인 template 디렉토리 사용을 위해 template_folder 옵션 명시
    template_folder="templates"
)

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