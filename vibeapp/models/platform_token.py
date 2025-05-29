from vibeapp.extensions import db

class PlatformToken(db.Model):
    __tablename__ = "platform_token"

    id = db.Column(db.Integer, primary_key=True)
    access_token = db.Column(db.String(255), nullable=False)
    refresh_token = db.Column(db.String(255), nullable=True)
    expire_at = db.Column(db.DateTime, nullable=True)
    extra_data = db.Column(db.JSON, nullable=True)

    platform_connection = db.relationship("PlatformConnection", back_populates="token", uselist=False)
