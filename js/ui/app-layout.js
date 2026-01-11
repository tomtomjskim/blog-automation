/**
 * Blog Automation - App Layout
 * 공통 앱 레이아웃 (헤더, 사이드바, 바텀 네비게이션)
 */

import { store } from '../state.js';
import { router } from '../core/router.js';
import { notificationCenter } from './notification-center.js';

let sidebarOpen = false;

/**
 * 하단 네비게이션 메뉴 아이템
 */
const NAV_ITEMS = [
  { id: 'home', label: '홈', icon: '🏠', route: 'home' },
  { id: 'write', label: '새 글', icon: '✏️', route: 'write' },
  { id: 'schedule', label: '예약', icon: '📅', route: 'schedule' },
  { id: 'history', label: '기록', icon: '📚', route: 'history' },
  { id: 'menu', label: '메뉴', icon: '☰', action: 'toggleSidebar' }
];

/**
 * 사이드바 메뉴 아이템 (전체)
 */
const SIDEBAR_ITEMS = [
  { section: '생성', items: [
    { id: 'write', label: '새 글 작성', icon: '✏️', route: 'write' },
    { id: 'batch', label: '대량 생성', icon: '📦', route: 'batch' },
    { id: 'image', label: '이미지 생성', icon: '🖼️', route: 'image' },
  ]},
  { section: '관리', items: [
    { id: 'schedule', label: '예약 포스팅', icon: '📅', route: 'schedule' },
    { id: 'history', label: '히스토리', icon: '📚', route: 'history' },
    { id: 'result', label: '결과 보기', icon: '📄', route: 'result' },
  ]},
  { section: '설정', items: [
    { id: 'settings', label: '설정', icon: '⚙️', route: 'settings' },
  ]}
];

/**
 * 앱 레이아웃 초기화
 */
export function initAppLayout() {
  // 앱 컨테이너 래핑
  const appEl = document.getElementById('app');
  const wrapper = document.createElement('div');
  wrapper.className = 'app-layout';
  wrapper.innerHTML = `
    <aside class="app-sidebar" id="app-sidebar">
      ${renderSidebar()}
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <main class="app-main">
      <header class="app-header" id="app-header">
        ${renderHeader()}
      </header>
      <div class="app-content" id="app-content"></div>
    </main>
    <nav class="app-bottom-nav" id="app-bottom-nav">
      ${renderBottomNav()}
    </nav>
  `;

  // 기존 app 요소를 content로 이동
  appEl.parentNode.insertBefore(wrapper, appEl);
  document.getElementById('app-content').appendChild(appEl);

  // 이벤트 바인딩
  bindLayoutEvents();

  // 스타일 추가
  addLayoutStyles();

  // 알림 센터 초기화
  setTimeout(() => notificationCenter.init(), 0);
}

/**
 * 헤더 렌더링
 */
function renderHeader() {
  const currentPage = store.get('currentPage') || 'home';

  return `
    <button class="app-header-menu-btn" id="menu-toggle" aria-label="메뉴">
      <span class="hamburger-icon">☰</span>
    </button>

    <a href="#home" class="app-header-logo">
      <span class="logo-icon">✍️</span>
      <span class="logo-text">Blog Auto</span>
    </a>

    <nav class="app-header-nav">
      ${NAV_ITEMS.slice(0, 4).map(item => `
        <a href="#${item.route}"
           class="nav-link ${currentPage === item.route ? 'active' : ''}"
           data-route="${item.route}">
          ${item.label}
        </a>
      `).join('')}
    </nav>

    <div class="app-header-actions">
      <button class="btn btn-ghost btn-sm" id="quick-action-btn" title="빠른 이동 (Ctrl+K)">
        ⌘K
      </button>
      <a href="#settings" class="btn btn-ghost btn-icon" title="설정">
        ⚙️
      </a>
    </div>
  `;
}

/**
 * 사이드바 렌더링
 */
