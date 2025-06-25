// ===== CrossVibe API 통신 전담 모듈=====
// 모든 서버 API 호출을 중앙화하여 관리

class CrossVibeAPI {
  // ===== 기본 HTTP 요청 메서드들 =====
  /**
   * 공통 API 요청 함수
   * @param {string} url - 요청할 URL
   * @param {Object} options - fetch 옵션
   * @returns {Promise<Object>} API 응답 결과
   */
  static async request(url, options = {}) {
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      const result = await response.json();

      return {
        success: response.ok,
        data: result,
        status: response.status,
      };
    } catch (error) {
      console.error("API 요청 오류:", error);

      return {
        success: false,
        error: error.message,
        status: null,
      };
    }
  }

  /**
   * POST 요청 헬퍼
   * @param {string} url - 요청할 URL
   * @param {Object} data - 전송할 데이터
   * @returns {Promise<Object>} API 응답 결과
   */
  static async post(url, data = {}) {
    return await this.request(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT 요청 헬퍼
   * @param {string} url - 요청할 URL
   * @param {Object} data - 전송할 데이터
   * @returns {Promise<Object>} API 응답 결과
   */
  static async put(url, data = {}) {
    return await this.request(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  /**
   * DELETE 요청 헬퍼
   * @param {string} url - 요청할 URL
   * @returns {Promise<Object>} API 응답 결과
   */
  static async delete(url) {
    return await this.request(url, {
      method: "DELETE",
    });
  }

  // ===== 사용자 검색 API =====
  /**
   * 사용자 검색
   * @param {string} query - 검색어
   * @returns {Promise<Array>} 검색된 사용자 목록
   */
  static async searchUsers(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const result = await this.request(
      `/api/search-users?q=${encodeURIComponent(query.trim())}`
    );

    if (result.success) {
      return result.data.users || [];
    } else {
      throw new Error(
        result.data?.error || "사용자 검색 중 오류가 발생했습니다."
      );
    }
  }

  // ===== 친구 관리 API =====
  /**
   * 친구 목록 조회
   * @returns {Promise<Array>} 친구 목록
   */
  static async getFriends() {
    const result = await this.request("/api/friends");

    if (result.success) {
      return result.data.friends || [];
    } else {
      throw new Error(result.data?.error || "친구 목록을 불러올 수 없습니다.");
    }
  }

  /**
   * 받은 친구 신청 목록 조회
   * @returns {Promise<Array>} 받은 친구 신청 목록
   */
  static async getPendingRequests() {
    const result = await this.request("/api/friend-requests");

    if (result.success) {
      return result.data.requests || [];
    } else {
      throw new Error(
        result.data?.error || "친구 신청 목록을 불러올 수 없습니다."
      );
    }
  }

  /**
   * 친구 신청 보내기 (사용자명 기반)
   * @param {string} username - 대상 사용자명
   * @returns {Promise<Object>}  응답 결과
   */
  static async sendFriendRequest(username) {
    if (!username || typeof username !== "string") {
      throw new Error("올바른 사용자명을 입력해주세요.");
    }

    return await this.post("/send-friend-request", {
      username: username.trim(),
    });
  }

  /**
   * 친구 신청 보내기 (사용자 ID 기반)
   * @param {number} userID - 대상 사용자 ID
   * @returns {Promise<Object>}  응답 결과
   */
  static async sendFriendRequestById(userId) {
    if (!userId || isNaN(userId)) {
      throw new Error("올바른 사용자 ID를 입력해주세요.");
    }

    return await this.post("/send-friend-request-by-id", { user_id: userId });
  }

  /**
   * 친구 신청 응답 (수락/거절)
   * @param {number} requestId - 신청 ID
   * @param {string} action - 'accept' 또는 'reject'
   * @returns {Promise<Object>}  응답 결과
   */
  static async respondToRequest(requestId, action) {
    if (!requestId || isNaN(requestId)) {
      throw new Error("올바른 신청 ID를 입력해주세요.");
    }

    if (!["accept", "reject".includes(action)]) {
      throw new Error("action은 'accept' 또는 'reject'여야 합니다.");
    }

    return await this.post(`/repond-friend-request/${requestId}/${action}`);
  }

  /**
   * 친구 신청 취소
   * @param {number} requestId - 신청 ID
   * @returns {Promise<Object>}  응답 결과
   */
  static async cancelRequest(requestId) {
    if (!requestId || isNaN(requestId)) {
      throw new Error("올바른 신청 ID를 입력해주세요.");
    }

    return await this.post(`/cancel-friend-request/${requestId}`);
  }

  // ===== 사용자 계정 API =====

  /**
   * 사용자명 업데이트
   * @param {string} username - 새 사용자명
   * @returns {Promise<Object>} 응답 결과
   */
  static async updateUsername(username) {
    if (!username || typeof username !== "string") {
      throw new Error("올바른 사용자명을 입력해주세요 .");
    }

    // 클라이언트 측 유효성 검사
    const trimmedUsername = username.trim();
    if (!/^[a-zA-z0-9_]{3,20}$/.test(trimmedUsername)) {
      throw new Error(
        "사용자명은 영문, 숫자, 언더스코어(_)만 사용하여 3-20자로 입력해주세요."
      );
    }

    return await this.post("/update-username", { username: trimmedUsername });
  }

  // ===== 에러 처리 헬퍼 =====

  /**
   * API 에러를 사용자 친화적 메시지로 변환
   * @param {Error} error - 에러 객체
   * @param {string} context - 에러 발생 컨텍스트
   * @returns {string} 사용자 친화적 에러 메시지
   */
  static formatError(error, context = "") {
    if (error.message) {
      return error.message;
    }

    // 기본 에러 메시지
    const defaultErrorMessages = {
      network: "네트워크 연결을 확인해주세요.",
      server: "서버에 일시적인 문제가 발생했습니다.",
      auth: "로그인이 필요합니다.",
      permission: "권한이 없습니다.",
    };

    return defaultErrorMessages.server;
  }
}

// ===== 전역 노출 =====
window.CrossVibeAPI = CrossVibeAPI;

// 하위 호환성을 위한 기존 API 별칭 (추후 제거 예정)
window.API = {
  request: CrossVibeAPI.request.bind(CrossVibeAPI),
  post: CrossVibeAPI.post.bind(CrossVibeAPI),
  put: CrossVibeAPI.put.bind(CrossVibeAPI),
  delete: CrossVibeAPI.delete.bind(CrossVibeAPI),
  searchUsers: CrossVibeAPI.searchUsers.bind(CrossVibeAPI),
  getFriends: CrossVibeAPI.getFriends.bind(CrossVibeAPI),
  getPendingRequests: CrossVibeAPI.getPendingRequests.bind(CrossVibeAPI),
  sendFriendRequest: CrossVibeAPI.sendFriendRequest.bind(CrossVibeAPI),
  sendFriendRequestById: CrossVibeAPI.sendFriendRequestById.bind(CrossVibeAPI),
  respondToRequest: CrossVibeAPI.respondToRequest.bind(CrossVibeAPI),
  cancelRequest: CrossVibeAPI.cancelRequest.bind(CrossVibeAPI),
};
