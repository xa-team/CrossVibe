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
    items = db.relationship("PlaylistItem", back_populates="playlist", cascade='all, delete-orphan', order_by='PlaylistItem.order')

class Track(db.Model): # 일단 Spotify 기준. 향후 다른 플랫폼 추가시 필드 확인
    __tablename__ = "track"
    __table_args__ = (
    db.UniqueConstraint('platform', 'platform_track_id', name='uq_track_per_platform'),
    )

    id = db.Column(db.Integer, primary_key=True)
    platform = db.Column(db.String(20), nullable=False)
    platform_track_id = db.Column(db.string(100), nullable=False)

    title = db.Column(db.String(255), nullable=False)
    artist = db.Column(db.String(255), nullable=False)
    album = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    preview_url = db.Column(db.String(500), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)

class PlaylistItem(db.Model):
    __tablename__ = "playlist_item"

    playlist_id = db.Column(db.Integer, db.ForeignKey('playlist.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('track.id'), nullable=False)

    order = db.Column(db.Integer, nullable=False)
    added_at = db.Column(db.Datetime)

    playlist = db.relationship('Playlist', back_populates='items')
    track = db.relationship('Track')
