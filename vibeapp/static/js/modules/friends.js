// ===== 친구 관리 시스템 =====

/**
 * 친구 신청 응답
 * @param {number}
 */
async function repspondToFriendRequest(requestId, action) {}

/**
 * 친구 관리 비즈니스 로직 클래스
 * API 호출은 CrossVibeAPI에 위임, UI 관련 로직에만 집중
 */
class FriendManager {
  // ===== 친구 신청 관련 =====

  /**
   * 친구 신청 보내기 (사용자명 기반)
   * @param {string} username - 대상 사용자명
   * @returns {Promise<boolean>} 성공 여부
   */
  static async sendRequest(username) {
    try {
      const result = await CrossVibeAPI.sendFriendRequest(username);

      if (result.success) {
        NotificationManager.success(result.data.message);
        return true;
      } else {
        NotificationManager.error(result.data.error);
        return false;
      }
    } catch (error) {
      NotificationManager.error(CrossVibeUtils.handleError(error, "친구 신청"));
      return false;
    }
  }

  /**
   * 친구 신청 보내기 (사용자 ID 기반)
   * @param {number} userId - 대상 사용자 ID
   * @param {HTMLElement} buttonElement - 로딩 상태를 적용할 버튼 (선택사항)
   * @returns {Promise<boolean>} 성공 여부
   */
  static async sendRequestById(userId, buttonElement = null) {
    if (buttonElement) {
      CrossVibeUtils.setLoading(buttonElement, true);
    }

    try {
      const result = await CrossVibeAPI.sendFriendRequestById(userId);

      if (result.success) {
        NotificationManager.success(result.data.message);

        if (buttonElement) {
          buttonElement.textContent = "✅ 완료";
          buttonElement.classList.remove("btn-primary");
          buttonElement.classList.add("btn-success");
        }

        return true;
      } else {
        NotificationManager.error(result.data.error);
        return false;
      }
    } catch (error) {
      NotificationManager.error(CrossVibeUtils.handleError(error, "친구 신청"));
      return false;
    } finally {
      if (buttonElement) {
        CrossVibeUtils.setLoading(buttonElement, false);
      }
    }
  }

  /**
   *
   * @param {number} requestId - 신청 ID
   * @param {string} action - 'accept' 또는 'reject'
   * @returns {Promise<boolean>} 성공 여부
   */
  static async respondToRequest(requestId, action) {
    const actionText = action === "accept" ? "수락" : "거절";

    return new Promise((resolve) => {
      NotificationManager.confirm(
        `정말로 이 친구 신청을 ${actionText}하시겠습니까?`,
        async () => {
          try {
            const result = await CrossVibeAPI.respondToRequest(
              requestId,
              action
            );

            if (result.success) {
              NotificationManager.success(result.data.message);
              resolve(true);
            } else {
              NotificationManager.error(result.data.error);
              resolve(false);
            }
          } catch (error) {
            NotificationManager.error(
              CrossVibeUtils.handleError(error, "친구 신청 응답")
            );
            resolve(false);
          }
        },
        () => resolve(false)
      );
    });
  }

  /**
   * 친구 신청 취소
   * @param {number} requestId - 신청 ID
   * @returns {Promise<boolean>} 성공 여부
   */
  static async cancelRequest(requestId) {
    return new Promise((resolve) => {
      NotificationManager.confirm(
        "정말로 이 친구 신청을 취소하시겠습니까?",
        async () => {
          try {
            const result = await CrossVibeAPI.cancelRequest(requestId);

            if (result.success) {
              NotificationManager.success(result.data.message);
              resolve(true);
            } else {
              NotificationManager.error(result.data.error);
              resolve(false);
            }
          } catch (error) {
            NotificationManager.error(
              CrossVibeUtils.handleError(error, "친구 신청 취소")
            );
            resolve(false);
          }
        }
      );
    });
  }

  // ===== 데이터 조회 =====

