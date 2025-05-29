from vibeapp.extensions import db

class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    platform = db.Column(db.String(50), nullable=False) # 예: "spotify", "youtube", "apple"
    
    spotify_id = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    snapshot_id = db.Column(db.String(255)) # 변경 감지용 (해당 플랫폼 지원 시)
    is_public = db.Column(db.Boolean, default=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    user = db.relationship("User", back_populates="playlists")