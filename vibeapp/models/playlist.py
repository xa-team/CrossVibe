from vibeapp.extensions import db

class Playlist(db.Model):
    __tablename__ = "playlist"

    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    snapshot_id = db.Column(db.String(255))
    is_public = db.Column(db.Boolean, default=True)
    platform = db.Column(db.String(255))
    
    platform_connection_id = db.Column(db.Integer, db.ForeignKey("platform_connection.id"), nullable=False)
    platform_connection = db.relationship("PlatformConnection", back_populates="playlists")
