from vibeapp.models.user import User
from vibeapp.models.friend import Friend

class UserService:
    @staticmethod
    def search_users(query, current_user_id, limit=10):
        """사용자 검색 (부분 일치)"""
        if not query or len(query) < 2:
            return []
        
        # 사용자명으로 검색 (부분 일치, 자신 제외)
        users = User.query.filter(
            User.username.ilike(f'%{query}%'),
            User.id != current_user_id,
            User.username.isnot(None)  # 사용자명이 있는 사용자만
        ).limit(limit).all()
        
        return users
    
    @staticmethod
    def get_user_relationship_info(user, current_user_id):
        """대상 사용자와 현재 사용자 간의 관계 정보 반환"""
        is_friend = Friend.are_friends(current_user_id, user.id)
        has_pending_from_me = Friend.get_pending_request(current_user_id, user.id) is not None
        has_pending_to_me = Friend.get_pending_request(user.id, current_user_id) is not None
        pending_request_id = None
        
        if has_pending_to_me:
            pending_req = Friend.get_pending_request(user.id, current_user_id)
            pending_request_id = pending_req.id if pending_req else None
        
        return {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "platform_connections": [conn.platform for conn in user.platform_connections],
            "is_friend": is_friend,
            "has_pending_request_from_me": has_pending_from_me,
            "has_pending_request_to_me": has_pending_to_me,
            "pending_request_id": pending_request_id
        }
        
class FriendService:
    @staticmethod
    def get_friends_list(user_id):
        """사용자의 친구 목록 반환"""
        friends = Friend.get_friends_for_user(user_id)
        
        friends_data = [{
            "id": friend.id,
            "username": friend.username,
            "display_name": friend.display_name,
            "platform_connections": [conn.platform for conn in friend.platform_connections]
        } for friend in friends]
        
        return {
            "friends": friends_data,
            "count": len(friends_data)
        }
        
    @staticmethod
    def get_pending_requests(user_id):
        """받은 친구 신청 목록 반환"""
        pending_requests = Friend.query.filter_by(
            receiver_id=user_id,
            status="pending"
        ).all()
        
        requests_data = [{
            "id": req.id,
            "requester": {
                "id": req.requester.id,
                "username": req.requester.username,
                "display_name": req.requester.display_name
            },
            "created_at": req.created_at.isoformat() if req.created_at else None
        } for req in pending_requests]
        
        return {
            "requests": requests_data,
            "count": len(requests_data)
        }