  /**
   * 친구 목록 가져오기
   * @returns {Promise<Array>} 친구 목록
   */
  static async getFriends() {
    try {
      return await CrossVibeAPI.getFriends();
    } catch (error) {
      NotificationManager.error(
        CrossVibeUtils.handleError(error, "친구 목록 조회")
      );
      return [];
    }
  }

  /**
   * 받은 친구 신청 가져오기
   * @returns {Promise<Array>} 받은 친구 신청 목록
   */
  static async getPendingRequests() {
    try {
      return await CrossVibeAPI.getPendingRequests();
    } catch (error) {
      console.error(error);
      NotificationManager.error(
        CrossVibeUtils.handleError(error, "친구 신청 조회")
      );
      throw error;
    }
  }

  /**
   * 프로필 보기
   * @param {string} username
   */
  static viewProfile(username) {
    if (username) {
      window.location.href = `/user/${username}`;
    } else {
      NotificationManager.error("사용자명이 없습니다.");
    }
  }
}

/**
 * 친구 관련 UI 렌더링 클래스
 * HTML 생성과 DOM 조작에만 집중
 */
class FriendRenderer {
  // ===== 친구 카드 렌더링 =====

  /**
   * 친구 카드 생성
   * @param {Object} friend - 친구 객체
   * @returns {string} HTML 문자열
   */
  static createFriendCard(friend) {
    const avatar = CrossVibeUtils.generateAvatar(
      friend.display_name || friend.username
    );
    const platforms = CrossVibeUtils.formatPlatforms(
      friend.platform_connections
    );

    return `
            <div class="col-md-6 mb-3">
                <div class="card friend-card card-hover">
                    <div class="card-body friend-card-body">
                        <div class="friend-info">
                            <div class="user-avatar user-avatar-md me-3">${avatar}</div>
                                <div class="friend-details">
                                    <h6 class="card-title mb-1">${
                                      friend.display_name || friend.username
                                    }</h6>
                                    <div class="friend-platforms text-muted">${platforms}</div>
                                </div>
                            </div>
                            <div class="friend-actions>
                                <button class="btn btn-primary btn-sm btn-friend-action" 
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
  }

  /**
   * 친구 목록 HTML 생성
   * @param {Array} friends - 친구목록
   * @returns {string} HTML 문자열
   */
  static generateFriendsHTML(friends) {
    if (!friends || friends.length === 0) {
      return this.createEmptyState(
        "👥",
        "아직 친구가 없습니다",
        "친구를 추가해서 음악 취향을 공유해보세요!",
        '<button class="btn btn-primary" onclinck="document.getElementBtId(manage-friends-tab\')?.click()">친구 추가하기</button>'
      );
    }

    return `<div class="row">${friends
      .map((friend) => this.createFriendCard(friend))
      .join("")}</div>`;
  }

  // ===== 친구 신청 렌더링 =====

  /**
   * 받은 신청 아이템 생성
   * @param {Object} request - 신청 객체
   * @returns {string} HTML 문자열
   */
  static createRequestItem(request) {
    const avatar = CrossVibeUtils.generateAvatar(
      request.requester.display_name || request.requester.username
    );
    const timeAgo = CrossVibeUtils.formatDate(request.created_at);

    return `
      <div class="request-item">
        <div class="request-info">
          <div class="user-avatar user-avatar-sm me-3">${avatar}</div>
          <div class="request-details">
            <h6 class="mb-0">${
              request.requester.display_name || request.requester.username
            }</h6>
            <div class="request-time text-muted">${timeAgo}</div>
          </div>
        </div>
        <div class="request-actions">
          <button class="social-action-btn btn-accept" 
                  onclick="FriendManager.respondToRequest(${
                    request.id
                  }, 'accept').then(success => success && location.reload())"
                  title="수락">
            ✅
          </button>
          <button class="social-action-btn btn-reject" 
                  onclick="FriendManager.respondToRequest(${
                    request.id
                  }, 'reject').then(success => success && location.reload())"
                  title="거절">
            ❌
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 받은 신청 목록 HTML 생성
   * @param {Array} requests - 신청 목록
   * @returns {string} HTML 문자열
   */
  static generateRequestsHTML(requests) {
    if (!requests || requests.length === 0) {
      return this.createEmptyState(
        "📭",
        "받은 신청이 없습니다",
        "새로운 친구 신청을 기다리고 있어요"
      );
    }

    return requests.map((request) => this.createRequestItem(request)).join("");
  }

  // ===== 검색 결과 렌더링 =====

  /**
   * 검색 결과 사용자 아이템 생성
   * @param {Object} user - 사용자 객체
   * @returns {string} HTML 문자열
   */
  static createSearchUserItem(user) {
    const relationshipStatus = CrossVibeUtils.getRelationshipStatus(user);
    const statusInfo = CrossVibeUtils.getRelationshipInfo(relationshipStatus);
    const avatar = CrossVibeUtils.generateAvatar(
      user.display_name || user.username
    );
    const platforms = CrossVibeUtils.formatPlatforms(user.platform_connections);

    return `
      <div class="search-user-item">
        <div class="d-flex align-items-center">
          <div class="user-avatar user-avatar-sm me-3">${avatar}</div>
          <div class="search-user-info flex-grow-1">
            <div class="search-user-name">${
              user.display_name || user.username
            }</div>
            ${
              user.display_name
                ? `<div class="search-user-username">@${user.username}</div>`
                : ""
            }
            <div class="search-user-platforms">${platforms}</div>
          </div>
          <div class="search-user-actions">
            ${this.getActionButton(user, statusInfo)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 관계 상태에 따른 액션 버튼 생성
   * @param {Object} user - 사용자 객체
   * @param {Object} statusInfo - 상태 정보
   * @returns {string} HTML 문자열
   */
  static getActionButton(user, statusInfo) {
    if (statusInfo.showButton) {
      if (statusInfo.buttonType === "respond") {
        return `
          <button class="btn btn-success btn-sm search-action-button me-1"
                  onclick="FriendManager.respondToRequest(${user.pending_request_id}, 'accept').then(success => success && location.reload())">
            ✅ 수락
          </button>
          <button class="btn btn-danger btn-sm search-action-button" 
                  onclick="FriendManager.respondToRequest(${user.pending_request_id}, 'reject').then(success => success && location.reload())">
            ❌ 거절
          </button>
        `;
      } else {
        return `
          <button class="btn btn-success btn-sm search-action-button" 
                  onclick="FriendManager.sendRequest('${user.username}').then(success => success && setTimeout(() => location.reload(), 1000))">
            ➕ 신청
          </button>
        `;
      }
    } else {
      return `<span class="badge relationship-badge ${statusInfo.class}">${statusInfo.text}</span>`;
    }
  }
  // ===== 공통 UI 요소 =====

  /**
   * 빈 상태 HTML 생성
   * @param {string} icon - 아이콘
   * @param {string} title - 제목
   * @param {string} description - 설명
   * @param {string} action - 액션 버튼 HTML (선택 사항)
   * @returns {string} HTML 문자열
   */
  static createEmptyState(icon, title, description, action = "") {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h4 class="empty-state-title">${title}</h4>
        <p class="empty-state-description">${description}</p>
        ${action ? `<div class="empty-state-action">${action}</div>` : ""}
      </div>
    `;
  }

  /**
   * 로딩 스켈레톤 생성
   * @param {number} count - 스켈레톤 개수
   * @returns {string} HTML 문자열
   */
  static createLoadingSkeleton(count = 3) {
    const skeletonItem = `
      <div class="skeleton-card">
        <div class="d-flex align-items-center">
          <div class="skeleton skeleton-avatar me-3"></div>
          <div class="flex-grow-1">
            <div class="skeleton skeleton-text mb-2"></div>
            <div class="skeleton skeleton-text-small"></div>
          </div>
          <div class="skeleton skeleton-button"></div>
        </div>
      </div>
    `;

    return Array(count).fill(skeletonItem).join("");
  }
}

