from vibeapp.extensions import db

class PlatformConnection(db.Model):
    __tablename__ = "platform_connection"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    platform = db.Column(db.String(50), nullable=False)

    token_id = db.Column(db.Integer, db.ForeignKey("platform_token.id"), nullable=False)

    user = db.relationship("User", back_populates="platform_connections")
    token = db.relationship("PlatformToken", back_populates="platform_connection", uselist=False)
    playlists = db.relationship("Playlist", back_populates="platform_connection", cascade="all, delete-orphan")
