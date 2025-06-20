from flask import Blueprint, redirect, render_template, request, jsonify, session, url_for
from flask_login import login_required, current_user
from sqlalchemy import and_, or_

from vibeapp.extensions import db
from vibeapp.models.user import User
from vibeapp.models.friend import Friend
from vibeapp.exceptions import FriendRequestError

from vibeapp.services.user_services import UserService, FriendService

social_bp = Blueprint("friend", __name__)


@social_bp.route("/social")
@login_required
def social():
    """소셜 허브 메인 페이지"""
    user_data = session.get("user")
    if user_data:
        current_user_obj = User.query.get(user_data["id"])
    else:
        current_user_obj = current_user
    
    # 받은 친구 신청 (대기중만)
    pending_requests = Friend.query.filter_by(
        receiver_id=current_user_obj.id,
        status="pending"
    ).all()
    
    # 내 친구 목록
    friends = Friend.get_friends_for_user(current_user_obj.id)
    
    # 보낸 친구 신청
    sent_requests = Friend.query.filter_by(requester_id=current_user_obj.id).all()
    
    # 대기중인 받은 신청 개수
    pending_requests_count = len(pending_requests)
    
    return render_template("social/social.html", 
                         user=current_user_obj,
                         pending_requests=pending_requests,
                         friends=friends,
                         sent_requests=sent_requests,
                         pending_requests_count=pending_requests_count)
    
    
@social_bp.route("/send-friend-request", methods=["POST"])
@login_required
def send_friend_request():
    """친구 신청 보내기 (사용자명 기반)"""
    try:
        data = request.get_json()
        target_username = data.get("username", "").strip()
        
        if not target_username:
            return jsonify({"error": "사용자명을 입력해주세요."}), 400
        
        # 현재 사용자 정보 가져오기
        user_data = session.get("user")
        if user_data:
            current_user_obj = User.query.get(user_data["id"])
        else:
            current_user_obj = current_user
        
        # 대상 사용자 찾기
        target_user = User.find_by_username(target_username)
        if not target_user:
            return jsonify({"error": "존재하지 않는 사용자입니다."}), 404
        
        # 자기 자신에게 신청하는지 확인
        if target_user.id == current_user_obj.id:
            return jsonify({"error": "자기 자신에게는 친구 신청을 보낼 수 없습니다."}), 400
        
        # 이미 친구 관계가 있는지 확인
        existing_friendship = Friend.query.filter(
            or_(
                and_(Friend.requester_id == current_user_obj.id, Friend.receiver_id == target_user.id),
                and_(Friend.requester_id == target_user.id, Friend.receiver_id == current_user_obj.id)
            )
        ).first()
        
        if existing_friendship:
            if existing_friendship.status == "accepted":
                return jsonify({"error": "이미 친구입니다."}), 400
            elif existing_friendship.status == "pending":
                if existing_friendship.requester_id == current_user_obj.id:
                    return jsonify({"error": "이미 친구 신청을 보냈습니다."}), 400
                else:
                    return jsonify({"error": "상대방이 이미 친구 신청을 보냈습니다. 받은 신청을 확인해주세요."}), 400
            elif existing_friendship.status == "rejected":
                # 거절된 신청이 있으면 삭제하고 새로 생성
                db.session.delete(existing_friendship)
                db.session.commit()
        
        # 친구 신청 생성
        friend_request = Friend(
            requester_id=current_user_obj.id,
            receiver_id=target_user.id,
            status="pending"
        )
        db.session.add(friend_request)
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": f"{target_user.display_name or target_user.username}님에게 친구 신청을 보냈습니다."
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "친구 신청 중 오류가 발생했습니다."}), 500
    
    
@social_bp.route("/respond-friend-request/<int:request_id>/<action>", methods=["POST"])
@login_required
def respond_friend_request(request_id, action):
    """친구 신청 응답 (수락/거절)"""
    if action not in ["accept", "reject"]:
        return jsonify({"error": "잘못된 액션입니다."}), 400
    
    user_data = session.get("user")
    if user_data:
        current_user_obj = User.query.get(user_data["id"])
    else:
        current_user_obj = current_user
    
    # 친구 신청 찾기
    friend_request = Friend.query.filter_by(
        id=request_id,
        receiver_id=current_user_obj.id,
        status="pending"
    ).first()
    
    if not friend_request:
        return jsonify({"error": "유효하지 않은 친구 신청입니다."}), 404
    
    try:
        if action == "accept":
            friend_request.status = "accepted"
            message = f"{friend_request.requester.display_name or friend_request.requester.username}님과 친구가 되었습니다!"
        else:
            friend_request.status = "rejected"
            message = "친구 신청을 거절했습니다."
        
        friend_request.updated_at = db.func.now()
        db.session.commit()
        return jsonify({"success": True, "message": message}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "처리 중 오류가 발생했습니다."}), 500
    
    
@social_bp.route("/cancel-friend-request/<int:request_id>", methods=["POST"])
@login_required
def cancel_web_friend_request(request_id):
    """친구 신청 취소 (웹용)"""
    user_data = session.get("user")
    if user_data:
        current_user_obj = User.query.get(user_data["id"])
    else:
        current_user_obj = current_user
    
    # 친구 신청 찾기 (자신이 보낸 것 중에서)
    friend_request = Friend.query.filter_by(
        id=request_id,
        requester_id=current_user_obj.id,
        status="pending"
    ).first()
    
    if not friend_request:
        return jsonify({"error": "유효하지 않은 친구 신청입니다."}), 404
    
    try:
        db.session.delete(friend_request)
        db.session.commit()
        return jsonify({"success": True, "message": "친구 신청을 취소했습니다."}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "취소 중 오류가 발생했습니다."}), 500


# 호환성을 위한 리다이렉트 라우트트
@social_bp.route("/friend-requests")
@login_required
def friend_requests():
    """받은 친구 신청 페이지로 리다이렉트"""
    return redirect(url_for("friend.social") + "#received")


@social_bp.route("/friends")
@login_required
def friends_list():
    """친구 목록 페이지로 리다이렉트"""
    return redirect(url_for("friend.social") + "#friends")


@social_bp.route("/sent-requests")
@login_required
def sent_requests():
    """보낸 신청 페이지로 리다이렉트"""
    return redirect(url_for("friend.social") + "#sent")


@social_bp.route("/api/search-users", methods=["GET"])
@login_required
def search_users():
    """사용자 검색 API(부분 일치)"""
    query = request.args.get("q", "").strip()
    
    user_data = session.get("user")
    if user_data:
        current_user_obj = User.query.get(user_data["id"])
    else:
        current_user_obj = current_user
    
    
    users = UserService.search_users(query, current_user_obj.id)
    
    users_data = [
        UserService.get_user_relationship_info(user, current_user_obj.id)
        for user in users
    ]
    
    return jsonify({"users": users_data}), 200


@social_bp.route("/api/friends", methods=["GET"])
@login_required
def get_friends_api():
    """친구 목록"""
    user_data = session.get("user")
    if user_data:
        current_user_obj = User.query.get(user_data["id"])
    else:
        current_user_obj = current_user
        
    return jsonify(FriendService.get_friends_list(current_user_obj.id)), 200
    
    
@social_bp.route("/api/friend-requests", methods=["GET"])
@login_required
def get_friend_requests_api():
    """받은 친구 신청 목록 API"""
    user_data = session.get("user")
    if user_data:
        current_user_obj = User.query.get(user_data["id"])
    else:
        current_user_obj = current_user
        
    return jsonify(FriendService.get_pending_requests(current_user_obj.id)), 200