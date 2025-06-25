// ===== 친구 관리 시스템 =====

// 친구 관리 객체
const FriendManager = {
  // 친구 신청 보내기 (사용자명으로)
  async sendRequest(username) {
    try {
      const result = await API.sendFriendRequest(username);

      if (result.success) {
        Utils.showNotification(result.data.message, "success");
        return true;
      } else {
        Utils.showNotification(result.data.error, "error");
        return false;
      }
    } catch (error) {
      Utils.handleError(error, "친구 신청");
      return false;
    }
  },

  // 친구 신청 보내기 (사용자 ID로)
  async sendRequestById(userId, buttonElement = null) {
    if (buttonElement) {
      Utils.setLoading(buttonElement, true);
    }

    try {
      const result = await API.sendFriendRequestById(userId);

      if (result.success) {
        Utils.showNotification(result.data.message, "success");

        if (buttonElement) {
          buttonElement.textContent = "✅ 완료";
          buttonElement.classList.remove("btn-primary");
          buttonElement.classList.add("btn-success");
        }

        return true;
      } else {
        Utils.showNotification(result.data.error, "error");
        return false;
      }
    } catch (error) {
      Utils.handleError(error, "친구 신청");
      return false;
    } finally {
      if (buttonElement) {
        Utils.setLoading(buttonElement, false);
      }
    }
  },

  // 친구 신청 응답 (수락/거절)
  async respondToRequest(requestId, action) {
    const actionText = action === "accept" ? "수락" : "거절";

    return new Promise((resolve) => {
      Utils.showConfirm(
        `정말로 이 친구 신청을 ${actionText}하시겠습니까?`,
        async () => {
          try {
            const result = await API.respondToRequest(requestId, action);

            if (result.success) {
              Utils.showNotification(result.data.message, "success");
              resolve(true);
            } else {
              Utils.showNotification(result.data.error, "error");
              resolve(false);
            }
          } catch (error) {
            Utils.handleError(error, "친구 신청 응답");
            resolve(false);
          }
        }
      );
    });
  },

  // 친구 신청 취소
  async cancelRequest(requestId) {
    return new Promise((resolve) => {
      Utils.showConfirm("정말로 이 친구 신청을 취소하시겠습니까?", async () => {
        try {
          const result = await API.cancelRequest(requestId);

          if (result.success) {
            Utils.showNotification(result.data.message, "success");
            resolve(true);
          } else {
            Utils.showNotification(result.data.error, "error");
            resolve(false);
          }
        } catch (error) {
          Utils.handleError(error, "친구 신청 취소");
          resolve(false);
        }
      });
    });
  },

  // 프로필 보기
  viewProfile(username) {
    if (username) {
      window.location.href = `/user/${username}`;
    } else {
      Utils.showNotification("사용자명이 없습니다.", "error");
    }
  },

  // 친구 목록 가져오기
  async getFriends() {
    try {
      return await API.getFriends();
    } catch (error) {
      Utils.handleError(error, "친구 목록 조회");
      return [];
    }
  },

  // 받은 친구 신청 가져오기
  async getPendingRequests() {
    try {
      return await API.getPendingRequests();
    } catch (error) {
      Utils.handleError(error, "친구 신청 조회");
      return [];
    }
  },
};

// ===== HTML 생성 함수들 =====

