from sqlalchemy.orm import aliased
from vibeapp.extensions import db
from vibeapp.models.friend import Friend
from sqlalchemy import or_, and_

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(100), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)

    platform_connections = db.relationship("PlatformConnection", back_populates="user", cascade="all, delete-orphan")
    

# 친구 목록을 쿼리하는 관계
@property
def friends(self):
    FriendAlias = aliased(Friend)
    return User.query.join(FriendAlias, or_(
        and_(
            FriendAlias.requester_id == self.id,
            FriendAlias.receiver_id == User.id,
            FriendAlias.status == "accepted"
        ),
        and_(
            FriendAlias.receiver_id == self.id,
            FriendAlias.requester_id == User.id,
            FriendAlias.status == "accepted"
        )
    ))