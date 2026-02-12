from flask import Blueprint, redirect, render_template, session, flash, url_for
from flask_login import login_required

from vibeapp.exceptions import UnsupportedPlatformError
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.models.playlist import Playlist
from vibeapp.models.user import User
from vibeapp.services.playlist_service import PlaylistService
from vibeapp.utils.auth_utils import require_user_safely


playlist_bp = Blueprint("playlist", __name__,)

#플레이리스트 라우터
@playlist_bp.route("/my-playlists")
@require_user_safely()
def my_playlists(user):
    user_session = session.get("user", {})
    active_platform = user_session.get("active_platform")

    connection = next((c for c in user.platform_connections if c.platform == active_platform), None)

    if not active_platform or not connection:
        return redirect((url_for("public.home")))

    playlist_service = PlaylistService()
    playlist_service.get_and_save_playlists(connection)

    #DB에서 가져오기 (정렬 포함)
    playlists = Playlist.query.filter_by(
        platform=connection.platform,
        platform_user_id=connection.platform_user_id,
    ).order_by(Playlist.name.asc()).all()

    return render_template("user/my_playlists.html", playlists=playlists, platform=active_platform)

@playlist_bp.route("/playlist/<int:playlist_id>")
@require_user_safely()
def playlist_detail(user, playlist_id):
    try:
        playlist = Playlist.query.get_or_404(playlist_id)

        current_user_id = user.id
        me = User.query.get(current_user_id)

        owner_id = playlist.platform_connection.user_id

        is_owner = (owner_id == me.id)
        is_friend = me.is_friend_with(owner_id)

        if not is_owner and not is_friend:
            flash("친구의 플레이리스트만 볼 수 있습니다.", "danger")
            return redirect(url_for("social.main"))

        playlist_service = PlaylistService()
        data = playlist_service.get_and_save_playlist_detail(playlist_id)

        return render_template("playlist/playlist_detail.html", playlist=data["playlist"], playlist_items=data["playlist_items"])

    except UnsupportedPlatformError as e:
        flash(str(e), "warning")
        return redirect(url_for("public.home"))
    except Exception as e:
        flash(f"플레이리스트를 불러오는 중 오류가 발생했습니다: {str(e)}", "danger")
        return redirect(url_for("public.home"))
