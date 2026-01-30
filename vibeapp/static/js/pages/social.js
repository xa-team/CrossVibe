// ===== 소셜 페이지 UI 관리 =====

// 소셜 페이지의 전반적인 UI 초기화 및
// Friends 모듈(FriendManager, FriendRenderer, FriendEventHandler)과의 통합을 담당

// 페이지 로드 시 초기화 함수 호출
document.addEventListener("DOMContentLoaded", function () {
  initializeSocialPage();
});

/**
 * 소셜 페이지의 초기화 로직
 */
function initializeSocialPage() {
  FriendEventHandler.init();

  setupSearchIntegration();
  setupKeyboardShortcuts();
  setupLazyLoading();

  SocialMetrics.measurePageLoad();
}

/**
 * 탭 이벤트 처리
 */
function setupTabEvents() {
  const tabs = document.querySelectorAll(
    '#socialTabs button[data-bs-toggle="tab"]',
  );

  tabs.forEach((tab) => {
    tab.addEventListener("shown.bs.tab", () => {
      const targetId = e.target.getAttribute("data-bs-target");

      localStorage.setItem("socialActiveTab", targetId);

      if (targetId === "#friends") {
        FriendEventHandler.refreshFriendsList();
      } else if (targetId === "#manage-friends") {
        FriendEventHandler.refreshPendingRequests();
      }
    });
  });
}

/**
 * 배지 업데이트 처리
 */
function setupBadgeUpdates() {
  FriendEventHandler.updatePendingRequestsBadge();
}

/**
 * search.js 모듈과의 연동을 설정
 * search.js에서 검색 결과를 표시할 때 호출할 함수를 전역으로 노출
 */
function setupSearchIntegration() {
  window.displaySocialSearchResults = displaySocialSearchResults;

  window.clearSearch = function () {
    const input = document.getElementById("friendUsername");
    const dropdown = document.getElementById("searchResults");

    if (input) input.value = "";
    if (dropdown) dropdown.style.display = "none";
  };
}

/**
 * 키보드 단축키를 설정
 */
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", function (e) {
    // Ctrl + F: 검색 박스에 포커스
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault();
      document.getElementById("friendUsername")?.focus();
    }

    // ESC: 검색 결과 닫기
    if (e.key === "Escape") {
      document.getElementById("searchResults").style.display = "none";
    }

    // Alt + 1,2: 탭 전환
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

/**
 * localStorae에 저장된 탭 상태를 복원하고 해당 탭을 활성화합니다.
 */
function restoreActiveTab() {
  const storedTabTarget = localStorage.getItem("socialActiveTab");
  if (storedTabTarget) {
    const tabElement = document.querySelector(
      `button[data-bs-target="${storedTabTarget}"]`,
    );
    if (tabElement) {
      const bsTab = new bootstrap.Tab(tabElement);
      bsTab.show();
    }
  } else {
    // 저장된 탭이 없으면 기본 탭(내 친구)을 활성화
    const defaultTab = document.getElementById("friends-tab");
    if (defaultTab) {
      const bsTab = new bootstrap.Tab(defaultTab);
      bsTab.show();
    }
  }
}

/**
 * IntersectionObserver를 사용해 탭 컨텐츠의 지연 로딩을 설정
 * (현재는 FriendEventHandler에서 데이터 로딩을 관리하므로, 이 함수는 구조만 유지하고 필요에 따라 확장)
 */
function setupLazyLoading() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const tabPane = entry.target;
          // 추가적인 로딩 로직은 생략
          // 필요에 따라 특정 탭이 보일 때 추가적인 UI 업데이트나 애니메이션을 트리거할 수 있음
          observer.unobserve(tabPane);
        }
      });
    },
    {
      rootMargin: "0px",
      threshold: 0.1, // 10%가 보일 때 트리거
    },
  );

  // 모든 탭 컨텐츠에 옵저버 연결
  document.querySelectorAll(".tab-pane").forEach((tabPane) => {
    observer.observe(tabPane);
  });
}

/**
 * 사용자 검색 결과를 소셜 페이지의 특정 컨테이너에 표시
 * 이 함수는 search.js에서 검색 완료된 후 호출됨
 * @param {Array<Object>} users - 검색된 사용자 목록
 */
function displaySocialSearchResults(users) {
  const resultsListContainer = document.getElementById("searchResultsList"); // 실제 검색 결과 아이템이 들어갈 곳
  const searchResultsWrapper = document.getElementById("searchResults"); // 전체 검색 결과 영역 (표시/숨김 제어용)

  if (!resultsListContainer || !searchResultsWrapper) return;

  if (users.length === 0) {
    resultsListContainer.innerHTML = FriendRenderer.createEmptyState(
      "🔍",
      "검색 결과가 없습니다",
      "다른 검색어로 시도해보세요",
    );
  } else {
    resultsListContainer.innerHTML = users
      .map((user) => FriendRenderer.createSearchUserItem(user))
      .join("");
  }

  // 검색 결과 영역 표시
  searchResultsWrapper.style.display = "block";
}

/**
 * 소셜페이지의 성능 측정 및 로깅을 위한 객체
 */
const SocialMetrics = {
  startTime: Date.now(), // 페이지 로드 시작 시간

  /**
   * 페이지 로드 시간을 측정하여 콘솔에 기록
   */
  measurePageLoad() {
    window.addEventListener("load", () => {
      const loadTime = Date.now() - this.startTime;
      console.log(`[SocialMetrics] 소셜 페이지 로드 시간: ${loadTime}ms`);
    });
  },

  /**
   * API 호출 시간을 측정하여 콘솔에 기록
   * @param {Function} apiFunction - 측정할 비동기 API 함수
   * @param {string} name - API 호출의 이름 (로그용)
   * @returns {Promise<any>} API 함수의 결과
   */
  async measureAPICall(apiFunction, name) {
    const start = Date.now();
    try {
      const result = await apiFunction();
      const duration = Date.now() - start;
      console.log(`[SocialMetric] ${name} API 응답 시간: ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[SocialMetric] ${name} API 오류 (${duration}ms):`, error);
      throw error;
    }
  },
};

/**
 * 데이터 캐싱을 위한 객체
 */
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

// ===== 전역 함수 노출 =====

// 다른 파일에서 사용할 수 있도록 전역으로 노출
window.SocialPage = {
  displaySocialSearchResults,
  showLoadingSkeleton: FriendRenderer.createLoadingSkeleton,
  showEmptyState: FriendRenderer.createEmptyState,
};

window.SocialCache = SocialCache;

setTimeout(() => {
  setupKeyboardShortcuts();
  setupLazyLoading();
  SocialMetrics.measurePageLoad();
}, 100);
