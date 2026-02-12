from sqlalchemy.orm import aliased
from sqlalchemy import or_, and_

from flask_login import UserMixin

from vibeapp.extensions import db, login_manager
from vibeapp.models.friend import Friend


class User(db.Model, UserMixin):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(100), nullable=True)
    username = db.Column(db.String(50), unique=True, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)

    platform_connections = db.relationship("PlatformConnection", back_populates="user", cascade="all, delete-orphan")

    playlists = db.relationship(
        "Playlist",
        secondary="platform_connection",
        primaryjoin="User.id==PlatformConnection.user_id",
        secondaryjoin="PlatformConnection.id==Playlist.platform_connection_id",
        viewonly=True,
        backref="user_view"
    )

    # ⭐ 친구 관련 편의 메서드들 추가
    def get_friends(self):
        """이 사용자의 모든 친구 목록 반환"""
        return Friend.get_friends_for_user(self.id)

    def get_pending_friend_requests_count(self):
        """받은 친구 신청 중 대기중인 것의 개수"""
        pending_requests = Friend.query.filter_by(
            receiver_id=self.id,
            status="pending"
        ).all()
        return len(pending_requests)

    def get_pending_received_requests(self):
        """받은 친구 신청 중 대기중인 것들"""
        return Friend.query.filter_by(
            receiver_id=self.id,
            status="pending"
        ).all()

    def is_friend_with(self, other_user_id):
        """다른 사용자와 친구인지 확인"""
        return Friend.are_friends(self.id, other_user_id)

    def has_pending_request_from(self, other_user_id):
        """특정 사용자로부터 대기중인 친구 신청이 있는지 확인"""
        return Friend.get_pending_request(other_user_id, self.id) is not None

    def has_sent_request_to(self, other_user_id):
        """특정 사용자에게 대기중인 친구 신청을 보냈는지 확인"""
        return Friend.get_pending_request(self.id, other_user_id) is not None

    def send_friend_request(self, other_user_id):
        """친구 신청 보내기"""
        # 이미 친구인지 확인
        if self.is_friend_with(other_user_id):
            raise ValueError("이미 친구입니다.")

        # 이미 신청했는지 확인
        if self.has_sent_request_to(other_user_id):
            raise ValueError("이미 친구 신청을 보냈습니다.")

        # 상대방이 이미 신청을 보냈는지 확인
        if self.has_pending_request_from(other_user_id):
            raise ValueError("상대방이 이미 친구 신청을 보냈습니다.")

        # 친구 신청 생성
        friend_request = Friend(
            requester_id=self.id,
            receiver_id=other_user_id
        )
        db.session.add(friend_request)
        db.session.commit()
        return friend_request

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

    @staticmethod
    def find_by_username(username):
        """사용자명으로 사용자 찾기"""
        return User.query.filter_by(username=username).first()

    @staticmethod
    def search_by_username(query, limit=10):
        """사용자명으로 사용자 검색 (부분 일치)"""
        return User.query.filter(
            User.username.ilike(f'%{query}%')
        ).limit(limit).all()

    def to_dict(self, include_private=False):
        """사용자 정보를 딕셔너리로 반환"""
        data = {
            'id': self.id,
            'username': self.username,
            'display_name': self.display_name,
            'platform_connections': [conn.platform for conn in self.platform_connections]
        }

        if include_private:
            data.update({
                'is_admin': self.is_admin,
                'friends_count': len(self.get_friends()),
                'pending_requests_count': self.get_pending_friend_requests_count()
            })

        return data

    def __repr__(self):
        return f"<User {self.username or self.display_name}>"

    #세션에 저장된 사용자 ID를 이용해 User 객체를 로딩
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
