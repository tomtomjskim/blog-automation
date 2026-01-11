/**
 * Blog Automation - Notification Center
 * 헤더 알림 시스템
 */

import { store } from '../state.js';
import { router } from '../core/router.js';

class NotificationCenter {
  constructor() {
    this.notifications = [];
    this.isOpen = false;
    this.container = null;
  }

  /**
   * 초기화
   */
  init() {
    this.checkSystemAlerts();
    this.render();
    this.bindEvents();
  }

  /**
   * 시스템 알림 체크
   */
  checkSystemAlerts() {
    this.notifications = [];
    const { apiKeys } = store.getState();

    // API 키 체크
    const hasAnyKey = Object.entries(apiKeys)
      .filter(([name]) => name !== 'stability')
      .some(([, key]) => key);

    if (!hasAnyKey) {
      this.notifications.push({
        id: 'no-api-key',
        type: 'warning',
        title: 'API 키 미설정',
        message: 'LLM 사용을 위해 API 키를 등록하세요',
        action: { label: '설정으로 이동', route: 'settings' },
        persistent: true
      });
    }

    // 팁 알림
    this.notifications.push({
      id: 'tip-keyboard',
      type: 'info',
      title: '빠른 이동',
      message: 'Ctrl+K로 빠른 이동 메뉴를 열 수 있어요',
      persistent: false
    });
  }

  /**
   * 알림 추가
   */
  add(notification) {
    const id = notification.id || `notif_${Date.now()}`;

    // 중복 체크
    if (this.notifications.some(n => n.id === id)) return;

    this.notifications.unshift({
      id,
      timestamp: new Date().toISOString(),
      ...notification
    });

    this.updateBadge();
  }

  /**
   * 알림 제거
   */
  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.updateBadge();
    this.renderDropdown();
  }

  /**
   * 경고 알림 수
   */
  getWarningCount() {
    return this.notifications.filter(n => n.type === 'warning' || n.type === 'error').length;
  }

  /**
   * 렌더링
   */
  render() {
    // 헤더에 알림 버튼 삽입
    const headerActions = document.querySelector('.app-header-actions');
    if (!headerActions) return;

    // 기존 알림 버튼 제거
    const existing = headerActions.querySelector('.notification-wrapper');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'notification-wrapper';
    wrapper.innerHTML = this.renderButton();

    // 설정 버튼 앞에 삽입
    const settingsBtn = headerActions.querySelector('a[href="#settings"]');
    if (settingsBtn) {
      headerActions.insertBefore(wrapper, settingsBtn);
    } else {
      headerActions.appendChild(wrapper);
    }

    this.container = wrapper;
  }

  /**
   * 버튼 렌더링
   */
  renderButton() {
    const warningCount = this.getWarningCount();

    return `
      <button class="notification-btn" id="notification-btn" title="알림">
        <span class="notification-icon">🔔</span>
        ${warningCount > 0 ? `<span class="notification-badge">${warningCount}</span>` : ''}
      </button>
      <div class="notification-dropdown" id="notification-dropdown">
        ${this.renderDropdownContent()}
      </div>
    `;
  }

  /**
   * 드롭다운 내용 렌더링
   */
  renderDropdownContent() {
    if (this.notifications.length === 0) {
      return `
        <div class="notification-empty">
          <span class="notification-empty-icon">✅</span>
          <span>알림이 없습니다</span>
        </div>
      `;
    }

    return `
      <div class="notification-header">
        <span>알림</span>
        <span class="notification-count">${this.notifications.length}</span>
      </div>
      <div class="notification-list">
        ${this.notifications.map(n => this.renderNotificationItem(n)).join('')}
      </div>
    `;
  }

  /**
   * 알림 항목 렌더링
   */
  renderNotificationItem(notification) {
    const icons = {
      warning: '⚠️',
      error: '❌',
      info: '💡',
      success: '✅'
    };

    return `
      <div class="notification-item notification-${notification.type}" data-id="${notification.id}">
        <span class="notification-item-icon">${icons[notification.type] || '📢'}</span>
        <div class="notification-item-content">
          <div class="notification-item-title">${notification.title}</div>
          <div class="notification-item-message">${notification.message}</div>
          ${notification.action ? `
            <button class="notification-item-action" data-route="${notification.action.route}">
              ${notification.action.label}
            </button>
          ` : ''}
        </div>
        ${!notification.persistent ? `
          <button class="notification-item-close" data-id="${notification.id}">×</button>
        ` : ''}
      </div>
    `;
  }

  /**
   * 드롭다운 업데이트
   */
  renderDropdown() {
    const dropdown = this.container?.querySelector('#notification-dropdown');
    if (dropdown) {
      dropdown.innerHTML = this.renderDropdownContent();
      this.bindDropdownEvents();
    }
  }

  /**
   * 배지 업데이트
   */
  updateBadge() {
    const btn = this.container?.querySelector('#notification-btn');
    if (!btn) return;

    const warningCount = this.getWarningCount();
    let badge = btn.querySelector('.notification-badge');

    if (warningCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notification-badge';
        btn.appendChild(badge);
      }
      badge.textContent = warningCount;
    } else if (badge) {
      badge.remove();
    }
  }

  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    // 버튼 클릭
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#notification-btn');
      const dropdown = this.container?.querySelector('#notification-dropdown');

      if (btn) {
        e.stopPropagation();
        this.isOpen = !this.isOpen;
        dropdown?.classList.toggle('open', this.isOpen);
        return;
      }

      // 외부 클릭 시 닫기
      if (!e.target.closest('.notification-dropdown')) {
        this.isOpen = false;
        dropdown?.classList.remove('open');
      }
    });

    this.bindDropdownEvents();
  }

  /**
   * 드롭다운 이벤트 바인딩
   */
  bindDropdownEvents() {
    const dropdown = this.container?.querySelector('#notification-dropdown');
    if (!dropdown) return;

    // 액션 버튼
    dropdown.querySelectorAll('.notification-item-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const route = btn.dataset.route;
        if (route) {
          this.isOpen = false;
          dropdown.classList.remove('open');
          router.navigate(route);
        }
      });
    });

    // 닫기 버튼
    dropdown.querySelectorAll('.notification-item-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.remove(btn.dataset.id);
      });
    });
  }

  /**
   * 알림 갱신 (상태 변경 시 호출)
   */
  refresh() {
    this.checkSystemAlerts();
    this.render();
    this.bindEvents();
  }
}

// 싱글톤 인스턴스
const notificationCenter = new NotificationCenter();

export { notificationCenter, NotificationCenter };