function renderSidebar() {
  const currentPage = store.get('currentPage') || 'home';

  return `
    <div class="sidebar-header">
      <span class="sidebar-logo">✍️</span>
      <span class="sidebar-title">Blog Auto</span>
      <button class="sidebar-close" id="sidebar-close">✕</button>
    </div>

    <nav class="sidebar-nav">
      ${SIDEBAR_ITEMS.map(section => `
        <div class="sidebar-section">
          <div class="sidebar-section-title">${section.section}</div>
          ${section.items.map(item => `
            <a href="#${item.route}"
               class="sidebar-item ${currentPage === item.route ? 'active' : ''}"
               data-route="${item.route}">
              <span class="sidebar-item-icon">${item.icon}</span>
              <span class="sidebar-item-label">${item.label}</span>
            </a>
          `).join('')}
        </div>
      `).join('')}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-shortcut">
        <kbd>Ctrl</kbd> + <kbd>K</kbd> 빠른 이동
      </div>
    </div>
  `;
}

/**
 * 바텀 네비게이션 렌더링
 */
function renderBottomNav() {
  const currentPage = store.get('currentPage') || 'home';

  return NAV_ITEMS.map((item, index) => {
    const isPrimary = index === 1; // 새 글을 primary로
    const isAction = !!item.action;

    if (isAction) {
      return `
        <button type="button"
           class="bottom-nav-item"
           data-action="${item.action}">
          <span class="bottom-nav-icon">${item.icon}</span>
          <span class="bottom-nav-label">${item.label}</span>
        </button>
      `;
    }

    return `
      <a href="#${item.route}"
         class="bottom-nav-item ${currentPage === item.route ? 'active' : ''} ${isPrimary ? 'primary' : ''}"
         data-route="${item.route}">
        <span class="bottom-nav-icon">${item.icon}</span>
        <span class="bottom-nav-label">${item.label}</span>
      </a>
    `;
  }).join('');
}

/**
 * 이벤트 바인딩
 */
function bindLayoutEvents() {
  // 메뉴 토글
  document.getElementById('menu-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

  // 사이드바 메뉴 클릭 시 닫기 (모바일)
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        closeSidebar();
      }
    });
  });

  // 빠른 이동 버튼
  document.getElementById('quick-action-btn')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('show-quick-actions'));
  });

  // 하단 네비 메뉴 버튼 (사이드바 토글)
  document.querySelector('.bottom-nav-item[data-action="toggleSidebar"]')?.addEventListener('click', toggleSidebar);

  // 라우트 변경 시 헤더/네비 업데이트
  window.addEventListener('hashchange', updateActiveNav);
}

/**
 * 사이드바 토글
 */
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  updateSidebarState();
}

/**
 * 사이드바 닫기
 */
function closeSidebar() {
  sidebarOpen = false;
  updateSidebarState();
}

/**
 * 사이드바 상태 업데이트
 */
function updateSidebarState() {
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (sidebarOpen) {
    sidebar?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/**
 * 현재 활성 네비게이션 업데이트
 */
function updateActiveNav() {
  const currentPage = window.location.hash.slice(1) || 'home';

  // 헤더 네비게이션
  document.querySelectorAll('.app-header-nav .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.route === currentPage);
  });

  // 사이드바
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === currentPage);
  });

  // 바텀 네비게이션
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === currentPage);
  });
}

/**
 * 레이아웃 스타일 추가
 */
