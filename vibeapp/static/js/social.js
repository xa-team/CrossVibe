// ===== 소셜 페이지 UI 관리 =====

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  initializeSocialPage();
});

function initializeSocialPage() {
  // 소셜 페이지 특화 초기화
  setupTabEvents();
  setupBadgeUpdates();
  setupSearchIntegration();
}

// ===== UI 업데이트 함수들 =====

// 받은 신청 배지 업데이트
async function updatePendingRequestsBadge() {
  try {
    const requests = await FriendManager.getPendingRequests();
    const badge = document.querySelector("#manage-friends-tab .badge");
    const count = requests.length;

    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = "inline";
      } else {
        badge.style.display = "none";
      }
    }
  } catch (error) {
    console.error("배지 업데이트 오류:", error);
  }
}

// 친구 목록 실시간 업데이트 (AJAX)
async function refreshFriendsList() {
  try {
    const friends = await FriendManager.getFriends();
    const friendsContainer = document.getElementById("friendsContainer");

    if (friendsContainer) {
      friendsContainer.innerHTML = FriendRenderer.generateFriendsHTML(friends);
    }

    // 친구 통계 업데이트
    const statsElement = document.getElementById("friendsStats");
    if (statsElement) {
      statsElement.innerHTML = `
                <h6>📊 친구 통계</h6>
                <p class="mb-0">총 ${friends.length}명의 친구와 연결되어 있습니다!</p>
            `;
    }
  } catch (error) {
    console.error("친구 목록 새로고침 오류:", error);
  }
}

// 받은 신청 목록 실시간 업데이트 (AJAX)
async function refreshPendingRequests() {
  try {
    const requests = await FriendManager.getPendingRequests();
    const requestsContainer = document.getElementById(
      "pendingRequestsContainer"
    );

    if (requestsContainer) {
      requestsContainer.innerHTML =
        FriendRenderer.generateRequestsHTML(requests);
    }

    await updatePendingRequestsBadge();
  } catch (error) {
    console.error("받은 신청 새로고침 오류:", error);
  }
}

// 검색 결과 표시 (search.js와 연동)
function displaySocialSearchResults(users) {
  const resultsContainer = document.getElementById("searchResultsList");

  if (!resultsContainer) return;

  if (users.length === 0) {
    resultsContainer.innerHTML =
      '<div class="text-center text-muted py-2">검색 결과가 없습니다</div>';
  } else {
    resultsContainer.innerHTML = users
      .map((user) => FriendRenderer.createSearchUserItem(user))
      .join("");
  }

  // 검색 결과 영역 표시
  const searchResults = document.getElementById("searchResults");
  if (searchResults) {
    searchResults.style.display = "block";
  }
}

// ===== 탭 이벤트 처리 =====

function setupTabEvents() {
  // 탭 전환 시 데이터 새로고침
  const tabs = document.querySelectorAll(
    '#socialTabs button[data-bs-toggle="tab"]'
  );

  tabs.forEach((tab) => {
    tab.addEventListener("shown.bs.tab", function (e) {
      const targetId = e.target.getAttribute("data-bs-target");

      if (targetId === "#friends") {
        refreshFriendsList();
      } else if (targetId === "#manage-friends") {
        refreshPendingRequests();
      }
    });
  });
}

function setupBadgeUpdates() {
  // 페이지 로드 시 배지 업데이트
  updatePendingRequestsBadge();

  // 주기적으로 배지 업데이트 (선택사항)
  // setInterval(updatePendingRequestsBadge, 30000); // 30초마다
}

// search.js와의 연동 설정
function setupSearchIntegration() {
  // search.js에서 호출할 수 있도록 전역 함수로 노출
  window.displaySocialSearchResults = displaySocialSearchResults;

  // 검색 지우기 함수
  window.clearSearch = function () {
    const input = document.getElementById("friendUsername");
    const dropdown = document.getElementById("searchResults");

    if (input) input.value = "";
    if (dropdown) dropdown.style.display = "none";
  };
}

// ===== 실시간 알림 시스템 (선택사항) =====