// ===== 이벤트 핸들러 =====

/**
 * 친구 관련 이벤트 관리 클래스
 */
class FriendEventHandler {
  /**
   * 페이지 이벤트 초기화
   */
  static init() {
    this.setupPageSpecificEvents();

    this.setupCommonEvents();
  }

  /**
   * 페이지별 이벤트 설정
   */
  static setupPageSpecificEvents() {
    if (document.getElementById("socialTabs")) {
      this.setupSocialTabEvents();
    }
  }

  /**
   * 소셜 탭 이벤트 설정
   */
  static setupSocialTabEvents() {
    const tabs = document.querySelectorAll(
      '#socialTabs button[data-bs-toggle="tab"'
    );

    tabs.forEach((tab) => {
      tab.addEventListener("shown.bs.tab", (e) => {
        const targetId = e.target.getAttribute("data-bs-target");

        if (targetId === "#friends") {
          this.refreshFriendsList();
        } else if (targetId === "#manage-friends") {
          this.refreshPendingRequests();
        }
      });
    });
  }

  /**
   * 공통 이벤트 설정
   */
  static setupCommonEvents() {
    //키보드 단축키
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllDropdowns();
      }
    });
  }

  /**
   * 친구 목록 새로고침
   */
  static async refreshFriendsList() {
    const container = document.getElementById("friendsContainer");
    if (!container) return;

    container.innerHTML = FriendRenderer.createLoadingSkeleton();

    try {
      const friends = await FriendManager.getFriends();
      container.innerHTML = FriendRenderer.generateFriendsHTML(friends);
    } catch (error) {
      const errorMessage = CrossVibeUtils.handleError(error, "친구 목록 로드");

      container.innerHTML = FriendRenderer.createEmptyState(
        "❌",
        "친구 목록을 불러올 수 없습니다",
        "네트워크 연결을 확인하고 다시 시도해주세요."
      );
    }
  }

  /**
   * 받은 신청 목록 새로고침
   */
  static async refreshPendingRequests() {
    const container = document.getElementById("pendingRequestsContainer");
    if (!container) return;

    container.innerHTML = FriendRenderer.createLoadingSkeleton();

    try {
      const request = await FriendManager.getPendingRequests();
      container.innerHTML = FriendRenderer.generateRequestsHTML(request);

      this.updatePendingRequestsBadge(request.length);
    } catch (error) {
      console.error(error);

      container.innerHTML = FriendRenderer.createEmptyState(
        "❌",
        "신청 목록을 불러올 수 없습니다",
        "네트워크 연결을 확인하고 다시 시도해주세요"
      );
    }
  }

  /**
   * 받은 신청 배지 업데이트
   * @param {number} count - 신청 개수
   */
  static updatePendingRequestsBadge(count = null) {
    const badge = document.querySelector("#manage-friends-tab .badge");
    if (!badge) return;

    if (count === null) {
      // count가 조회되지 않으면 API에서 조회
      FriendManager.getPendingRequests().then((requests) => {
        this.updatePendingRequestsBadge(requests.length);
      });
      return;
    }

    if (count > 0) {
      badge.textContent = count;
      badge.style.display = "inline";
    } else {
      badge.style.display = "none";
    }
  }

  /**
   * 모든 드롭다운 닫기
   */
  static closeAllDropdowns() {
    document.querySelectorAll(".search-dropdown").forEach((dropdown) => {
      dropdown.classList.add("d-none");
    });
  }
}

// ===== 전역 함수 노출 =====
window.FriendManager = FriendManager;
window.FriendRenderer = FriendRenderer;
window.FriendEventHandler = FriendEventHandler;

// 페이지 로드 시 이벤트 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    FriendEventHandler.init();
  });
} else {
  FriendEventHandler.init();
}

// ===== 하위 호환성 (기존 템플릿과의 호환성 보장) =====
window.respondToRequest = (requestId, action) => {
  FriendManager.respondToRequest(requestId, action).then((success) => {
    if (success) setTimeout(() => location.reload(), 1000);
  });
};

window.viewFriendProfile = FriendManager.viewProfile;
window.sendFriendRequestToUser = FriendManager.sendRequest;
