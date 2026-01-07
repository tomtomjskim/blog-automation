/**
 * Blog Automation - Toast UI Component
 * 알림 토스트
 */

import { eventBus, EVENT_TYPES } from '../core/events.js';

class Toast {
  constructor() {
    this.container = null;
    this.queue = [];
    this.current = null;
    this.timeout = null;
    this.defaultDuration = 3000;

    this.init();
  }

  init() {
    // 컨테이너 생성
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.innerHTML = '';
    document.body.appendChild(this.container);

    // 스타일 추가
    this.addStyles();

    // 이벤트 구독
    eventBus.on(EVENT_TYPES.TOAST_SHOW, (data) => this.show(data));
  }

  addStyles() {
    if (document.getElementById('toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-container {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: var(--z-toast, 400);
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      }

      .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        background-color: var(--gray-800, #191F28);
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: 14px;
        font-weight: 500;
        pointer-events: auto;
        animation: toastSlideUp 0.3s ease;
        max-width: 400px;
      }

      .toast.hiding {
        animation: toastSlideDown 0.2s ease forwards;
      }

      .toast-icon {
        font-size: 18px;
        flex-shrink: 0;
      }

      .toast-message {
        flex: 1;
        line-height: 1.4;
      }

      .toast-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .toast-close:hover {
        color: white;
        background-color: rgba(255, 255, 255, 0.1);
      }

      .toast.success {
        background-color: var(--success, #00C471);
      }

      .toast.error {
        background-color: var(--error, #FF4545);
      }

      .toast.warning {
        background-color: var(--warning, #FF9500);
      }

      .toast.info {
        background-color: var(--info, #3182F6);
      }

      @keyframes toastSlideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes toastSlideDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(20px);
          opacity: 0;
        }
      }

      @media (max-width: 480px) {
        .toast-container {
          left: 16px;
          right: 16px;
          transform: none;
        }

        .toast {
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 토스트 표시
   */
  show(options) {
    const {
      message,
      type = 'default',
      duration = this.defaultDuration,
      closable = true,
      icon = null
    } = typeof options === 'string' ? { message: options } : options;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      default: ''
    };

    const displayIcon = icon || iconMap[type] || '';

    toast.innerHTML = `
      ${displayIcon ? `<span class="toast-icon">${displayIcon}</span>` : ''}
      <span class="toast-message">${message}</span>
      ${closable ? `<button class="toast-close" aria-label="닫기">✕</button>` : ''}
    `;

    // 닫기 버튼 이벤트
    if (closable) {
      toast.querySelector('.toast-close').addEventListener('click', () => {
        this.hide(toast);
      });
    }

    this.container.appendChild(toast);

    // 자동 숨김
    if (duration > 0) {
      setTimeout(() => {
        this.hide(toast);
      }, duration);
    }

    return toast;
  }

  /**
   * 토스트 숨김
   */
  hide(toast) {
    if (!toast || !toast.parentNode) return;

    toast.classList.add('hiding');
    setTimeout(() => {
      toast.remove();
    }, 200);
  }

  /**
   * 모든 토스트 숨김
   */
  hideAll() {
    this.container.querySelectorAll('.toast').forEach(toast => {
      this.hide(toast);
    });
  }

  // 편의 메서드
  success(message, options = {}) {
    return this.show({ ...options, message, type: 'success' });
  }

  error(message, options = {}) {
    return this.show({ ...options, message, type: 'error', duration: 5000 });
  }

  warning(message, options = {}) {
    return this.show({ ...options, message, type: 'warning' });
  }

  info(message, options = {}) {
    return this.show({ ...options, message, type: 'info' });
  }
}

// 싱글톤 인스턴스
const toast = new Toast();

export { toast, Toast };