const FriendRenderer = {
  // 친구 카드 생성
  createFriendCard(friend) {
    const platforms =
      friend.platform_connections
        .map(
          (platform) =>
            `${Utils.getPlatformIcon(platform)} ${Utils.getPlatformName(
              platform
            )}`
        )
        .join(", ") || "연결된 플랫폼 없음";

    return `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <div class="user-avatar user-avatar-sm me-3">
                                    ${Utils.generateAvatar(
                                      friend.display_name || friend.username
                                    )}
                                </div>
                                <div>
                                    <h6 class="card-title mb-1">${
                                      friend.display_name || friend.username
                                    }</h6>
                                    <small class="text-muted">${platforms}</small>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-primary btn-sm" 
                                        onclick="FriendManager.viewProfile('${
                                          friend.username
                                        }')">
                                    👤 프로필
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  },

  // 친구 목록 HTML 생성
  generateFriendsHTML(friends) {
    if (friends.length === 0) {
      return `
                <div class="text-center py-5">
                    <div class="display-1">👥</div>
                    <h4>아직 친구가 없습니다</h4>
                    <p class="text-muted">친구를 추가해서 음악 취향을 공유해보세요!</p>
                    <button class="btn btn-primary" 
                            onclick="document.getElementById('manage-friends-tab')?.click()">
                        친구 추가하기
                    </button>
                </div>
            `;
    }

    return `<div class="row">${friends
      .map((friend) => this.createFriendCard(friend))
      .join("")}</div>`;
  },

  // 받은 신청 아이템 생성
  createRequestItem(request) {
    return `
            <div class="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
                <div class="d-flex align-items-center">
                    <div class="user-avatar user-avatar-sm me-3">
                        ${Utils.generateAvatar(
                          request.requester.display_name ||
                            request.requester.username
                        )}
                    </div>
                    <div>
                        <h6 class="mb-0">${
                          request.requester.display_name ||
                          request.requester.username
                        }</h6>
                        <small class="text-muted">${Utils.formatDate(
                          request.created_at
                        )}</small>
                    </div>
                </div>
                <div>
                    <button class="btn btn-success btn-sm me-1" 
                            onclick="FriendManager.respondToRequest(${
                              request.id
                            }, 'accept').then(success => success && location.reload())">
                        ✅
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="FriendManager.respondToRequest(${
                              request.id
                            }, 'reject').then(success => success && location.reload())">
                        ❌
                    </button>
                </div>
            </div>
        `;
  },

  // 받은 신청 목록 HTML 생성
  generateRequestsHTML(requests) {
    if (requests.length === 0) {
      return `
                <div class="text-center text-muted py-3">
                    <div class="mb-2">📭</div>
                    <small>받은 신청이 없습니다</small>
                </div>
            `;
    }

    return requests.map((request) => this.createRequestItem(request)).join("");
  },

  // 검색 결과 사용자 아이템 생성 (소셜 페이지용)
  createSearchUserItem(user) {
    const relationshipStatus = this.getRelationshipStatus(user);
    const statusInfo = Utils.getRelationshipInfo(relationshipStatus);
    const avatar = Utils.generateAvatar(user.display_name || user.username);
    const platforms =
      user.platform_connections
        .map((p) => `${Utils.getPlatformIcon(p)} ${Utils.getPlatformName(p)}`)
        .join(", ") || "연결된 플랫폼 없음";

    return `
            <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                <div class="d-flex align-items-center">
                    <div class="user-avatar user-avatar-sm me-3">${avatar}</div>
                    <div>
                        <strong>${user.display_name || user.username}</strong>
                        ${
                          user.display_name
                            ? `<br><small class="text-muted">@${user.username}</small>`
                            : ""
                        }
                        <br><small class="text-muted">${platforms}</small>
                    </div>
                </div>
                <div>
                    ${this.getActionButton(user, statusInfo)}
                </div>
            </div>
        `;
  },

  //relationship status 계산
  getRelationshipStuats(user) {
    if (user.is_friend) {
      return "friend";
    } else if (user.has_pending_request_from_me) {
      return "sent_request";
    } else if (user.has_pending_request_to_me) {
      return "received_request";
    } else {
      return "none";
    }
  },

  // 액션 버튼 생성
  getActionButton(user, statusInfo) {
    console.log(statusInfo.showButton);
    if (statusInfo.showButton) {
      return `<button class="btn btn-success btn-sm" 
                            onclick="FriendManager.sendRequest('${user.username}').then(success => success && setTimeout(() => location.reload(), 1000))">
                        ➕ 신청
                    </button>`;
    } else {
      return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
    }
  },
};

// ===== 전역 함수 노출 =====
// 템플릿에서 직접 호출할 수 있도록 전역으로 노출
window.FriendManager = FriendManager;
window.FriendRenderer = FriendRenderer;

// 기존 함수명과의 호환성을 위한 별칭
window.respondToRequest = (requestId, action) => {
  FriendManager.respondToRequest(requestId, action).then((success) => {
    if (success) setTimeout(() => location.reload(), 1000);
  });
};

window.cancelRequest = (requestId) => {
  FriendManager.cancelRequest(requestId).then((success) => {
    if (success) setTimeout(() => location.reload(), 1000);
  });
};

window.viewFriendProfile = FriendManager.viewProfile;
window.sendFriendRequestToUser = FriendManager.sendRequest;
