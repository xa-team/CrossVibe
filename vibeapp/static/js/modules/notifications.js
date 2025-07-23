// ===== CrossVibe 통합 알림 시스템 =====
// 모든 알림을 일관성 있게 처리하는 중앙화된 시스템

class NotificationManager {
  // ===== 설정 =====
  static config = {
    defaultType: "toast", // 'toast' 또는 'alert'
    toastDuration: 4000, // 토스트 표시 시간 (ms)
    position: "top-right", // 토스트 위치
    maxToasts: 5, // 최대 토스트 개수
    enableSound: false, // 소리 활성화 (향후 구현)
  };

  // 토스트 컨테이너 참조
  static toastContainer = null;
  static toastCount = 0;

  // ===== 초기화 =====
  static init() {
    this.createToastContainer();
    this.setupStyles();
  }

  /**
   * 토스트 컨테이너 생성
   */
  static createToastContainer() {
    if (this.toastContainer) return;

    this.toastContainer = document.createElement("div");
    this.toastContainer.id = "crossvibe-toast-container";
    this.toastContainer.className = `toast-container potision-fixed ${this.getPositionClass()}`;
    this.toastContainer.style.zIndex = "9999";

    document.body.appendChild(this.toastContainer);
  }

  /**
   * 위치에 따른 CSS 클래스 반환
   */
  static getPositionClass() {
    const positions = {
      "top-right": "top-0 end-0 p-3",
      "top-left": "top-0 start-0 p-3",
      "bottom-right": "bottom-0 end-0 p-3",
      "bottom-left": "bottom-0 start-0 p-3",
      "top-center": "top-0 start-50 translate-middle-x p-3",
      "bottom-center": "bottom-0 start-50 translate-middle-x p-3",
    };
    return positions[this.config.position] || positions["top-right"];
  }

  /**
   * 기본 스타일 설정
   */
  static setupStyles() {
    // Bootstrap이 없는 경우를 대비한 기본 스타일
    if (!document.querySelector("#crossvibe-notification-styles")) {
      const style = document.createElement("style");
      style.id = "crossvibe-notification-style";
      style.textContent = `
            .crossvibe-toast {
                min-width: 300px;
                margin-bottom: 0.75rem;
                padding: 0.75rem 1rem;
                border-radius: 0.375rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                color: white;
                font-family: -apple-system, BlinkMaxSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: slideInRight 0.3s ease-out;
            }
                
            .crossvibe-toast.removing {
          animation: slideOutRight 0.3s ease-in forwards;
        }
        
        .crossvibe-toast-success { background-color: #198754; }
        .crossvibe-toast-error { background-color: #dc3545; }
        .crossvibe-toast-warning { background-color: #fd7e14; }
        .crossvibe-toast-info { background-color: #0dcaf0; color: #000; }
        
        .crossvibe-toast-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        
        .crossvibe-toast-body {
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .crossvibe-toast-close {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          margin-left: 1rem;
          opacity: 0.8;
        }
        
        .crossvibe-toast-close:hover {
          opacity: 1;
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        
        .position-fixed { position: fixed !important; }
        .top-0 { top: 0 !important; }
        .end-0 { right: 0 !important; }
        .start-0 { left: 0 !important; }
        .bottom-0 { bottom: 0 !important; }
        .p-3 { padding: 1rem !important; }
        .start-50 { left: 50% !important; }
        .translate-middle-x { transform: translateX(-50%) !important; }
      `;
      document.head.appendChild(style);
    }
  }

  // ===== 메인 알림 함수 =====

  /**
   * 알림 표시 (메인 함수)
   * @param {string} message - 표시할 메시지
   * @param {string} type - 알림 타입 ('success', 'error', 'warning', 'info')
   * @param {Object} options - 추가 옵션
   */
  static show(message, type = "info", options = {}) {
    const finalOptions = {
      duration: this.config.toastDuration,
      method: this.config.defaultType,
      title: "",
      closable: true,
      ...options,
    };

    // 방법에 따라 분기
    if (finalOptions.method === "alert") {
      this.showAlert(message, type);
    } else {
      this.showToast(message, type, finalOptions);
    }
  }

  /**
   * Alert 방식 알림
   * @param {string} message - 메시지
   * @param {string} type - 타입
   */
  static showAlert(message, type) {
    const icon = this.getIcon(type);
    alert(`${icon} ${message}`);
  }

  /**
   * Toast 방식 알림
   * @param {string} message - 메시지
   * @param {string} type - 타입
   * @param {Object} options - 옵션
   */
  static showToast(message, type, options) {
    // 컨테이너 초기화
    if (!this.toastContainer) {
      this.init();
    }

    // 최대 토스트 개수 체크
    if (this.toastCount >= this.config.maxToasts) {
      this.removeOldestToast();
    }

    // 토스트 요소 생성
    const toast = this.createToastElement(message, type, options);

    // 컨테이너에 추가
    this.toastContainer.appendChild(toast);
    this.toastCount++;

    // 자동 제거 설정
    if (options.duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, options.duration);
    }

