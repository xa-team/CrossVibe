// ===== 검색 기능 전담 모듈 =====
// 사용자 검색 및 검색 결과 UI를 관리

class SearchManager {
  /** @type {number||null} 검색 디바운싱용 타이머 ID */
  static searchTimeout = null;

  /** @type {AbortController||null} 현재 검색 요청 컨트롤러*/
  static currentSearchController = null;

  /**
   * 검색 설정 객체
   * @type {Object}
   */
  static SearchConfig = {
    /**
     * 내비게이션 바 검색 설정
     * @type {Object}
     */
    navbar: {
      inputs: ["userSearchInput", "userSearchInputMobile"],
      dropdowns: ["searchDropdown", "searchDropdownMobile"],
      onSelect: (username) => SearchManager.viewUserProfile(username), // 클래스 메서드 참조
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

  /**
   * DOM 로드 완료 시 검색 기능 초기화
   * @returns {void}
   * @description 현재 페이지에 맞는 검색 설정을 적용
   */

  static init() {
    this.initializeNavbarSearch();

    const currentPage = this.detectCurrentPage();
    if (currentPage === "social") {
      this.initializeSocialSearch();
    }

    // 전역 이벤트 리스너
    this.setupGlobalEvents();
  }

  /**
   *
   * @returns {string} 페이지 타입 ('social' | 'default')
   * @example
   * const pageType = detectCurrentPage();
   * console.log(pageType); // 'social' 또는 'default'
   */
  static detectCurrentPage() {
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

  static initializeNavbarSearch() {
    const config = SearchManager.SearchConfig.navbar;
    config.inputs.forEach((inputId, index) => {
      const input = document.getElementById(inputId);
      const dropdown = document.getElementById(config.dropdowns[index]);

      if (input && dropdown) {
        this.setupSearch(input, dropdown, config);
      }
    });
  }

  /**
   * 소셜 페이지 검색 초기화
   */

  static initializeSocialSearch() {
    const config = SearchManager.SearchConfig.social;
    const input = document.getElementById(config.inputs[0]);
    const dropdown = document.getElementById(config.dropdowns[0]);

    if (input && dropdown) {
      this.setupSearch(input, dropdown, config);
    }
  }

  /**
   * 검색 입력 필드와 드롭다운에 이벤트 리스너 설정
   * @param {HTMLElement} searchInput - 검색 입력 필드 요소
   * @param {HTMLElement} searchDropdown - 검색 결과 드롭다운 요소
   * @param {Object} config - 검색 설정 객체
   */

  static setupSearch(searchInput, searchDropdown, config) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();

      if (this.currentSearchController) {
        this.currentSearchController.abort();
      }

      if (query.length < 2) {
        this.hideDropdown(searchDropdown, config);
        return;
      }

      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchUsers(query, searchDropdown, config);
      }, 300);
    });

    document.addEventListener("click", (e) => {
      if (
        !searchInput.contains(e.target) &&
        !searchDropdown.contains(e.target)
      ) {
        this.hideDropdown(searchDropdown, config);
      }
    });

    // 포커스 시 다시 보이기 (검색 결과가 있다면)
    searchInput.addEventListener("focus", () => {
      const resultContainer = config.customResultContainer
        ? document.getElementById(config.customResultContainer)
        : searchDropdown;

      if (resultContainer && resultContainer.children.length > 0) {
        this.showDropdown(searchDropdown, config);
      }
    });
  }

  // ===== 검색 결과 렌더링 =====

  /**
   * 검색 결과를 표시할 드롭다운을 숨김
   * @param {HTMLElement} dropdown - 드롭다운 요소
   * @param {Object} config - 현재 검색 설정
   */
  static hideDropdown(dropdown, config) {
    if (config.customResultContainer) {
      // 소셜 페이지의 경우
      dropdown.style.display = "none";
    } else {
      // 네비게이션 바의 경우
      dropdown.classList.add("d-none");
    }
  }

  /**
   * 검색 결과를 표시할 드롭다운을 보여줌
   * @param {HTMLElement} dropdown - 드롭다운 요소
   * @param {Object} config - 현재 검색 설정
   */
  static showDropdown(dropdown, config) {
    if (config.customResultContainer) {
      // 소셜 페이지의 경우
      dropdown.style.display = "block";
    } else {
      // 네비게이션 바의 경우
      dropdown.classList.remove("d-none");
    }
  }

  /**
   * 사용자 검색을 실행하고 결과를 드롭다운에 표시
   * @param {string} query - 검색어
   * @param {HTMLElement} dropdownElement - 검색 결과를 표시할 드롭다운 요소
   * @param {Object} config - 현재 검색 설정
   */
  static async searchUsers(query, dropdownElement, config) {
    try {
      // AbortController로 요청 취소 가능하게 설정
      this.currentSearchController = new AbortController();

      const users = await CrossVibeAPI.searchUsers(query, {
        signal: this.currentSearchController.signal,
      });

      this.displaySearchResults(users, dropdownElement, config);
    } catch (error) {
      // AbortError는 사용자가 검색어를 변경하여 요청이 취소된 경우이므로 오류로 처리하지 않음
      if (error.name !== "AbortError") {
        console.error("검색 오류:", error);
        NotificationManager.error(
          CrossVibeUtils.handleError(error, "사용자 검색")
        );
        const errorMessage =
          '<div class="search-user-item text-center text-muted">검색 중 오류가 발생했습니다.</div>';

        if (config.customResultContainer) {
          document.getElementById(config.customResultContainer).innerHTML =
            errorMessage;
          this.showDropdown(dropdownElement, config);
        } else {
          dropdownElement.innerHTML = errorMessage;
          this.showDropdown(dropdownElement, config);
        }
      }
    }
  }

  /**
   * 검색 결과를 드롭 다운에 표시
   * @param {Array<Object>} users - 검색된 사용자 목록
   * @param {HTMLElement} dropdownElement - 검색 결과를 표시할 드롭다운 요소
   * @param {Object} config - 현재 검색 설정
   * @returns
   */
  static displaySearchResults(users, dropdownElement, config) {
    const resultHTML =
      users.length === 0
        ? '<div class="search-user-item text-center text-muted">검색 결과가 없습니다.</div>'
        : users.map((user) => this.renderUserItem(user, config)).join("");

    if (config.customResultContainer) {
      // 소셜 페이지의 경우 - 커스텀 컨테이너에 결과 표시
      document.getElementById(config.customResultContainer).innerHTML =
        resultHTML;
      this.showDropdown(dropdownElement, config);

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
      this.showDropdown(dropdownElement, config);
    }
  }

  /**
   * 단일 사용자 아이템을 HTML 문자열로 렌더링
   * @param {Object} user - 사용자 객체
   * @param {Object} config - 현재 검색 설정
   * @returns {string} - 사용자 아이템의 HTML 문자열
   */
  static renderUserItem(user, config) {
    //소셜 페이지의 경우 FriendRenderer를 사용하여 렌더링
    if (config.customResultContainer && typeof FriendRenderer !== "undefined") {
      return FriendRenderer.createSearchUserItem(user);
    }

    // 네비게이션 바의 경우 또는 FriendRenderer가 없는 경우
    const relationshipStatus = CrossVibeUtils.getRelationshipStatus(user);
    const statusInfo = CrossVibeUtils.getRelationshipInfo(relationshipStatus);
    const avatar = CrossVibeUtils.generateAvatar(
      user.display_name || user.username
    );
    // 플랫폼 아이콘을 이모지 타입으로 포맷팅
    const platforms = CrossVibeUtils.formatPlatforms(
      user.platform_connections,
      {
        type: "svgImages",
        size: 24,
      }
    );

    return `
        <div class="search-user-item" onclick="SearchManager.viewUserProfile('${
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
                <div class="text-end ms-auto">
                    <span class="badge relationship-badge ${
                      statusInfo.class
                    }">${statusInfo.text}</span>
                    ${
                      statusInfo.showButton &&
                      statusInfo.buttonType !== "respond"
                        ? `<br><button class="btn btn-sm btn-primary mt-1" onclick="event.stopPropagation(); sendFriendRequestById('${user.id}', this)">➕ 신청</button>`
                        : ""
                    }
                </div>
            </div>
        </div>
    `;
  }

  /**
   * 사용자 id를 통해 친구 신청을 보냄.
   * @param {number} userId - 친구 신청을 보낼 대상 사용자의 ID
   * @param {HTMLElement} buttonElement - 친구 신청 버튼 요소 (로딩 상태 표시용)
   */
  static async sendFriendRequestById(userId, buttonElement) {
    CrossVibeUtils.setLoading(buttonElement, true, "신청 중...");

    try {
      // FriendManager 모듈을 통해 친구 신청 로직 위임
      const success = await FriendManager.sendRequestById(
        userId,
        buttonElement
      );

      if (success) {
        // 3초 후 검색 결과 새로고침
        setTimeout(() => {
          this.refreshCurrentSearch();
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
  static async sendFriendRequestToUser(username) {
    if (typeof FriendManager !== "undefined") {
      const success = await FriendManager.sendRequest(username);
      if (success) {
        this.refreshCurrentSearch();
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
        NotificationManager.error(
          CrossVibeUtils.handleError(error, "친구 신청")
        );
      }
    }
  }

  /**
   * 현재 활성화된 검색 입력 필드의 내용을 기반으로 검색 결과를 새로고침
   */
  static refreshCurrentSearch() {
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
      const currentPage = this.detectCurrentPage();
      const config =
        currentPage === "social"
          ? SearchManager.SearchConfig.social
          : SearchManager.SearchConfig.navbar;

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
        this.searchUsers(activeInput.value.trim(), dropdown, config);
      }
    }
  }

  /**
   * 사용자 프로필 페이지로 이동
   * @param {string} username - 이동할 사용자의 사용자명
   */
  static viewUserProfile(username) {
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

  /**
   * 전역 이벤트 리스너 설정 (ESC 키로 검색 결과 닫기)
   */
  static setupGlobalEvents() {
    document.addEventListener("keydown", (e) => {
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
  static claerSearch() {
    const input = document.getElementById("friendUsername");
    const dropdown = document.getElementById("searchResults");

    if (input) input.value = "";
    if (dropdown) dropdown.style.display = "none";
  }
}

// DOM 로드 완료시 검색 기능 초기화
document.addEventListener("DOMContentLoaded", function () {
  SearchManager.init();
});

// 전역 함수로 노출 (템플릿에서 호출용)
window.sendFriendRequestToUser = SearchManager.sendFriendRequestToUser;
window.sendFriendRequestById = SearchManager.sendFriendRequestById;
window.viewUserProfile = SearchManager.viewUserProfile;
window.claerSearch = SearchManager.claerSearch;
