// ===== 검색 기능 전담 모듈 =====
// 사용자 검색 및 검색 결과 UI를 관리

/** @type {number||null} 검색 디바운싱용 타이머 ID */
let searchTimeout;

/** @type {AbortController||null} 현재 검색 요청 컨트롤러*/
let currentSearchController;

/**
 * 검색 설정 객체
 * @namespace SearchConfig
 */
const SearchConfig = {
  /**
   * 내비게이션 바 검색 설정
   * @type {Object}
   */
  navbar: {
    inputs: ["userSearchInput", "userSearchInputMobile"],
    dropdowns: ["searchDropdown", "searchDropdownMobile"],
    onSelect: viewUserProfile,
    showActions: true,
  },

  /**
   * 소셜 페이지 검색 설정
   * @type {Object}
   */
  social: {
    inputs: ["friendUsername"],
    dropdowns: ["searchResults"],
    onSelect: null, // 커스텀 핸들러(SocialPage.displaySocialSearchResults) 사용
    showActions: true,
    customResultContainer: "searchResultsList",
  },
};

// ===== 초기화 =====

/**
 * DOM 로드 완료 시 검색 기능 초기화
 * @event DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", function () {
  initializeSearch();
});

/**
 * 페이지별 검색 설정 감지 및 초기화
 * @returns {void}
 * @description 현재 페이지에 맞는 검색 설정을 적용
 */
function initializeSearch() {
  const currentPage = detectCurrentPage();

  if (currentPage === "social") {
    initializeSocialSearch();
  } else {
    initializeNavbarSearch();
  }

  // 전역 이벤트 리스너
  setupGlobalEvents();
}

/**
 *
 * @returns {string} 페이지 타입 ('social' | 'default')
 * @example
 * const pageType = detectCurrentPage();
 * console.log(pageType); // 'social' 또는 'default'
 */
function detectCurrentPage() {
  if (window.location.pathname.includes("/social")) {
    return "social";
  }
  return "default";
}

/**
 * 내비게이션 바 검색 초기화
 * @returns {void}
 * @description 데스크탑과 모바일 내비게이션 바 검색 설정
 */
function initializeNavbarSearch() {
  const config = SearchConfig.navbar;
  config.inputs.forEach((inputId, index) => {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(config.dropdowns[index]);

    if (input && dropdown) {
      setupSearch(input, dropdown, config);
    }
  });
}

/**
 * 소셜 페이지 검색 초기화
 */
function initializeSocialSearch() {
  const config = SearchConfig.social;
  const input = document.getElementById(config.inputs[0]);
  const dropdown = document.getElementById(config.dropdowns[0]);

  if (input && dropdown) {
    setupSearch(input, dropdown, config);
  }
}

/**
 * 검색 입력 필드와 드롭다운에 이벤트 리스너 설정
 * @param {HTMLElement} searchInput - 검색 입력 필드 요소
 * @param {HTMLElement} searchDropdown - 검색 결과 드롭다운 요소
 * @param {Object} config - 검색 설정 객체
 */
function setupSearch(searchInput, searchDropdown, config) {
  searchInput.addEventListener("input", function (e) {
    const query = e.target.value.trim();

    if (currentSearchController) {
      currentSearchController.abort();
    }

    if (query.length < 2) {
      hideDropdown(searchDropdown, config);
      return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchUsers(query, searchDropdown, config);
    }, 300);
  });

  document.addEventListener("click", function (e) {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      hideDropdown(searchDropdown, config);
    }
  });

  // 포커스 시 다시 보이기 (검색 결과가 있다면)
  searchInput.addEventListener("focus", function () {
    const resultContainer = config.customResultContainer
      ? document.getElementById(config.customResultContainer)
      : searchDropdown;

    if (resultContainer && resultContainer.children.length > 0) {
      showDropdown(searchDropdown, config);
    }
  });
}

// ===== 검색 결과 렌더링 =====

function hideDropdown(dropdown, config) {
  if (config.customResultContainer) {
    // 소셜 페이지의 경우
    dropdown.style.display = "none";
  } else {
    // 네비게이션 바의 경우
    dropdown.classList.add("d-none");
  }
}

function showDropdown(dropdown, config) {
  if (config.customResultContainer) {
    // 소셜 페이지의 경우
    dropdown.style.display = "block";
  } else {
    // 네비게이션 바의 경우
    dropdown.classList.remove("d-none");
  }
}

