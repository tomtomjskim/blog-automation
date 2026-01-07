/**
 * Blog Automation - Keyboard Shortcuts
 * 키보드 단축키 관리
 */

import { store } from '../state.js';
import { router } from '../core/router.js';
import { eventBus, EVENT_TYPES } from '../core/events.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';

class KeyboardManager {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
    this.helpModalOpen = false;

    this.registerDefaultShortcuts();
  }

  /**
   * 초기화
   */
  init() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    console.log('KeyboardManager initialized');
  }

  /**
   * 기본 단축키 등록
   */
  registerDefaultShortcuts() {
    // 전역 단축키
    this.register('ctrl+enter', '글 생성', () => {
      if (store.get('currentPage') === 'home') {
        document.getElementById('generate-btn')?.click();
      }
    }, { global: true });

    this.register('ctrl+s', '저장', () => {
      const page = store.get('currentPage');
      if (page === 'home') {
        document.getElementById('save-draft-btn')?.click();
      } else if (page === 'settings') {
        document.getElementById('save-general-settings')?.click();
      } else if (page === 'result') {
        document.getElementById('save-edit')?.click();
      }
    }, { global: true, preventDefault: true });

    this.register('ctrl+k', '빠른 이동', () => {
      this.showQuickNavigation();
    }, { global: true, preventDefault: true });

    this.register('ctrl+,', '설정', () => {
      router.navigate('settings');
    }, { global: true, preventDefault: true });

    this.register('ctrl+h', '히스토리', () => {
      router.navigate('history');
    }, { global: true, preventDefault: true });

    this.register('escape', '뒤로/닫기', () => {
      // 모달이 열려있으면 모달 닫기
      const activeModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (activeModal) {
        modal.close();
        return;
      }

      // 홈이 아니면 홈으로 이동
      if (store.get('currentPage') !== 'home') {
        router.navigate('home');
      }
    });

    this.register('?', '단축키 도움말', () => {
      this.showHelpModal();
    }, { shift: true });

    // 네비게이션 단축키
    this.register('g h', '홈으로 이동', () => {
      router.navigate('home');
    });

    this.register('g r', '결과로 이동', () => {
      router.navigate('result');
    });

    this.register('g i', '이미지 생성', () => {
      router.navigate('image');
    });

    this.register('g s', '설정으로 이동', () => {
      router.navigate('settings');
    });
  }

  /**
   * 단축키 등록
   */
  register(keys, description, callback, options = {}) {
    const normalizedKeys = this.normalizeKeys(keys);
    this.shortcuts.set(normalizedKeys, {
      keys,
      description,
      callback,
      ...options
    });
  }

  /**
   * 단축키 해제
   */
  unregister(keys) {
    const normalizedKeys = this.normalizeKeys(keys);
    this.shortcuts.delete(normalizedKeys);
  }

  /**
   * 키 정규화
   */
  normalizeKeys(keys) {
    return keys.toLowerCase()
      .replace(/mod/g, 'ctrl')
      .replace(/cmd/g, 'ctrl')
      .replace(/\s+/g, '+');
  }

  /**
   * 키다운 핸들러
   */
  handleKeyDown(e) {
    if (!this.enabled) return;

    // 입력 필드에서는 일부 단축키만 동작
    const isInputFocused = this.isInputFocused();

    // 시퀀스 키 처리 (g h, g r 등)
    if (this.pendingKey) {
      const sequence = `${this.pendingKey} ${e.key.toLowerCase()}`;
      const shortcut = this.shortcuts.get(sequence);

      if (shortcut && !isInputFocused) {
        e.preventDefault();
        shortcut.callback();
      }

      this.pendingKey = null;
      clearTimeout(this.pendingTimeout);
      return;
    }

    // g 키 시퀀스 시작
    if (e.key === 'g' && !isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.pendingKey = 'g';
      this.pendingTimeout = setTimeout(() => {
        this.pendingKey = null;
      }, 1000);
      return;
    }

    // 조합 키 생성
    const keys = this.buildKeyString(e);
    const shortcut = this.shortcuts.get(keys);

    if (shortcut) {
      // 입력 필드에서는 global 단축키만 허용
      if (isInputFocused && !shortcut.global) {
        return;
      }

      if (shortcut.preventDefault) {
        e.preventDefault();
      }

      shortcut.callback();
    }
  }

  /**
   * 키 문자열 생성
   */
  buildKeyString(e) {
    const parts = [];

    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');

    // 특수 키 처리
    const key = e.key.toLowerCase();
    if (key === ' ') parts.push('space');
    else if (key === 'escape') parts.push('escape');
    else if (key === 'enter') parts.push('enter');
    else if (key.length === 1) parts.push(key);

    return parts.join('+');
  }

  /**
   * 입력 필드 포커스 확인
   */
  isInputFocused() {
    const active = document.activeElement;
    if (!active) return false;

    const tagName = active.tagName.toLowerCase();
    return tagName === 'input' ||
           tagName === 'textarea' ||
           active.isContentEditable;
  }

  /**
   * 빠른 네비게이션 표시
   */
  showQuickNavigation() {
    const pages = [
      { key: 'h', label: '홈', icon: '🏠', route: 'home' },
      { key: 'r', label: '결과', icon: '📄', route: 'result' },
      { key: 'i', label: '이미지', icon: '🖼️', route: 'image' },
      { key: 'y', label: '히스토리', icon: '📚', route: 'history' },
      { key: 's', label: '설정', icon: '⚙️', route: 'settings' }
    ];

    const content = `
      <div class="quick-nav">
        <input type="text" class="input quick-nav-search" placeholder="페이지 검색..." autofocus>
        <div class="quick-nav-list">
          ${pages.map(p => `
            <button class="quick-nav-item" data-route="${p.route}">
              <span class="quick-nav-icon">${p.icon}</span>
              <span class="quick-nav-label">${p.label}</span>
              <span class="quick-nav-key">${p.key.toUpperCase()}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const modalEl = modal.open({
      title: '빠른 이동',
      content,
      size: 'sm'
    });

    // 검색 기능
    const searchInput = modalEl.querySelector('.quick-nav-search');
    const items = modalEl.querySelectorAll('.quick-nav-item');

    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      items.forEach(item => {
        const label = item.querySelector('.quick-nav-label').textContent.toLowerCase();
        item.style.display = label.includes(query) ? '' : 'none';
      });
    });

    // 키보드 네비게이션
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const visibleItem = modalEl.querySelector('.quick-nav-item:not([style*="display: none"])');
        if (visibleItem) {
          modal.close();
          router.navigate(visibleItem.dataset.route);
        }
      }

      // 단축키로 직접 이동
      const page = pages.find(p => p.key === e.key.toLowerCase());
      if (page && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        modal.close();
        router.navigate(page.route);
      }
    });

    // 클릭 이동
    items.forEach(item => {
      item.addEventListener('click', () => {
        modal.close();
        router.navigate(item.dataset.route);
      });
    });
  }

  /**
   * 도움말 모달 표시
   */
  showHelpModal() {
    if (this.helpModalOpen) return;

    const categories = {
      '전역': [
        ['Ctrl + Enter', '글 생성 시작'],
        ['Ctrl + S', '저장 (초안/설정)'],
        ['Ctrl + K', '빠른 이동'],
        ['Ctrl + ,', '설정 열기'],
        ['Ctrl + H', '히스토리'],
        ['Escape', '뒤로 가기 / 닫기'],
        ['Shift + ?', '단축키 도움말']
      ],
      '네비게이션': [
        ['G → H', '홈으로 이동'],
        ['G → R', '결과로 이동'],
        ['G → I', '이미지 생성'],
        ['G → S', '설정으로 이동']
      ]
    };

    const content = `
      <div class="shortcuts-help">
        ${Object.entries(categories).map(([category, shortcuts]) => `
          <div class="shortcuts-category">
            <h4 class="shortcuts-category-title">${category}</h4>
            <div class="shortcuts-list">
              ${shortcuts.map(([keys, desc]) => `
                <div class="shortcut-item">
                  <kbd class="shortcut-keys">${keys}</kbd>
                  <span class="shortcut-desc">${desc}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.helpModalOpen = true;

    modal.open({
      title: '키보드 단축키',
      content,
      size: 'md',
      onClose: () => {
        this.helpModalOpen = false;
      }
    });
  }

  /**
   * 활성화/비활성화
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// 싱글톤 인스턴스
const keyboardManager = new KeyboardManager();

export { keyboardManager, KeyboardManager };