// 웹소켓 연결 (향후 구현)
function setupRealTimeNotifications() {
  // WebSocket 연결하여 실시간 친구 신청 알림
  // const socket = new WebSocket('ws://localhost:5000/ws');
  // socket.onmessage = function(event) {
  //     const data = JSON.parse(event.data);
  //     if (data.type === 'friend_request') {
  //         updatePendingRequestsBadge();
  //         Utils.showToast(`${data.sender}님이 친구 신청을 보냈습니다!`, 'info');
  //     }
  // };
}

// ===== 페이지 성능 최적화 =====

// 지연 로딩 설정
function setupLazyLoading() {
  // IntersectionObserver를 사용한 친구 목록 지연 로딩
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // 필요할 때만 데이터 로드
        const tab = entry.target;
        if (tab.id === "friends" && !tab.dataset.loaded) {
          refreshFriendsList();
          tab.dataset.loaded = "true";
        }
      }
    });
  });

  const tabs = document.querySelectorAll(".tab-pane");
  tabs.forEach((tab) => observer.observe(tab));
}

// ===== 키보드 단축키 =====

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", function (e) {
    // Ctrl + F: 검색 박스에 포커스
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault();
      const searchInput = document.getElementById("friendUsername");
      if (searchInput) {
        searchInput.focus();
      }
    }

    // ESC: 검색 결과 닫기
    if (e.key === "Escape") {
      const searchResults = document.getElementById("searchResults");
      if (searchResults) {
        searchResults.style.display = "none";
      }
    }

    // Tab + 1,2: 탭 전환
    if (e.altKey) {
      if (e.key === "1") {
        e.preventDefault();
        document.getElementById("friends-tab")?.click();
      } else if (e.key === "2") {
        e.preventDefault();
        document.getElementById("manage-friends-tab")?.click();
      }
    }
  });
}

// ===== 데이터 캐싱 시스템 =====

const SocialCache = {
  friends: null,
  pendingRequests: null,
  lastUpdate: {
    friends: 0,
    pendingRequests: 0,
  },

  // 캐시 유효성 검사 (5분)
  isValid(key) {
    const now = Date.now();
    const lastUpdate = this.lastUpdate[key] || 0;
    return now - lastUpdate < 300000; // 5분
  },

  // 친구 목록 캐시 조회
  async getFriends() {
    if (this.friends && this.isValid("friends")) {
      return this.friends;
    }

    this.friends = await FriendManager.getFriends();
    this.lastUpdate.friends = Date.now();
    return this.friends;
  },

  // 받은 신청 캐시 조회
  async getPendingRequests() {
    if (this.pendingRequests && this.isValid("pendingRequests")) {
      return this.pendingRequests;
    }

    this.pendingRequests = await FriendManager.getPendingRequests();
    this.lastUpdate.pendingRequests = Date.now();
    return this.pendingRequests;
  },

  // 캐시 무효화
  invalidate(key) {
    if (key) {
      this[key] = null;
      this.lastUpdate[key] = 0;
    } else {
      // 전체 캐시 무효화
      this.friends = null;
      this.pendingRequests = null;
      this.lastUpdate = { friends: 0, pendingRequests: 0 };
    }
  },
};

// ===== 사용자 경험 개선 함수들 =====

// 스켈레톤 로딩 표시
function showLoadingSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const skeletonHTML = `
        <div class="skeleton-loading">
            ${Array(3)
              .fill(0)
              .map(
                () => `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="skeleton skeleton-avatar me-3"></div>
                            <div class="flex-grow-1">
                                <div class="skeleton skeleton-text mb-2"></div>
                                <div class="skeleton skeleton-text-small"></div>
                            </div>
                            <div class="skeleton skeleton-button"></div>
                        </div>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;

  container.innerHTML = skeletonHTML;
}

// 빈 상태 표시
function showEmptyState(containerId, type = "friends") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const emptyStates = {
    friends: {
      icon: "👥",
      title: "아직 친구가 없습니다",
      description: "친구를 추가해서 음악 취향을 공유해보세요!",
      action:
        '<button class="btn btn-primary" onclick="document.getElementById(\'manage-friends-tab\')?.click()">친구 추가하기</button>',
    },
    requests: {
      icon: "📭",
      title: "받은 신청이 없습니다",
      description: "새로운 친구 신청을 기다리고 있어요",
      action: "",
    },
    search: {
      icon: "🔍",
      title: "검색 결과가 없습니다",
      description: "다른 검색어로 시도해보세요",
      action: "",
    },
  };

  const state = emptyStates[type] || emptyStates.friends;

  container.innerHTML = `
        <div class="text-center py-5">
            <div class="display-1">${state.icon}</div>
            <h4>${state.title}</h4>
            <p class="text-muted">${state.description}</p>
            ${state.action}
        </div>
    `;
}