async function searchUsers(query, dropdownElement, config) {
  try {
    // AbortController로 요청 취소 가능하게 설정
    currentSearchController = new AbortController();

    const users = await CrossVibeAPI.searchUsers(query, {
      signal: currentSearchController.signal,
    });

    displaySearchResults(users, dropdownElement, config);
  } catch (error) {
    // AbortError는 사용자가 검색어를 변경하여 요청이 취소된 경우이므로 오류로 처리하지 않음
    if (error.name !== "AbortError") {
      console.error("검색 오류:", error);
      NotificationManager.error(CrossVibeUtils.handleError(error, "검색 과정"));
      const errorMessage =
        '<div class="search-user-item text-center text-muted">검색 중 오류가 발생했습니다.</div>';

      if (config.customResultContainer) {
        document.getElementById(config.customResultContainer).innerHTML =
          errorMessage;
        showDropdown(dropdownElement, config);
      } else {
        dropdownElement.innerHTML = errorMessage;
        showDropdown(dropdownElement, config);
      }
    }
  }
}

/**
 * 검색 결과를 드롭 다운에 표시
 * @param {Array<Object>} users 검색된 사용자 목록
 * @param {HTMLElement} dropdownElement 검색 결과를 표시할 드롭다운 요소
 * @param {Object} config 현재 검색 설정
 * @returns
 */
function displaySearchResults(users, dropdownElement, config) {
  const resultHTML =
    users.length === 0
      ? '<div class="search-user-item text-center text-muted">검색 결과가 없습니다.</div>'
      : users.map((user) => renderUserItem(user, config)).join("");

  if (config.customResultContainer) {
    // 소셜 페이지의 경우 - 커스텀 컨테이너에 결과 표시
    document.getElementById(config.customResultContainer).innerHTML =
      resultHTML;
    showDropdown(dropdownElement, config);

    // 소셜 페이지의 displaySocialSearchResults 함수가 있으면 호출
    if (
      typeof SocialPage !== "undefined" &&
      typeof SocialPage.displaySocialSearchResults === "function"
    ) {
      SocialPage.displaySocialSearchResults(users);
      return;
    }
  } else {
    // 네비게이션 바의 경우
    dropdownElement.innerHTML = resultHTML;
    showDropdown(dropdownElement, config);
  }
}

/**
 * 단일 사용자 아이템을 HTML 문자열로 렌더링
 * @param {Object} user 사용자 객체
 * @param {Object} config 현재 검색 설정
 * @returns {string} 사용자 아이템의 HTML 문자열
 */
function renderUserItem(user, config) {
  //소셜 페이지의 경우 FriendRenderer를 사용하여 렌더링
  if (config.customResultContainer && typeof FriendRenderer !== "undefined") {
    return FriendRenderer.createSearchUserItem(user);
  }

  // 네비게이션 바의 경우 또는 FriendRenderer가 없는 경우
  const relationshipStatus = CrossVibeUtils.getRelationshipStatus(user);
  const statusInfo = CrossVibeUtils.getrelationshipInfo(relationshipStatus);
  const avatar = CrossVibeUtils.generateAvatar(
    user.display_name || user.username
  );
  // 플랫폼 아이콘을 이모지 타입으로 포맷팅
  const platforms = CrossVibeUtils.formatPlatforms(user.platform_connections, {
    type: "svgImages",
    size: 24,
  });

  return `
        <div class="search-user-item" onclick="viewUserProfile('${
          user.username
        }')">
            <div class="d-flex align-items-center">
                <div class="user-avatar me-3">${avatar}</div>
                <div class="flex-grow-1">
                    <div class="fw-bold">${
                      user.display_name || user.username
                    }</div>
                    <div class="text-muted small">@${user.username}</div>
                    <div class="text-muted small">
                        ${platforms || "연결된 플랫폼 없음"}
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge relationship-badge ${
                      statusInfo.class
                    }">${statusInfo.text}</span>
                    ${
                      statusInfo.showButton &&
                      statusInfo.buttonType !== "respond"
                        ? `<br><button class="btn btn-sm btn-primary mt-1" onclick="event.stopPropagation(); sendFriendRequest('${user.id}', this)">➕ 신청</button>`
                        : ""
                    }
                </div>
            </div>
        </div>
    `;
}

/**
 * 사용자 id를 통해 친구 신청을 보냄.
 * @param {number} userId 친구 신청을 보낼 대상 사용자의 ID
 * @param {HTMLElement} buttonElement 친구 신청 버튼 요소 (로딩 상태 표시용)
 */
