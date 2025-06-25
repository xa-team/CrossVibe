// ===== 사용자 프로필 페이지 전용 JavaScript =====

const UserProfile = {
  // 친구 신청 보내기
  async sendFriendRequest(username) {
    if (!confirm("정말로 친구 신청을 보내시겠습니까?")) return;

    try {
      const response = await fetch("/send-friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username }),
      });

      const result = await response.json();

      if (response.ok) {
        this.showNotification(result.message, "success");
        setTimeout(() => location.reload(), 1000);
      } else {
        this.showNotification("오류: " + result.error, "error");
      }
    } catch (error) {
      this.showNotification("네트워크 오류가 발생했습니다.", "error");
      console.error("친구 신청 오류:", error);
    }
  },

  // 친구 신청 응답
  async respondToRequest(requestId, action) {
    const actionText = action === "accept" ? "수락" : "거절";
    if (!confirm(`정말로 이 친구 신청을 ${actionText}하시겠습니까?`)) return;

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
        this.showNotification(result.message, "success");
        setTimeout(() => location.reload(), 1000);
      } else {
        this.showNotification("오류: " + result.error, "error");
      }
    } catch (error) {
      this.showNotification("네트워크 오류가 발생했습니다.", "error");
      console.error("친구 신청 응답 오류:", error);
    }
  },

  // 친구 신청 취소
  async cancelFriendRequest(requestId) {
    if (!confirm("정말로 친구 신청을 취소하시겠습니까?")) return;

    try {
      const response = await fetch(`/cancel-friend-request/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        this.showNotification(result.message, "success");
        setTimeout(() => location.reload(), 1000);
      } else {
        this.showNotification("오류: " + result.error, "error");
      }
    } catch (error) {
      this.showNotification("네트워크 오류가 발생했습니다.", "error");
      console.error("친구 신청 취소 오류:", error);
    }
  },

  // 메시지 보내기 (향후 구현)
  sendMessage() {
    this.showNotification("메시지 기능은 곧 구현될 예정입니다! 💬", "info");
  },

  // 알림 표시
  showNotification(message, type = "info") {
    const icon = {
      success: "✅",
      error: "❌",
      info: "ℹ️",
    };
    alert(`${icon[type]} ${message}`);
  },

  // 프로필 공유 (향후 기능)
  shareProfile(username) {
    if (navigator.share) {
      navigator.share({
        title: `${username}님의 프로필`,
        text: `CrossVibe에서 ${username}님의 프로필을 확인해보세요!`,
        url: window.location.href,
      });
    } else {
      // 폴백: 클립보드에 복사
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showNotification(
          "프로필 링크가 클립보드에 복사되었습니다!",
          "success"
        );
      });
    }
  },
};

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  // 키보드 단축키
  document.addEventListener("keydown", function (e) {
    // ESC 키로 뒤로가기
    if (e.key === "Escape") {
      history.back();
    }
  });
});

// 전역 노출
window.UserProfile = UserProfile;
