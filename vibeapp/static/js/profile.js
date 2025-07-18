// ===== 사용자 프로필 페이지 전용 JavaScript =====

const UserProfile = {
  /**
   * 친구 신청 보내기
   * @param {string} username - 친구 신청을 보낼 대상 사용자의 사용자명
   * @returns
   */
  async sendFriendRequest(username) {
    const success = await FriendManager.sendRequest(username);
    if (success) {
      setTimeout(() => location.reload(), 1000);
    }
  },

  /**
   * 친구 신청 응답 (수락 또는 거절)
   * @param {number} requestId - 처리할 친구 신청의 ID
   * @param {string} action - 신청 상태 'accept' 또는 'reject'
   */
  async respondToRequest(requestId, action) {
    const success = await FriendManager.sendRequest(username);
    if (success) {
      setTimeout(() => location.reload(), 1000);
    }
  },

  /**
   * 친구 신청 취소
   * @param {number} requestId - 취소할 친구 신청 ID
   */
  async cancelFriendRequest(requestId) {
    const success = await FriendManager.respondToRequest(requestId, acttion);
    if (success) {
      setTimeout(() => location.reload(), 1000);
    }
  },

  /**
   * 메시지 보내기 기능 (향후 구현)
   */
  sendMessage() {
    this.showNotification("메시지 기능은 곧 구현될 예정입니다! 💬", "info");
  },

  /**
   * 프로필 공유 기능
   * @param {string} username - 공유할 프로필의 사용자명
   */
  shareProfile(username) {
    if (navigator.share) {
      navigator
        .share({
          title: `${username}님의 프로필`,
          text: `CrossVibe에서 ${username}님의 프로필을 확인해보세요!`,
          url: window.location.href,
        })
        .catch((error) => {
          // 사용자가 공유를 취소한 경우 등
          NotificationManager.info("프로필 공유가 취소되었습니다.");
          console.error("프로필 공유 오류:", error);
        });
    } else {
      // Web Share API를 지원하지 않는 경우, 클립보드에 URL 복사
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          NotificationManager.success(
            "프로필 링크가 클립보드에 복사되었습니다!"
          );
        })
        .catch((error) => {
          NotificationManager.error("클립보드 복사에 실패했습니다.");
          console.error("클립보드 복사 오류:", error);
        });
    }
  },
};

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("keydown", function (e) {
    // ESC 키로 뒤로가기
    if (e.key === "Escape") {
      history.back();
    }
  });
});

// UserProfile 객체를 전역으로 노출하여 HTML에서 직접 호출할 수 있도록 함.
window.UserProfile = UserProfile;