async function sendFriendRequestById(userId, buttonElement) {
  CrossVibeUtils.setLoading(buttonElement, true, "신청 중...");

  try {
    // FriendManager 모듈을 통해 친구 신청 로직 위임
    const success = await FriendManager.sendRequestByID(userId, buttonElement);

    if (success) {
      // 3초 후 검색 결과 새로고침
      setTimeout(() => {
        refreshCurrentSearch();
        CrossVibeUtils.setLoading(buttonElement, false, "➕ 신청");
        buttonElement.classList.remove("btn-success");
        buttonElement.classList.add("btn-primary");
      }, 3000);
    } else {
      CrossVibeUtils.setLoading(buttonElement, false, "➕ 신청");
    }
  } catch (error) {
    NotificationManager.error(CrossVibeUtils.handleError(error, "친구 신청"));
    CrossVibeUtils.setLoading(buttonElement, false, "➕ 신청");
  }
}

/**
 * 사용자명을 기반으로 친구 신청을 보냄.
 * @param {string} username 친구 신청을 보낼 대상 사용자의 사용자명
 */
async function sendFriendRequestToUser(username) {
  if (typeof FriendManager !== "undefined") {
    const success = await FriendManager.sendRequest(username);
    if (success) {
      refreshCurrentSearch();
      setTimeout(() => location.reload(), 1000);
    }
  } else {
    try {
      const result = await CrossVibeAPI.sendFriendRequest(username);

      if (result.success) {
        NotificationManager.success("친구 신청을 보냈습니다!");
        refreshCurrentSearch();
        setTimeout(() => location.reload(), 1000);
      } else {
        NotificationManager.error("오류: " + result.data.error);
      }
    } catch (error) {
      NotificationManager.error(CrossVibeUtils.handleError(error, "친구 신청"));
    }
  }
}

/**
 * 현재 활성화된 검색 입력 필드의 내용을 기반으로 검색 결과를 새로고침
 */
function refreshCurrentSearch() {
  // 현재 활성화된 검색 입력 필드 찾기
  const activeInputs = [
    "userSearchInput",
    "userSearchInputMobile",
    "friendUsername",
  ]
    .map((id) => document.getElementById(id))
    .filter(
      (input) =>
        input &&
        input.value.trim().length >= 2 &&
        (document.activeElement === input || input.matches(":focus"))
    );

  if (activeInputs.length > 0) {
    const activeInput = activeInputs[0];
    const currentPage = detectCurrentPage();
    const config =
      currentPage === "social" ? SearchConfig.social : SearchConfig.navbar;

    let dropdown;
    if (currentPage === "social") {
      dropdown = document.getElementById("searchResults");
    } else {
      dropdown =
        activeInput.id === "userSearchInput"
          ? document.getElementById("searchDropdown")
          : document.getElementById("searchDropdownMobile");
    }

    if (dropdown) {
      searchUsers(activeInput.value.trim(), dropdown, config);
    }
  }
}

/**
 * 사용자 프로필 페이지로 이동
 * @param {string} username 이동할 사용자의 사용자명
 */
function viewUserProfile(username) {
  // 모든 드롭다운 숨기기
  document.querySelectorAll(".search-dropdown").forEach((dropdown) => {
    dropdown.classList.add("d-none");
  });

  // 소셜 페이지의 검색 결과도 숨기기
  const socialResults = document.getElementById("searchResults");
  if (socialResults) {
    socialResults.style.display = "none";
  }

  // 사용자 프로필 페이지로 이동
  window.location.href = `/user/${username}`;
}

function setupGlobalEvents() {
  // ESC 키로 검색 결과 닫기
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      // 네비게이션 바 드롭다운 숨기기
      document.querySelectorAll(".search-dropdown").forEach((dropdown) => {
        dropdown.classList.add("d-none");
      });

      // 소셜 페이지 검색 결과 숨기기
      const socialResults = document.getElementById("searchResults");
      if (socialResults) {
        socialResults.style.display = "none";
      }
    }
  });
}

/**
 * 소셜 페이지에서 검색 입력 필드를 지우고 결과를 숨김. (전역 노출)
 */
window.clearSearch = function () {
  const input = document.getElementById("friendUsername");
  const dropdown = document.getElementById("searchResults");

  if (input) input.value = "";
  if (dropdown) dropdown.style.display = "none";
};

// 전역 함수로 노출 (템플릿에서 호출용)
window.sendFriendRequestToUser = sendFriendRequestToUser;
window.sendFriendRequestById = sendFriendRequestById;
window.viewUserProfile = viewUserProfile;
