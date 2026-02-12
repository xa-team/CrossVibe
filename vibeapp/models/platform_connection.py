from vibeapp.extensions import db

class PlatformConnection(db.Model):
    __tablename__ = "platform_connection"
    __table_args__ = (
    db.UniqueConstraint('platform', 'platform_user_id', name='uq_platform_user'),
    )

    id = db.Column(db.Integer, primary_key=True)
    platform = db.Column(db.String(50), nullable=False)
    platform_user_id = db.Column(db.String(255), nullable=False)  # 외부 플랫폼에서의 유저 고유 ID

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    token_id = db.Column(db.Integer, db.ForeignKey("platform_token.id"), nullable=False)

    user = db.relationship("User", back_populates="platform_connections")
    token = db.relationship("PlatformToken", back_populates="platform_connection", uselist=False)
    playlists = db.relationship("Playlist", back_populates="platform_connection", cascade="all, delete-orphan")
