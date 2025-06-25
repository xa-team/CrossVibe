// 전역 변수
let searchTimeout;
let currentSearchController;

// 검색 설정 객체
const SearchConfig = {
  // 네비게이션 바 검색 (기본)
  navbar: {
    inputs: ["userSearchInput", "userSearchInputMobile"],
    dropdowns: ["searchDropdown", "searchDropdownMobile"],
    onSelect: viewUserProfile,
    showActions: true,
  },
  // 소셜 페이지 검색
  social: {
    inputs: ["friendUsername"],
    dropdowns: ["searchResults"],
    onSelect: null, // 커스텀 핸들러 사용
    showActions: true,
    customResultContainer: "searchResultsList",
  },
};

// 로그인한 사용자만 검색 기능 초기화
document.addEventListener("DOMContentLoaded", function () {
  initializeSearch();
});

// 페이지별 검색 설정 감지
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

// URL 또는 페이지 요소로 현재 페이지 감지
function detectCurrentPage() {
  if (window.location.pathname.includes("/social")) {
    return "social";
  }
  return "default";
}

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

function initializeSocialSearch() {
  const config = SearchConfig.social;
  const input = document.getElementById(config.inputs[0]);
  const dropdown = document.getElementById(config.dropdowns[0]);

  if (input && dropdown) {
    setupSearch(input, dropdown, config);
  }
}

function setupSearch(searchInput, searchDropdown, config) {
  searchInput.addEventListener("input", function (e) {
    const query = e.target.value.trim();

    // 이전 요청 취소
    if (currentSearchController) {
      currentSearchController.abort();
    }

    // 검색어가 2글자 미만이면 드롭다운 숨기기
    if (query.length < 2) {
      hideDropdown(searchDropdown, config);
      return;
    }

    // 디바운싱
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchUsers(query, searchDropdown, config);
    }, 300);
  });

  // 외부 클릭 시 드롭다운 숨기기
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

    const response = await fetch(
      `/api/search-users?q=${encodeURIComponent(query)}`,
      {
        signal: currentSearchController.signal,
      }
    );

    if (!response.ok) {
      throw new Error("검색 요청 실패");
    }

    const data = await response.json();
    displaySearchResults(data.users, dropdownElement, config);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("검색 오류:", error);
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

function displaySearchResults(users, dropdownElement, config) {
  const resultHTML =
    users.length === 0
      ? '<div class="search-user-item text-center text-muted">검색 결과가 없습니다.</div>'
      : users.map((user) => createUserItem(user, config)).join("");

  if (config.customResultContainer) {
    // 소셜 페이지의 경우 - 커스텀 컨테이너에 결과 표시
    document.getElementById(config.customResultContainer).innerHTML =
      resultHTML;
    showDropdown(dropdownElement, config);

    // 소셜 페이지의 displaySocialSearchResults 함수가 있으면 호출
    if (typeof displaySocialSearchResults === "function") {
      displaySocialSearchResults(users);
      return;
    }
  } else {
    // 네비게이션 바의 경우
    dropdownElement.innerHTML = resultHTML;
    showDropdown(dropdownElement, config);
  }
}

function getRelationshipStatus(user) {
  if (user.is_friend) {
    return "friend";
  } else if (user.has_pending_request_from_me) {
    return "sent_request";
  } else if (user.has_pending_request_to_me) {
    return "received_request";
  } else {
    return "none";
  }
}

