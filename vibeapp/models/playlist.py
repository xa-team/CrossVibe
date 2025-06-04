from vibeapp.extensions import db

class Playlist(db.Model):
    __tablename__ = "playlist"
    __table_args__ = (
    db.UniqueConstraint('platform', 'platform_user_id', 'spotify_id', name='uq_platform_user_playlist'),
    )

    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    snapshot_id = db.Column(db.String(255))
    is_public = db.Column(db.Boolean, default=True)
    platform = db.Column(db.String(50), nullable=False)
    platform_user_id = db.Column(db.String(255), nullable=False)  # 이걸 직접 가짐
    spotify_id = db.Column(db.String(255), nullable=False)
    
    platform_connection_id = db.Column(db.Integer, db.ForeignKey("platform_connection.id"), nullable=False)
    platform_connection = db.relationship("PlatformConnection", back_populates="playlists")
