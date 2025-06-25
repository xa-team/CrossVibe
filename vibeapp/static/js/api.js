// ===== API 헬퍼 & 유틸리티 함수들 =====

// ===== API 요청 함수 =====

// 공통 API 요청 함수
async function apiRequest(url, options = {}) {
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

// POST 요청 헬퍼
async function postRequest(url, data = {}) {
  return await apiRequest(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PUT 요청 헬퍼
async function putRequest(url, data = {}) {
  return await apiRequest(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE 요청 헬퍼
async function deleteRequest(url) {
  return await apiRequest(url, {
    method: "DELETE",
  });
}

// ===== 소셜 API 함수들 =====

// 사용자 검색
async function searchUsersAPI(query) {
  const result = await apiRequest(
    `/api/search-users?q=${encodeURIComponent(query)}`
  );
  if (result.success) {
    return result.data.users;
  } else {
    showNotification("사용자 검색 중 오류가 발생했습니다.", "error");
    return [];
  }
}

// 친구 목록 가져오기
async function getFriendsAPI() {
  const result = await apiRequest("/api/friends");
  if (result.success) {
    return result.data.friends;
  } else {
    showNotification("친구 목록을 불러올 수 없습니다.", "error");
    return [];
  }
}

// 받은 친구 신청 가져오기
async function getPendingRequestsAPI() {
  const result = await apiRequest("/api/friend-requests");
  if (result.success) {
    return result.data.requests;
  } else {
    showNotification("친구 신청 목록을 불러올 수 없습니다.", "error");
    return [];
  }
}

// 친구 신청 보내기 (사용자명으로)
async function sendFriendRequestAPI(username) {
  return await postRequest("/send-friend-request", { username });
}

// 친구 신청 보내기 (사용자 ID로)
async function sendFriendRequestByIdAPI(userId) {
  return await postRequest("/send-friend-request-by-id", { user_id: userId });
}

// 친구 신청 응답
async function respondToRequestAPI(requestId, action) {
  return await postRequest(`/respond-friend-request/${requestId}/${action}`);
}

// 친구 신청 취소
async function cancelRequestAPI(requestId) {
  return await postRequest(`/cancel-friend-request/${requestId}`);
}

// ===== 알림 시스템 =====

// 알림 표시 함수
function showNotification(message, type = "info") {
  // 현재는 간단한 alert 사용, 향후 토스트로 업그레이드 가능
  const icon = {
    error: "❌",
    success: "✅",
    warning: "⚠️",
    info: "ℹ️",
  };

  alert(`${icon[type] || icon.info} ${message}`);
}

// 토스트 알림 (향후 구현용)
function showToast(message, type = "info", duration = 3000) {
  // Bootstrap Toast 또는 커스텀 토스트 구현
  console.log(`Toast [${type}]: ${message} (${duration}ms)`);

  // 간단한 토스트 구현 예시
  const toast = document.createElement("div");
  toast.className = `alert alert-${
    type === "error" ? "danger" : type
  } position-fixed`;
  toast.style.cssText = `
        top: 20px; 
        right: 20px; 
        z-index: 9999; 
        min-width: 300px;
        opacity: 0;
        transition: opacity 0.3s;
    `;
  toast.textContent = message;

  document.body.appendChild(toast);

  // 페이드 인
  setTimeout(() => (toast.style.opacity = "1"), 10);

  // 자동 제거
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => document.body.removeChild(toast), 300);
  }, duration);
}

// 확인 대화상자
function showConfirm(message, callback) {
  if (confirm(message)) {
    callback();
  }
}

// ===== 유틸리티 함수들 =====

// 날짜 포맷팅
function formatDate(dateString) {
  if (!dateString) return "알 수 없음";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR");
}

// 디바운스 함수
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 스로틀 함수
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 사용자 아바타 생성
function generateAvatar(name) {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

// 플랫폼 아이콘 변환
function getPlatformIcon(platform) {
  const icons = {
    spotify: "🎵",
    youtube: "▶️",
    applemusic: "🍎",
    default: "🎶",
  };
  return icons[platform] || icons.default;
}

// 플랫폼 이름 변환
function getPlatformName(platform) {
  const names = {
    spotify: "Spotify",
    youtube: "YouTube Music",
    applemusic: "Apple Music",
  };
  return names[platform] || platform;
}

// 관계 상태 정보 가져오기
function getRelationshipInfo(status) {
  const statusMap = {
    friend: { class: "bg-success", text: "👫 친구", showButton: false },
    sent_request: { class: "bg-warning", text: "⏳ 신청함", showButton: false },
    received_request: {
      class: "bg-info",
      text: "📨 신청받음",
      showButton: false,
    },
    none: {
      class: "bg-light text-dark",
      text: "👋 연결 가능",
      showButton: true,
    },
  };
  return statusMap[status] || statusMap.none;
}

// 에러 처리
function handleError(error, context = "") {
  console.error(`${context} 오류:`, error);
  showNotification(`${context} 중 오류가 발생했습니다.`, "error");
}

// 로딩 상태 관리
function setLoading(element, isLoading, originalText = "") {
  if (isLoading) {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.textContent = "⏳ 처리중...";
  } else {
    element.disabled = false;
    element.textContent =
      originalText || element.dataset.originalText || "완료";
  }
}

// ===== 전역 함수 노출 =====
// 다른 파일에서 사용할 수 있도록 전역으로 노출
window.API = {
  // 기본 요청 함수들
  request: apiRequest,
  post: postRequest,
  put: putRequest,
  delete: deleteRequest,

  // 소셜 API 함수들
  searchUsers: searchUsersAPI,
  getFriends: getFriendsAPI,
  getPendingRequests: getPendingRequestsAPI,
  sendFriendRequest: sendFriendRequestAPI,
  sendFriendRequestById: sendFriendRequestByIdAPI,
  respondToRequest: respondToRequestAPI,
  cancelRequest: cancelRequestAPI,
};

window.Utils = {
  // 알림 함수들
  showNotification,
  showToast,
  showConfirm,

  // 유틸리티 함수들
  formatDate,
  debounce,
  throttle,
  generateAvatar,
  getPlatformIcon,
  getPlatformName,
  getRelationshipInfo,
  handleError,
  setLoading,
};