function addLayoutStyles() {
  if (document.getElementById('app-layout-styles')) return;

  const style = document.createElement('style');
  style.id = 'app-layout-styles';
  style.textContent = `
    /* App Layout */
    .app-layout {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
    }

    /* Sidebar */
    .app-sidebar {
      width: 260px;
      background: var(--bg-primary);
      border-right: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      height: 100dvh;
      z-index: 200;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .app-sidebar.open {
      transform: translateX(0);
    }

    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 199;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .sidebar-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border-light);
    }

    .sidebar-logo {
      font-size: 24px;
    }

    .sidebar-title {
      font-weight: var(--font-bold);
      font-size: var(--text-lg);
      flex: 1;
    }

    .sidebar-close {
      background: none;
      border: none;
      font-size: 20px;
      color: var(--text-tertiary);
      cursor: pointer;
      padding: var(--space-1);
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-4) 0;
    }

    .sidebar-section {
      margin-bottom: var(--space-4);
    }

    .sidebar-section-title {
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: var(--space-2) var(--space-5);
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-5);
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .sidebar-item:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .sidebar-item.active {
      background: var(--primary-light);
      color: var(--primary);
      font-weight: var(--font-medium);
    }

    .sidebar-item-icon {
      font-size: 18px;
    }

    .sidebar-footer {
      padding: var(--space-4) var(--space-5);
      border-top: 1px solid var(--border-light);
    }

    .sidebar-shortcut {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .sidebar-shortcut kbd {
      background: var(--bg-tertiary);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: inherit;
      font-size: 11px;
    }

    /* Main Area */
    .app-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* Header */
    .app-header {
      height: 56px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      padding: 0 var(--space-4);
      position: sticky;
      top: 0;
      z-index: 100;
      gap: var(--space-3);
    }

    .app-header-menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: none;
      border: none;
      font-size: 20px;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: var(--radius-md);
      transition: background 0.15s ease;
    }

    .app-header-menu-btn:hover {
      background: var(--bg-tertiary);
    }

    .app-header-logo {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      color: var(--text-primary);
    }

    .logo-icon {
      font-size: 24px;
    }

    .logo-text {
      font-weight: var(--font-bold);
      font-size: var(--text-lg);
    }

    .app-header-nav {
      display: none;
      align-items: center;
      gap: var(--space-1);
      margin-left: var(--space-6);
    }

    .app-header-nav .nav-link {
      padding: var(--space-2) var(--space-3);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      border-radius: var(--radius-md);
      transition: all 0.15s ease;
    }

    .app-header-nav .nav-link:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .app-header-nav .nav-link.active {
      background: var(--primary-light);
      color: var(--primary);
    }

    .app-header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-left: auto;
    }

    #quick-action-btn {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      border: 1px solid var(--border-light);
    }

    /* Content */
    .app-content {
      flex: 1;
      padding-bottom: 80px; /* 바텀 네비 공간 */
    }

    .app-content #app {
      min-height: 100%;
    }

    /* Bottom Navigation */
    .app-bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: var(--bg-primary);
      border-top: 1px solid var(--border-light);
      padding-bottom: env(safe-area-inset-bottom);
      z-index: 100;
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: var(--space-2);
      color: var(--text-tertiary);
      text-decoration: none;
      font-size: var(--text-xs);
      transition: color 0.15s ease;
      min-width: 60px;
    }

    .bottom-nav-item:hover,
    .bottom-nav-item.active {
      color: var(--primary);
    }

    .bottom-nav-icon {
      font-size: 22px;
    }

    .bottom-nav-label {
      font-weight: var(--font-medium);
    }

    /* Desktop Styles */
    @media (min-width: 768px) {
      .app-header-nav {
        display: flex;
      }

      #quick-action-btn {
        display: inline-flex;
      }
    }

    @media (min-width: 1024px) {
      .app-sidebar {
        transform: translateX(0);
        position: fixed;
      }

      .sidebar-overlay {
        display: none;
      }

      .sidebar-close {
        display: none;
      }

      .app-main {
        margin-left: 260px;
      }

      .app-header-menu-btn {
        display: none;
      }

      .app-bottom-nav {
        display: none;
      }

      .app-content {
        padding-bottom: var(--space-6);
      }
    }

    /* Page Headers - 기존 페이지 헤더 조정 */
    .page-header {
      margin-bottom: var(--space-6);
    }

    .page-header .btn-ghost:first-child {
      display: none; /* 뒤로 버튼 숨김 - 사이드바로 대체 */
    }

    @media (max-width: 1023px) {
      .page-header .btn-ghost:first-child {
        display: inline-flex;
      }
    }
  `;
  document.head.appendChild(style);
}

export { toggleSidebar, closeSidebar, updateActiveNav };
