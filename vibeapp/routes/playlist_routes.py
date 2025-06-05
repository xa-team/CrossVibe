from flask import Blueprint, render_template, session
from vibeapp.models.platform_connection import PlatformConnection
from vibeapp.models.playlist import Playlist
from vibeapp.services.api import get_playlist_service
from vibeapp.utils.auth_utils import login_required


playlist_bp = Blueprint(
    "playlist",
    __name__,
)

#플레이리스트 라우터
@playlist_bp.route("/my-playlists")
@login_required
def my_playlists():
    user_data = session.get("user")
    active_platform = user_data.get("active_platform")
    platform_info = user_data["platforms"].get(active_platform)
    
    connection_id = platform_info["connection_id"]
    connection = PlatformConnection.query.get(connection_id)
    
    service = get_playlist_service(connection)
    playlists_data = service.get_playlists()
    service.save_or_update_playlists(playlists_data)
    
    #DB에서 가져오기 (정렬 포함)
    playlists = Playlist.query.filter_by(
        platform=connection.platform,
        platform_user_id=connection.platform_user_id,
    ).order_by(Playlist.name.asc()).all()
    
    return render_template("user/my_playlists.html", playlists=playlists, platform=active_platform)