// ===== 성능 모니터링 =====

const SocialMetrics = {
  startTime: Date.now(),

  // 페이지 로드 시간 측정
  measurePageLoad() {
    window.addEventListener("load", () => {
      const loadTime = Date.now() - this.startTime;
      console.log(`소셜 페이지 로드 시간: ${loadTime}ms`);
    });
  },

  // API 응답 시간 측정
  async measureAPICall(apiFunction, name) {
    const start = Date.now();
    try {
      const result = await apiFunction();
      const duration = Date.now() - start;
      console.log(`${name} API 응답 시간: ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`${name} API 오류 (${duration}ms):`, error);
      throw error;
    }
  },
};

// ===== 전역 함수 노출 =====

// 다른 파일에서 사용할 수 있도록 전역으로 노출
window.SocialPage = {
  refreshFriendsList,
  refreshPendingRequests,
  updatePendingRequestsBadge,
  displaySocialSearchResults,
  showLoadingSkeleton,
  showEmptyState,
};

window.SocialCache = SocialCache;

// 초기화 완료 후 키보드 단축키와 성능 모니터링 설정
setTimeout(() => {
  setupKeyboardShortcuts();
  setupLazyLoading();
  SocialMetrics.measurePageLoad();
}, 100); // vibeapp/static/js/social.js

// ===== 소셜 기능 전용 JavaScript =====

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  initializeSocialPage();
});

function initializeSocialPage() {
  // 소셜 페이지 특화 초기화
  setupTabEvents();
  setupBadgeUpdates();
}

// ===== 친구 관리 기능 =====

// 친구 신청 응답 (수락/거절)
async function respondToFriendRequest(requestId, action) {
  const actionText = action === "accept" ? "수락" : "거절";

  if (!confirm(`정말로 이 친구 신청을 ${actionText}하시겠습니까?`)) {
    return;
  }

  try {
    const response = await fetch(
      `/respond-friend-request/${requestId}/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (response.ok) {
      showNotification(result.message, "success");
      await updatePendingRequestsBadge();
      setTimeout(() => location.reload(), 1000);
    } else {
      showNotification("오류: " + result.error, "error");
    }
  } catch (error) {
    showNotification("네트워크 오류가 발생했습니다.", "error");
    console.error("친구 신청 응답 오류:", error);
  }
}

// 친구 신청 취소
async function cancelFriendRequest(requestId) {
  if (!confirm("정말로 이 친구 신청을 취소하시겠습니까?")) {
    return;
  }

  try {
    const response = await fetch(`/cancel-friend-request/${requestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (response.ok) {
      showNotification(result.message, "success");
      setTimeout(() => location.reload(), 1000);
    } else {
      showNotification("오류: " + result.error, "error");
    }
  } catch (error) {
    showNotification("네트워크 오류가 발생했습니다.", "error");
    console.error("친구 신청 취소 오류:", error);
  }
}

// 친구 프로필 보기
function viewFriendProfile(username) {
  if (username) {
    window.location.href = `/user/${username}`;
  } else {
    showNotification("사용자명이 없습니다.", "error");
  }
}

// ===== API 함수들 =====

// 친구 목록 가져오기
async function getFriends() {
  const result = await apiRequest("/api/friends");
  if (result.success) {
    return result.data.friends;
  } else {
    showNotification("친구 목록을 불러올 수 없습니다.", "error");
    return [];
  }
}

// 받은 친구 신청 가져오기
async function getPendingRequests() {
  const result = await apiRequest("/api/friend-requests");
  if (result.success) {
    return result.data.requests;
  } else {
    showNotification("친구 신청 목록을 불러올 수 없습니다.", "error");
    return [];
  }
}

// ===== UI 업데이트 함수들 =====

// 받은 신청 배지 업데이트
async function updatePendingRequestsBadge() {
  try {
    const requests = await getPendingRequests();
    const badge = document.querySelector("#manage-friends-tab .badge");
    const count = requests.length;

    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = "inline";
      } else {
        badge.style.display = "none";
      }
    }
  } catch (error) {
    console.error("배지 업데이트 오류:", error);
  }
}

// 친구 목록 실시간 업데이트 (AJAX)
async function refreshFriendsList() {
  try {
    const friends = await getFriends();
    const friendsContainer = document.getElementById("friendsContainer");

    if (friendsContainer && friends) {
      friendsContainer.innerHTML = generateFriendsHTML(friends);
    }
  } catch (error) {
    console.error("친구 목록 새로고침 오류:", error);
  }
}

// 받은 신청 목록 실시간 업데이트 (AJAX)
async function refreshPendingRequests() {
  try {
    const requests = await getPendingRequests();
    const requestsContainer = document.getElementById(
      "pendingRequestsContainer"
    );

    if (requestsContainer && requests) {
      requestsContainer.innerHTML = generateRequestsHTML(requests);
    }

    await updatePendingRequestsBadge();
  } catch (error) {
    console.error("받은 신청 새로고침 오류:", error);
  }
}

// ===== HTML 생성 함수들 =====

function generateFriendsHTML(friends) {
  if (friends.length === 0) {
    return `
            <div class="text-center py-5">
                <div class="display-1">👥</div>
                <h4>아직 친구가 없습니다</h4>
                <p class="text-muted">친구를 추가해서 음악 취향을 공유해보세요!</p>
            </div>
        `;
  }

  return friends
    .map(
      (friend) => `
        <div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="card-title mb-1">${
                              friend.display_name || friend.username
                            }</h6>
                            <small class="text-muted">
                                ${
                                  friend.platform_connections
                                    .map((platform) =>
                                      platform === "spotify"
                                        ? "🎵 Spotify"
                                        : platform === "youtube"
                                        ? "▶️ YouTube"
                                        : platform
                                    )
                                    .join(", ") || "연결된 플랫폼 없음"
                                }
                            </small>
                        </div>
                        <div>
                            <button class="btn btn-primary btn-sm" onclick="viewFriendProfile('${
                              friend.username
                            }')">
                                👤 프로필
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function generateRequestsHTML(requests) {
  if (requests.length === 0) {
    return `
            <div class="text-center text-muted py-3">
                <div class="mb-2">📭</div>
                <small>받은 신청이 없습니다</small>
            </div>
        `;
  }

  return requests
    .map(
      (req) => `
        <div class="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
            <div>
                <h6 class="mb-0">${
                  req.requester.display_name || req.requester.username
                }</h6>
                <small class="text-muted">${formatDate(req.created_at)}</small>
            </div>
            <div>
                <button class="btn btn-success btn-sm me-1" onclick="respondToRequest(${
                  req.id
                }, 'accept')">
                    ✅
                </button>
                <button class="btn btn-danger btn-sm" onclick="respondToRequest(${
                  req.id
                }, 'reject')">
                    ❌
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

// ===== 탭 이벤트 처리 =====

function setupTabEvents() {
  // 탭 전환 시 데이터 새로고침
  const tabs = document.querySelectorAll(
    '#socialTabs button[data-bs-toggle="tab"]'
  );

  tabs.forEach((tab) => {
    tab.addEventListener("shown.bs.tab", function (e) {
      const targetId = e.target.getAttribute("data-bs-target");

      if (targetId === "#friends") {
        refreshFriendsList();
      } else if (targetId === "#manage-friends") {
        refreshPendingRequests();
      }
    });
  });
}

function setupBadgeUpdates() {
  // 페이지 로드 시 배지 업데이트
  updatePendingRequestsBadge();

  // 주기적으로 배지 업데이트 (옵션)
  // setInterval(updatePendingRequestsBadge, 30000); // 30초마다
}

// ===== 유틸리티 함수들 =====

// 알림 표시 함수
function showNotification(message, type = "info") {
  if (type === "error") {
    alert("❌ " + message);
  } else if (type === "success") {
    alert("✅ " + message);
  } else {
    alert("ℹ️ " + message);
  }
}

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

// ===== 전역 함수 노출 =====
// 템플릿에서 직접 호출할 수 있도록 전역으로 노출
window.respondToRequest = respondToFriendRequest;
window.cancelRequest = cancelFriendRequest;
window.viewFriendProfile = viewFriendProfile;
window.refreshFriendsList = refreshFriendsList;
window.refreshPendingRequests = refreshPendingRequests;
