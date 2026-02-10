from flask import Blueprint, redirect, render_template, session, flash, url_for
from flask_login import login_required

from vibeapp.exceptions import UnsupportedPlatformError
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.models.playlist import Playlist
from vibeapp.services.playlist_service import PlaylistService
from vibeapp.utils.auth_utils import require_user_safely


playlist_bp = Blueprint("playlist", __name__,)

#플레이리스트 라우터
@playlist_bp.route("/my-playlists")
@login_required
def my_playlists():
    user_data = session.get("user")
    active_platform = user_data.get("active_platform")
    platform_info = user_data["platforms"].get(active_platform)

    connection_id = platform_info["connection_id"]
    connection = PlatformConnection.query.get(connection_id)

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
        current_user_id = user.id

        playlist_service = PlaylistService()
        data = playlist_service.get_and_save_playlist_detail(playlist_id, current_user_id)

        return render_template("playlist/playlist_detail.html", playlist=data["playlist"], tracks=data["tracks"])

    except PermissionError:
        flash("친구의 플레이리스트만 볼 수 있습니다.", "danger")
        return redirect(url_for("public.home"))
    except UnsupportedPlatformError as e:
        flash(str(e), "warning")
        return redirect(url_for("public.home"))
    except Exception as e:
        flash(f"플레이리스트를 불러오는 중 오류가 발생했습니다: {str(e)}", "danger")
        return redirect("public.home")
