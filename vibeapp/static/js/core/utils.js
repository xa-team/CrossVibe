// ===== CrossVibe 공통 유틸리티 모듈 =====
// 모든 페이지에서 사용하는 공통 함수들을 중앙화

class CrossVibeUtils {
  // ===== 날짜/시간 처리 =====
  /**
   * 날짜를 상대적 시간으로 포맷팅
   * @param {string|Date} dateString - 날짜 문자열 또는 Date 객체
   * @returns {string} 포맷된 날짜 문자열
   */

  static formatDate(dateString) {
    if (!dateString) return "알 수 없음";

    const date = new Date(dateString);
    const now = new Date();
    const diffsMs = now - date;
    const diffMins = Math.floor(diffsMs / 60000);
    const diffHours = Math.floor(diffsMs / 3600000);
    const diffDays = Math.floor(diffsMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours) return `${diffHours}시간 전`;
    if (diffDays) return `${diffDays}일 전`;

    return date.toLocaleDateString("ko-KR");
  }

  /**
   * 절대 날짜 포맷팅
   * @param {string|Date} dateString - 날짜 문자열 또는 Date 객체
   * @returns {string} YYYY-MM-DD HH:MM 형식의 날짜
   */
  static formatAbsoluteDate(dateString) {
    if (!dateString) return "알 수 없음";

    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ===== UI 헬퍼 함수들 =====

  /**
   * 사용자 아바타 생성
   * @param {string} name - 사용자명 또는 표시명
   * @returns {string} 아바타 문자 (첫 글자 대문자)
   */
  static generateAvatar(name) {
    if (!name || typeof name !== "string") return "?";

    return name.trim().charAt(0).toUpperCase();
  }

  /**
   * 플랫폼별 아이콘 반환 (이미지 또는 이모지)
   * @param {string} platform - 플랫폼 이름
   * @param {Object} options - 옵션 {type: 'emoji'|'image'|'svgImages', size: number}
   * @returns {string} 이모지 아이콘
   */
  static getPlatformIcon(platform, options) {
    const defaultOptions = {
      type: "svgImages", // 'emoji' 또는 'image'
      size: 24,
    };
    const opts = { ...defaultOptions, ...options };

    //이모지 버전
    const emojiIcons = {
      spotify: "🎵",
      youtube: "▶️",
      applemusic: "🍎",
      apple: "🍎",
      default: "🎶",
    };

    //외부 이미지 URL
    const imageIcons = {
      spotify: "https://cdn-icons-png.flaticon.com/24/174/174872.png",
      youtube: "https://cdn-icons-png.flaticon.com/24/1384/1384060.png",
      applemusic: "https://icons8.com/icon/81TSi6Gqk0tm/music",
      default: "https://cdn-icons-png.flaticon.com/24/651/651758.png", // 음악 아이콘
    };

    //SVG 이미지
    const svgIcons = {
      spotify: `
      <svg width="${opts.size}" height="${opts.size}" viewBox="0 0 24 24" fill="#1DB954">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>`,
      youtube: `
      <svg width="${opts.size}" height="${opts.size}" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>`,
      applemusic: `
      <svg width="${opts.size}" height="${opts.size}" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FA243C"/>
      <path d="M16.5 7V13.5C16.5 14.8807 15.3807 16 14 16C12.6193 16 11.5 14.8807 11.5 13.5C11.5 12.1193 12.6193 11 14 11C14.175 11 14.345 11.021 14.508 11.06V8.5H11V13.5C11 14.8807 9.88071 16 8.5 16C7.11929 16 6 14.8807 6 13.5C6 12.1193 7.11929 11 8.5 11C8.675 11 8.845 11.021 9.008 11.06V7H16.5Z" fill="white"/>
      </svg>`,
    };

    if (!platform) platform = "default";
    const platformkey = platform.toLowerCase();

    if (opts.type === "emoji") {
      return emojiIcons[platformkey] || emojiIcons.default;
    } else if (opts.type === "images") {
      const imageUrl = imageIcons[platformkey] || imageIcons.default;
      const platformName = this.getPlatformName(platform);

      return `<img src="${imageUrl}" alt="${platformName} title="${platformName}" width="${opts.size}" height="${opts.size}" style = "vertical-align: middle;"`;
    } else {
      return svgIcons[platformkey] || "🎶";
    }
  }

  /**
   * 플랫폼별 표시명 반환
   * @param {string} platform - 플랫폼 이름
   * @returns {string} 플랫폼 표시명
   */
  static getPlatformName(platform) {
    const names = {
      spotify: "Spotify",
      youtube: "Youtube Music",
      applemusic: "Apple Music",
      apple: "Apple Music",
    };

    if (!platform) return platform;

    return (
      names[platform.toLowerCase()] ||
      platform.charAt(0).toUpperCase() + platform.slice(1)
    );
  }

  /**
   * 플랫폼 목록을 포맷된 문자열로 변환
   * @param {Array} platforms - 플랫폼 목록
   * @param {Object} options - 아이콘 옵션
   * @returns {string} 포맷된 플랫폼 문자열
   */
  static formatPlatforms(platforms, options = {}) {
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return "연결된 플랫폼 없음.";
    }

    return platforms
      .map((platform) => {
        const icon = this.getPlatformIcon(platform, options);
        const name = this.getPlatformName(platform);
        return `${icon} ${name}`;
      })
      .join(", ");
  }

