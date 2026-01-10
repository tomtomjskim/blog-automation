/**
 * Blog Automation - Notification Service
 * 브라우저 알림 및 인앱 토스트 서비스
 */

import { toast } from '../ui/toast.js';

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.enabled = false;
    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    if (!this.isSupported()) {
      console.warn('[Notification] 브라우저가 알림을 지원하지 않습니다');
      return;
    }

    this.permission = Notification.permission;
    this.enabled = this.permission === 'granted';
  }

  /**
   * 알림 권한 요청
   */
  async requestPermission() {
    if (!this.isSupported()) {
      return false;
    }

    if (this.permission === 'granted') {
      this.enabled = true;
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      this.enabled = result === 'granted';
      return this.enabled;
    } catch (error) {
      console.error('[Notification] 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * 알림 표시
   * @param {object} options - 알림 옵션
   */
  show(options) {
    const {
      type = 'info',
      title,
      message,
      action = null,
      duration = 5000,
      silent = false
    } = options;

    // 1. 브라우저 알림 (권한 있고 탭이 백그라운드일 때)
    if (this.enabled && document.visibilityState === 'hidden' && !silent) {
      this.showBrowserNotification({ type, title, message, action, duration });
    }

    // 2. 인앱 토스트 (항상)
    this.showToast(type, title, message);
  }

  /**
   * 브라우저 알림 표시
   */
  showBrowserNotification({ type, title, message, action, duration }) {
    try {
      const notification = new Notification(title, {
        body: message,
        icon: this.getIcon(type),
        badge: '/icons/badge-72.png',
        tag: `blog-auto-${Date.now()}`,
        requireInteraction: type === 'error',
        silent: false
      });

      if (action?.url) {
        notification.onclick = () => {
          window.focus();
          if (action.url.startsWith('http')) {
            window.open(action.url, '_blank');
          } else {
            window.location.hash = action.url;
          }
          notification.close();
        };
      } else {
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      if (duration > 0 && type !== 'error') {
        setTimeout(() => notification.close(), duration);
      }
    } catch (error) {
      console.error('[Notification] 브라우저 알림 실패:', error);
    }
  }

  /**
   * 인앱 토스트 표시
   */
  showToast(type, title, message) {
    const fullMessage = title ? `${title}: ${message}` : message;

    switch (type) {
      case 'success':
        toast.success(fullMessage);
        break;
      case 'error':
        toast.error(fullMessage);
        break;
      case 'warning':
        toast.warning(fullMessage);
        break;
      default:
        toast.info(fullMessage);
    }
  }

  /**
   * 성공 알림
   */
  success(title, message, action = null) {
    this.show({ type: 'success', title, message, action });
  }

  /**
   * 에러 알림
   */
  error(title, message, action = null) {
    this.show({ type: 'error', title, message, action, duration: 0 });
  }

  /**
   * 경고 알림
   */
  warning(title, message, action = null) {
    this.show({ type: 'warning', title, message, action });
  }

  /**
   * 정보 알림
   */
  info(title, message, action = null) {
    this.show({ type: 'info', title, message, action });
  }

  /**
   * 아이콘 URL 반환
   */
  getIcon(type) {
    // 기본 아이콘 (실제 배포 시 교체)
    const icons = {
      success: '/icons/notification-success.png',
      error: '/icons/notification-error.png',
      warning: '/icons/notification-warning.png',
      info: '/icons/notification-info.png'
    };
    return icons[type] || icons.info;
  }

  /**
   * 지원 여부 확인
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * 권한 상태 반환
   */
  getPermissionStatus() {
    return {
      supported: this.isSupported(),
      permission: this.permission,
      enabled: this.enabled
    };
  }
}

// 싱글톤 인스턴스
const notificationService = new NotificationService();

export { notificationService, NotificationService };
