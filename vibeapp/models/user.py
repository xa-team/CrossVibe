from sqlalchemy.orm import aliased
from sqlalchemy import or_, and_

from flask_login import UserMixin

from vibeapp.extensions import db, login_manager
from vibeapp.models.friend import Friend


class User(db.Model, UserMixin):
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
    
#세션에 저장된 사용자 ID를 이용해 User 객체를 로딩
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))