  // ===== 관계 상태 처리 =====

  /**
   * 사용자 간 관계 상태 판단
   * @param {Object} user - 사용자 객체
   * @returns {string} 관계 상태 ('friend', 'sent_request', 'received_request', 'none')
   */
  static getRelationshipStatus(user) {
    if (!user) return "none";

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

  /**
   * 관계 상태에 따른 UI 정보 반환
   * @param {string} status - 관계 상태
   * @returns {Object} UI 정보 객체 (class, text, showButton)
   */
  static getRelationshipInfo(status) {
    const statusMap = {
      friend: {
        class: "bg-success text-white",
        text: "🧑‍🤝‍🧑 친구",
        showButton: false,
      },
      sent_request: {
        class: "bg-warning text-dark",
        text: "⌛ 신청함",
        showButton: false,
      },
      received_request: {
        class: "bg-info text-white",
        text: "📨 신청받음",
        showButton: true,
        buttonType: "respond",
      },
      none: {
        class: "bg-light text-dark",
        text: "👋 연결 가능",
        showButton: true,
        buttonType: "send",
      },
    };

    return statusMap[status] || statusMap.none;
  }

  // ===== 성능 최적화 함수들 =====

  /**
   * 디바운스 함수
   * @param {Function} func - 실행할 함수
   * @param {number} wait - 대기 시간 (ms)
   * @returns {Function} 디바운스된 함수
   */
  static debounce(func, wait) {
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

  /**
   * 스로틀 함수
   * @param {Function} func - 실행할 함수
   * @param {number} limit - 제한 시간 (ms)
   * @returns {Function} 스로틀된 함수
   */
  static throttle(func, limit) {
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

  // ===== 문자열 처리 =====

  /**
   * 텍스트 길이 제한 및 말줄임표 추가
   * @param {string} text - 원본 텍스트
   * @param {number} maxLength - 최대 길이
   * @returns {string} 처리된 텍스트
   */
  static truncateText(text, maxLength = 50) {
    if (!text || typeof text !== "string") return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  /**
   * HTML 태그 제거
   * @param {string} html - HTML 문자열
   * @returns {string} 태그가 제거된 순수 텍스트
   */
  static stripHtml(html) {
    if (!html || typeof html !== "string") return "";
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  // ===== 유효성 검사 =====

  /**
   * 사용자명 유효성 검사
   * @param {string} username - 검사할 사용자명
   * @returns {Object} 검사 결과 {valid: boolean, message: string}
   */
  static validateUsername(username) {
    if (!username || typeof username !== "string") {
      return { valid: false, message: "사용자명을 입력해주세요." };
    }

    const trimmed = username.trim();

    if (trimmed.length < 3) {
      return {
        valid: false,
        message: "사용자명은 최소 3자 이상이어야 합니다.",
      };
    }

    if (trimmed.length > 20) {
      return { valid: false, message: "사용자명은 최대 20까지 가능합니다." };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return {
        valid: false,
        msg: "사용자명은 영문, 숫자, 언더스코어(_)만 가능합니다.",
      };
    }

    return { valid: true, msg: "사용 가능한 사용자명입니다." };
  }

  /**
   * 이메일 유효성 검사
   * @param {string} email - 검사할 이메일
   * @returns {boolean} 유효성 검사 결과
   */
  static validate(email) {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // ===== DOM 조작 헬퍼 =====

  /**
   * 요소에 로딩 상태 적용/해제
   * @param {HTMLElement} element - 대상 요소
   * @param {boolean} isLoading - 로딩 상태
   * @param {string} originalText - 원본 텍스트 (선택사항)
   */
  static setLoading(element, isLoading, originalText = "") {
    if (!element) return;

    if (isLoading) {
      element.disabled = true;
      if (!element.dataset.originalText) {
        element.dataset.originalText = element.textContent;
      }
      element.textContent = "⌛ 처리중...";
      element.classList.add("loading");
    } else {
      element.disabled = false;
      element.textContent =
        originalText || element.dataset.originalText || "완료";
      element.classList.remove("loading");
    }

    // 원본 텍스트 복원 후 데이터 속성 정리
    if (element.dataset.originalText && !originalText) {
      element.textContent = element.dataset.originalText;
      delete element.dataset.originalText;
    }
  }

  /**
   * 스크롤을 특정 요소로 부드럽게 이동
   * @param {HTMLElement|string} target - 대상 요소 또는 선택자
   * @param {Object} options - 스크롤 옵션
   */
  static scrollToElement(target, options = {}) {
    const element =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!element) return;

    const defaultOptions = {
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
  }

  // ===== 에러 처리 =====

  /**
   * 에러를 로그에 기록하고 사용자 친화적 메시지 반환
   * @param {Error} error - 에러 객체
   * @param {string} context - 에러 발생 컨텍스트
   * @returns {string} 사용자 친화적 에러 메시지
   */
  static handleError(error, context) {
    //개발 환경에서만 상세 로그 출력
    // if (
    //   process?.env?.NODE_ENV === "development" ||
    //   window.location.hostname === "localhost"
    // ) {
    //   console.error(`${context} 오류:`, error);
    // }

    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("127.0.0.1");
    if (isDevelopment) {
      console.error(`${context} 오류:`, error);
    }

    // 표준 Error 객체인 경우 (e.g., new Error("..."))
    if (error instanceof Error && error.message) {
      if (error.message.includes("Failed to fetch")) {
        return "네트워크 연결을 확인해주세요. 서버에 연결할 수 없습니다.";
      }
      return error.message;
    }
    // API 응답에서 넘어온 커스텀 오류 객체인 경우 (e.g., { error: "..." } 또는 { message: "..." })
    if (typeof error === "object" && error !== null) {
      if (error.error) {
        // 'error' 필드가 있는 경우
        return error.error;
      }
      if (error.message) {
        // 'message' 필드가 있는 경우
        return error.message;
      }
    }

    // 그 외 예상치 못한 오류
    return "예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  // ===== 기타 유틸리티 =====

  /**
   * 랜덤 ID 생성
   * @param {number} length - ID 길이
   * @returns {string} 랜덤 ID
   */
  static generateId(length = 8) {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; ++i) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 객체 깊은 복사
   * @param {Object} obj - 복사할 객체
   * @returns {Object} 복사된 객체
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => this.deepClone(item));
    if (typeof obj === "object") {
      const cloneObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloneObj[key] = this.deepClone(obj[key]);
        }
      }
      return cloneObj;
    }
  }

  /**
   * URL 파라미터를 객체로 변환
   * @param {string} url - URL 문자열 (선택사항, 기본값: 현재 URL)
   * @returns {Object} 파라미터 객체
   */
  static getUrlParams(url = window.location.search) {
    const params = {};
    const urlParams = new URLSearchParams(url);
    for (const [key, value] of urlParams) {
      params[key] = value;
    }
    return params;
  }
}

// ===== 전역 노출 =====
window.CrossVibeUtils = CrossVibeUtils;
