from vibeapp.extensions import db

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(100), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)

    platform_connections = db.relationship("PlatformConnection", back_populates="user", cascade="all, delete-orphan")