    return toast;
  }

  /**
   * 토스트 요소 생성
   * @param {string} message - 메시지
   * @param {string} type - 타입
   * @param {Object} options - 옵션
   * @returns {HTMLElement} 토스트 요소
   */
  static createToastElement(message, type, options) {
    const toast = document.createElement("div");
    toast.className = `crossvibe-toast crossvibe-toast-${type}`;

    const icon = this.getIcon(type);
    const title = options.title || this.getDefaultTitle(type);

    toast.innerHTML = `
        <div class="crossvibe-toast-header">
        <span>${icon} ${title}</span>
        ${
          options.closable
            ? '<button class="crossvibe-toast-close" onclick="NotificationManager.removeToast(this.closest(\'.crossvibe-toast\'))">&times;</button>'
            : ""
        }
      </div>
      <div class="crossvibe-toast-body">${message}</div>
    `;

    // 클릭 시 제거 (closable이 true인 경우)
    if (options.closable) {
      toast.addEventListener("click", () => {
        this.removeToast(toast);
      });
    }

    return toast;
  }

  /**
   * 토스트 제거
   * @param {HTMLElement} toast - 제거할 토스트 요소
   */
  static removeToast(toast) {
    if (!toast || !toast.parentNode) return;

    toast.classList.add("removing");

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
        this.toastCount--;
      }
    }, 300);
  }

  /**
   * 가장 오래된 토스트 제거
   */
  static removeOldestToast() {
    const toasts = this.toastContainer.querySelectorAll(".crossvibe-toast");
    if (toasts.length > 0) {
      this.removeToast(toasts[0]);
    }
  }

  /**
   * 모든 토스트 제거
   */
  static clearAll() {
    if (!this.toastContainer) return;

    const toasts = this.toastContainer.querySelectorAll(".crossvibe-toast");
    toasts.foreach((toast) => this.removeToast(toast));
  }

  // ===== 타입별 편의 함수들 =====

  /**
   * 성공 알림
   * @param {string} message - 메시지
   * @param {Object} options - 옵션
   */
  static success(message, options = {}) {
    this.show(message, "success", options);
  }

  /**
   * 에러 알림
   * @param {string} message - 메시지
   * @param {Object} options - 옵션
   */
  static error(message, options = {}) {
    this.show(message, "error", { duration: 6000, ...options });
  }

  /**
   * 경고 알림
   * @param {string} message - 메시지
   * @param {Object} options - 옵션
   */
  static warning(message, options = {}) {
    this.show(message, "warning", options);
  }

  /**
   * 정보 알림
   * @param {string} message - 메시지
   * @param {Object} options - 옵션
   */
  static info(message, options = {}) {
    this.show(message, "info"), options;
  }

  // ===== 확인 대화상자 =====

  /**
   * 확인 대화상자
   * @param {string} message - 확인 메시지
   * @param {Function} onConfirm - 확인 시 실행할 함수
   * @param {Function} onCancel - 취소 시 실행할 함수 (선택사항)
   * @returns {Promise<boolean>} 사용자 선택 결과
   */
  static confirm(message, onConfirm = null, onCancel = null) {
    return new Promise((resolve) => {
      const result = confirm(message);

      if (result && onConfirm) {
        onConfirm();
      } else if (!result && onCancel) {
        onCancel();
      }

      resolve(result);
    });
  }

  /**
   * 비동기 확인 대화상자 (Promise 기반)
   * @param {string} message - 확인 메시지
   * @returns {Promise<boolean>} 사용자 선택 결과
   */
  static async askConfirm(message) {
    return new Promise((resolve) => {
      const result = confirm(message);
      resolve(result);
    });
  }

  // ===== 헬퍼 함수들 =====

  /**
   * 타입별 아이콘 반환
   * @param {string} type - 알림 타입
   * @returns {string} 아이콘 이모지
   */
  static getIcon(type) {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[type] || icons.info;
  }

  /**
   * 타입별 기본 제목 반환
   * @param {string} type - 알림 타입
   * @returns {string} 기본 제목
   */
  static getDefaultTitle(Type) {
    const titles = {
      success: "성공",
      error: "오류",
      warning: "경고",
      info: "알림",
    };
    return titles[Type] || titles.info;
  }

  // ===== 설정 관리 =====

  /**
   * 설정 업데이트
   * @param {Object} newConfig - 새 설정
   */
  static updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // 컨테이너 위치 업데이트
    if (newConfig.position && this.toastContainer) {
      this.toastContainer.className = `toast-container position-fixed ${this.getPositionClass()}`;
    }
  }

  /**
   * Alert 모드로 전환
   */
  static useAlertMode() {
    this.config.defaultType = "alert";
  }

  /**
   * Toast 모드로 전환
   */
  static useToastMode() {
    this.config.defaultType = "toast";
  }
}

// ===== 초기화 =====
// DOM이 로드되면 자동으로 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    NotificationManager.init();
  });
} else {
  NotificationManager.init();
}

// ===== 전역 노출 =====
window.NotificationManager = NotificationManager;

// 하위 호환성을 위한 기존 함수 별칭 (추후 제거 예정)
window.showNotification = (message, type = "info") => {
  NotificationManager.show(message, type);
};

window.showToast = (message, type = "info", duration = 3000) => {
  NotificationManager.show(message, type, { duration });
};

window.showConfirm = (message, callback) => {
  NotificationManager.confirm(message, callback);
};

// Utils 객체에도 추가 (기존 코드와의 호환성)
if (window.Utils) {
  window.Utils.showNotification = window.showNotification;
  window.Utils.showToast = window.showToast;
  window.Utils.showConfirm = window.showConfirm;
}