function createUserItem(user, config) {
  const relationshipStatus = getRelationshipStatus(user);
  const statusInfo = getStatusInfo(relationshipStatus);
  const avatar = user.display_name
    ? user.display_name.charAt(0).toUpperCase()
    : user.username.charAt(0).toUpperCase();

  // 소셜 페이지의 경우 다른 레이아웃 사용
  if (config.customResultContainer) {
    return createSocialUserItem(user, statusInfo, avatar);
  }

  // 네비게이션 바의 경우 기존 레이아웃
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
                        ${user.platform_connections
                          .map((platform) =>
                            platform === "spotify"
                              ? "🎵 Spotify"
                              : platform === "youtube"
                              ? "▶️ YouTube"
                              : platform
                          )
                          .join(", ")}
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge relationship-badge ${
                      statusInfo.class
                    }">${statusInfo.text}</span>
                    ${
                      statusInfo.showButton
                        ? `<br><button class="btn btn-sm btn-primary mt-1" onclick="event.stopPropagation(); sendFriendRequest('${user.id}', this)">➕ 신청</button>`
                        : ""
                    }
                </div>
            </div>
        </div>
    `;
}

function createSocialUserItem(user, statusInfo, avatar) {
  // 소셜 페이지에서는 FriendRenderer 사용
  if (typeof FriendRenderer !== "undefined") {
    return FriendRenderer.createSearchUserItem(user);
  }

  // 폴백: 기본 소셜 아이템 렌더링
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
                    <br><small class="text-muted">${
                      user.platform_connections
                        .map((p) =>
                          p === "spotify"
                            ? "🎵 Spotify"
                            : p === "youtube"
                            ? "▶️ YouTube"
                            : p
                        )
                        .join(", ") || "연결된 플랫폼 없음"
                    }</small>
                </div>
            </div>
            <div>
                ${getActionButton(user, statusInfo)}
            </div>
        </div>
    `;
}

function getActionButton(user, statusInfo) {
  if (statusInfo.showButton) {
    return `<button class="btn btn-success btn-sm" onclick="sendFriendRequestToUser('${user.username}')">➕ 신청</button>`;
  } else {
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
  }
}

function getStatusInfo(status) {
  switch (status) {
    case "friend":
      return { class: "bg-success", text: "👫 친구", showButton: false };
    case "sent_request":
      return { class: "bg-warning", text: "⏳ 신청함", showButton: false };
    case "received_request":
      return { class: "bg-info", text: "📨 신청받음", showButton: false };
    default:
      return {
        class: "bg-light text-dark",
        text: "👋 연결 가능",
        showButton: true,
      };
  }
}

async function sendFriendRequest(userId, buttonElement) {
  const originalText = buttonElement.textContent;
  buttonElement.disabled = true;
  buttonElement.textContent = "⏳ 처리중...";

  try {
    const response = await fetch("/send-friend-request-by-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    const result = await response.json();

    if (response.ok) {
      buttonElement.textContent = "✅ 완료";
      buttonElement.classList.remove("btn-primary");
      buttonElement.classList.add("btn-success");

      // 3초 후 검색 결과 새로고침
      setTimeout(() => {
        refreshCurrentSearch();
      }, 3000);
    } else {
      alert("오류: " + result.error);
      buttonElement.disabled = false;
      buttonElement.textContent = originalText;
    }
  } catch (error) {
    alert("네트워크 오류가 발생했습니다.");
    buttonElement.disabled = false;
    buttonElement.textContent = originalText;
  }
}

// 소셜 페이지용 친구 신청 함수 (friends.js와 연동)
async function sendFriendRequestToUser(username) {
  if (typeof FriendManager !== "undefined") {
    // friends.js가 로드된 경우 FriendManager 사용
    const success = await FriendManager.sendRequest(username);
    if (success) {
      refreshCurrentSearch();
      setTimeout(() => location.reload(), 1000);
    }
  } else {
    // 폴백: 직접 API 호출
    try {
      const response = await fetch("/send-friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("친구 신청을 보냈습니다!");
        refreshCurrentSearch();
        setTimeout(() => location.reload(), 1000);
      } else {
        alert("오류: " + result.error);
      }
    } catch (error) {
      alert("네트워크 오류가 발생했습니다.");
    }
  }
}

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

// 소셜 페이지에서 사용할 수 있는 검색 초기화 함수 (전역 노출)
window.clearSearch = function () {
  const input = document.getElementById("friendUsername");
  const dropdown = document.getElementById("searchResults");

  if (input) input.value = "";
  if (dropdown) dropdown.style.display = "none";
};

// 전역 함수로 노출 (템플릿에서 호출용)
window.sendFriendRequestToUser = sendFriendRequestToUser;
window.viewUserProfile = viewUserProfile;
