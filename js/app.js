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
import { initAppLayout, updateActiveNav } from './ui/app-layout.js';

// Pages
import { renderLandingPage } from './pages/landing.js';
import { renderWritePage } from './pages/write.js';
import { renderResultPage } from './pages/result.js';
import { renderSettingsPage } from './pages/settings.js';
import { renderImagePage } from './pages/image.js';
import { renderHistoryPage } from './pages/history.js';
import { renderSchedulePage } from './pages/schedule.js';
import { renderBatchPage } from './pages/batch.js';

// Services
import { postScheduler } from './services/scheduler.js';

// Features
import { keyboardManager } from './features/keyboard.js';

/**
 * 앱 초기화
 */
async function bootstrap() {
  console.log('🚀 Blog Automation Starting...');

  // 앱 레이아웃 초기화 (헤더, 사이드바, 바텀 네비)
  initAppLayout();

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

  // 예약 스케줄러 시작
  postScheduler.start();

  // 라우터는 load 이벤트에서 자동으로 초기 라우팅 처리함

  console.log('✅ Blog Automation Ready');
}

/**
 * 라우터 설정
 */
function setupRouter() {
  // 페이지 라우트 등록
  router.register('home', renderLandingPage);
  router.register('write', renderWritePage);
  router.register('result', renderResultPage);
  router.register('settings', renderSettingsPage);
  router.register('image', renderImagePage);
  router.register('history', renderHistoryPage);
  router.register('schedule', renderSchedulePage);
  router.register('batch', renderBatchPage);

  // 404 처리
  router.setNotFound(() => {
    router.navigate('home');
  });

  // 라우트 가드
  router.beforeEach(({ to, from }) => {
    // result 페이지는 결과가 있어야 접근 가능
    if (to.path === 'result' && !store.get('result')) {
      toast.warning('먼저 글을 생성해주세요');
      return 'write';
    }
    return true;
  });

  // 페이지 전환 후 처리
  router.afterEach(({ to }) => {
    // 페이지 최상단으로 스크롤
    window.scrollTo(0, 0);

    // 현재 페이지 상태 업데이트
    store.setState({ currentPage: to.path });

    // 네비게이션 활성 상태 업데이트
    updateActiveNav();
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

  // 앱 레이아웃에서 퀵 액션 요청
  document.addEventListener('show-quick-actions', () => {
    keyboardManager.showQuickNavigation();
  });
}

/**
 * 키보드 단축키 설정
 */
function setupKeyboardShortcuts() {
  // 키보드 매니저 초기화 (모든 단축키 처리)
  keyboardManager.init();
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
