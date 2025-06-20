from vibeapp.extensions import db

class Friend(db.Model):
    __tablename__ = "friend"

    id = db.Column(db.Integer, primary_key=True)

    requester_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)  # 친구 신청한 사람
    receiver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)   # 친구 요청 받은 사람

    status = db.Column(db.String(20), nullable=False, default="pending")  # "pending", "accepted", "rejected"
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    __table_args__ = (
        db.UniqueConstraint("requester_id", "receiver_id", name="uq_request"),
    )

    requester = db.relationship("User", foreign_keys=[requester_id], backref="friend_requests_sent")
    receiver = db.relationship("User", foreign_keys=[receiver_id], backref="friend_requests_received")
    
    
    @classmethod
    def are_friends(cls, user1_id, user2_id):
        """두 사용자가 친구인지 확인"""
        return cls.query.filter(
            (
                ((cls.requester_id == user1_id) & (cls.receiver_id == user2_id)) |
                ((cls.requester_id == user2_id) & (cls.receiver_id == user1_id))
            ) & (cls.status == "accepted")
        ).first() is not None

    @classmethod
    def get_friendship(cls, user1_id, user2_id):
        """두 사용자 간의 친구 관계 레코드 반환"""
        return cls.query.filter(
            (
                ((cls.requester_id == user1_id) & (cls.receiver_id == user2_id)) |
                ((cls.requester_id == user2_id) & (cls.receiver_id == user1_id))
            ) & (cls.status == "accepted")
        ).first()

    @classmethod
    def get_pending_request(cls, requester_id, receiver_id):
        """특정 방향의 대기중인 친구 신청 반환"""
        return cls.query.filter_by(
            requester_id=requester_id,
            receiver_id=receiver_id,
            status="pending"
        ).first()

    @classmethod
    def has_pending_request(cls, user1_id, user2_id):
        """두 사용자 간에 대기중인 신청이 있는지 확인 (양방향)"""
        return cls.query.filter(
            (
                ((cls.requester_id == user1_id) & (cls.receiver_id == user2_id)) |
                ((cls.requester_id == user2_id) & (cls.receiver_id == user1_id))
            ) & (cls.status == "pending")
        ).first() is not None

    @classmethod
    def get_friends_for_user(cls, user_id):
        """특정 사용자의 모든 친구 목록 반환"""
        from vibeapp.models.user import User
        
        # user가 requester인 경우의 친구들
        friends1 = db.session.query(User).join(
            cls, User.id == cls.receiver_id
        ).filter((cls.requester_id == user_id) & (cls.status == "accepted")).all()
        
        # user가 receiver인 경우의 친구들  
        friends2 = db.session.query(User).join(
            cls, User.id == cls.requester_id
        ).filter((cls.receiver_id == user_id) & (cls.status == "accepted")).all()
        
        # 중복 제거하고 합치기
        all_friends = list(set(friends1 + friends2))
        return all_friends