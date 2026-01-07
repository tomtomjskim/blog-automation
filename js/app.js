/**
 * Blog Automation - Main Application
 * 앱 진입점 및 초기화
 */

import { store, initializeApp, setApiKeys } from './state.js';
import { router } from './core/router.js';
import { eventBus, EVENT_TYPES } from './core/events.js';
import { secureStorage } from './core/crypto.js';
import { toast } from './ui/toast.js';
import { modal } from './ui/modal.js';

// Pages
import { renderHomePage } from './pages/home.js';
import { renderResultPage } from './pages/result.js';
import { renderSettingsPage } from './pages/settings.js';
import { renderImagePage } from './pages/image.js';
import { renderHistoryPage } from './pages/history.js';

/**
 * 앱 초기화
 */
async function bootstrap() {
  console.log('🚀 Blog Automation Starting...');

  // 라우터 설정
  setupRouter();

  // 앱 상태 초기화
  await initializeApp();

  // 전역 이벤트 리스너
  setupGlobalListeners();

  // 키보드 단축키
  setupKeyboardShortcuts();

  // 시스템 테마 변경 감지
  setupThemeWatcher();

  // 초기 라우팅
  router.init();

  console.log('✅ Blog Automation Ready');
}

/**
 * 라우터 설정
 */
function setupRouter() {
  // 페이지 라우트 등록
  router.addRoute('home', renderHomePage);
  router.addRoute('result', renderResultPage);
  router.addRoute('settings', renderSettingsPage);
  router.addRoute('image', renderImagePage);
  router.addRoute('history', renderHistoryPage);

  // 404 처리
  router.setNotFound(() => {
    router.navigate('home');
  });

  // 라우트 가드
  router.beforeEach((to, from) => {
    // result 페이지는 결과가 있어야 접근 가능
    if (to === 'result' && !store.get('result')) {
      toast.warning('먼저 글을 생성해주세요');
      return 'home';
    }
    return true;
  });

  // 페이지 전환 후 처리
  router.afterEach((to) => {
    // 페이지 최상단으로 스크롤
    window.scrollTo(0, 0);

    // 현재 페이지 상태 업데이트
    store.setState({ currentPage: to });
  });
}

/**
 * 전역 이벤트 리스너
 */
function setupGlobalListeners() {
  // 앱 준비 완료
  eventBus.on(EVENT_TYPES.APP_READY, () => {
    document.body.classList.add('app-ready');
  });

  // 에러 처리
  eventBus.on(EVENT_TYPES.ERROR, (error) => {
    console.error('App Error:', error);
    toast.error(error.message || '오류가 발생했습니다');
  });

  // 글 생성 완료
  eventBus.on(EVENT_TYPES.GENERATION_COMPLETE, (result) => {
    router.navigate('result');
  });

  // 설정 변경
  eventBus.on(EVENT_TYPES.SETTINGS_UPDATED, () => {
    // 필요시 UI 업데이트
  });

  // 온라인/오프라인 상태
  window.addEventListener('online', () => {
    toast.success('네트워크 연결됨');
  });

  window.addEventListener('offline', () => {
    toast.warning('네트워크 연결 끊김');
  });

  // 페이지 이탈 경고 (생성 중일 때)
  window.addEventListener('beforeunload', (e) => {
    const { ui } = store.getState();
    if (ui.isLoading) {
      e.preventDefault();
      e.returnValue = '작업이 진행 중입니다. 페이지를 나가시겠습니까?';
      return e.returnValue;
    }
  });

  // 전역 클릭 핸들러 (드롭다운 등 닫기)
  document.addEventListener('click', (e) => {
    // 드롭다운 메뉴 외부 클릭 시 닫기
    if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-trigger')) {
      document.querySelectorAll('.dropdown-menu.open').forEach(menu => {
        menu.classList.remove('open');
      });
    }
  });
}

/**
 * 키보드 단축키 설정
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Key 조합
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'enter':
          // Ctrl+Enter: 글 생성
          if (store.get('currentPage') === 'home') {
            e.preventDefault();
            document.getElementById('generate-btn')?.click();
          }
          break;

        case 's':
          // Ctrl+S: 저장 (초안 또는 설정)
          e.preventDefault();
          handleSaveShortcut();
          break;

        case 'k':
          // Ctrl+K: 검색 또는 퀵 액션
          e.preventDefault();
          showQuickActions();
          break;

        case ',':
          // Ctrl+,: 설정
          e.preventDefault();
          router.navigate('settings');
          break;
      }
    }

    // ESC: 모달 닫기 또는 뒤로가기
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (!activeModal) {
        // 모달이 없으면 홈으로
        const currentPage = store.get('currentPage');
        if (currentPage !== 'home') {
          router.navigate('home');
        }
      }
    }
  });
}

/**
 * 저장 단축키 핸들러
 */
function handleSaveShortcut() {
  const currentPage = store.get('currentPage');

  switch (currentPage) {
    case 'home':
      // 초안 저장
      document.getElementById('save-draft-btn')?.click();
      break;
    case 'settings':
      // 설정 저장
      document.getElementById('save-general-settings')?.click();
      break;
    case 'result':
      // 편집 내용 저장
      document.getElementById('save-edit')?.click();
      break;
  }
}

/**
 * 퀵 액션 표시
 */
async function showQuickActions() {
  const actions = [
    { label: '🏠 홈', action: () => router.navigate('home') },
    { label: '📝 새 글 생성', action: () => router.navigate('home') },
    { label: '🖼️ 이미지 생성', action: () => router.navigate('image') },
    { label: '📚 히스토리', action: () => router.navigate('history') },
    { label: '⚙️ 설정', action: () => router.navigate('settings') }
  ];

  const content = `
    <div class="quick-actions">
      ${actions.map((a, i) => `
        <button class="quick-action-item" data-index="${i}">${a.label}</button>
      `).join('')}
    </div>
  `;

  const modalEl = modal.open({
    title: '빠른 이동',
    content,
    size: 'sm'
  });

  modalEl.querySelectorAll('.quick-action-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      modal.close();
      actions[index].action();
    });
  });

  // 첫 번째 아이템 포커스
  modalEl.querySelector('.quick-action-item')?.focus();
}

/**
 * 테마 변경 감지
 */
function setupThemeWatcher() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQuery.addEventListener('change', (e) => {
    const settings = store.get('settings');
    if (settings?.theme === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
}

/**
 * 저장된 API 키 로드 시도
 */
async function tryLoadApiKeys() {
  const encryptedKeys = localStorage.getItem('blog_auto_keys');
  if (!encryptedKeys) return;

  // 세션 중 자동 로드는 하지 않음 (보안)
  // 설정 페이지에서 비밀번호 입력 시 로드됨
}

// DOM 로드 시 앱 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// 전역 에러 핸들러
window.addEventListener('error', (e) => {
  console.error('Global Error:', e.error);
  eventBus.emit(EVENT_TYPES.ERROR, {
    message: '예기치 않은 오류가 발생했습니다',
    error: e.error
  });
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled Promise Rejection:', e.reason);
  eventBus.emit(EVENT_TYPES.ERROR, {
    message: '비동기 작업 중 오류가 발생했습니다',
    error: e.reason
  });
});

// 개발 모드에서 디버깅용 전역 객체
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.__BLOG_AUTO__ = {
    store,
    router,
    eventBus,
    toast,
    modal
  };
}

export { bootstrap };
