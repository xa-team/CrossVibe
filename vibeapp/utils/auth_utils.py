from flask import session

from vibeapp.models.platform_connection import PlatformConnection

def get_current_connection():
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