from flask import session

from vibeapp.models.user import User

def get_current_user():
    user_data = session.get("user")
    if not user_data:
        return None
    
    spotify_id = user_data.get("spotify_id")
    if not spotify_id:
        return None
    
    return User.query.filter_by(spotify_id=spotify_id).first()