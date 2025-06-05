from vibeapp.extensions import db

class Friend(db.Model):
    __tablename__ = "friend"

    id = db.Column(db.Integer, primary_key=True)

    requester_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)  # 친구 신청한 사람
    receiver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)   # 친구 요청 받은 사람

    status = db.Column(db.String(20), nullable=False, default="pending")  # "pending", "accepted", "rejected"
    created_at = db.Column(db.DateTime, default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint("requester_id", "receiver_id", name="uq_request"),
    )

    requester = db.relationship("User", foreign_keys=[requester_id], backref="friend_requests_sent")
    receiver = db.relationship("User", foreign_keys=[receiver_id], backref="friend_requests_received")