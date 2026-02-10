from flask import Blueprint, render_template, redirect, url_for

from vibeapp.models.user import User
from vibeapp.models.playlist import Playlist
from vibeapp.decorators.auth import admin_required

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin",
)

@admin_bp.route("/")
@admin_required
def admin_index():
    return redirect(url_for("admin.dashboard"))

@admin_bp.route("/dashboard")
@admin_required
def dashboard():
    return render_template("admin/admin_dashboard.html")

@admin_bp.route("/database")
@admin_required
def show_database():
    users = User.query.all()
    return render_template("admin/admin_database.html", users=users)

@admin_bp.route("/playlists")
@admin_required
def show_playlists():
    """플레이리스트 DB 목록 확인"""
    playlists = Playlist.query.all()
    return render_template("admin/admin_playlists.html", playlists=playlists)
