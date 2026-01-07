/**
 * Blog Automation - State Management
 * 전역 상태 관리
 */

import { storage } from './core/storage.js';
import { eventBus, EVENT_TYPES } from './core/events.js';

/**
 * Store 클래스 - 상태 관리
 */
class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Map();
  }

  getState() {
    return { ...this.state };
  }

  get(key) {
    return this.state[key];
  }

  setState(newState) {
    const prevState = this.state;
    this.state = { ...this.state, ...newState };

    // 변경된 키에 대한 리스너 호출
    Object.keys(newState).forEach(key => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(cb => {
          try {
            cb(this.state[key], prevState[key]);
          } catch (e) {
            console.error('State listener error:', e);
          }
        });
      }
    });

    // 전역 리스너 호출
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => {
        try {
          cb(this.state, prevState);
        } catch (e) {
          console.error('Global state listener error:', e);
        }
      });
    }
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // unsubscribe 함수 반환
    return () => this.listeners.get(key).delete(callback);
  }

  reset(keys) {
    if (keys) {
      const resetState = {};
      keys.forEach(key => {
        resetState[key] = initialAppState[key];
      });
      this.setState(resetState);
    } else {
      this.state = { ...initialAppState };
    }
  }
}

// 초기 앱 상태
const initialAppState = {
  // 앱 상태
  initialized: false,
  unlocked: false,

  // 현재 페이지
  currentPage: 'home',

  // 설정 (localStorage에서 로드)
  settings: null,

  // API 키 (암호화됨, 메모리에만 보관)
  apiKeys: {
    anthropic: null,
    openai: null,
    google: null,
    groq: null,
    stability: null
  },

  // 네이버 블로그 설정
  naverBlog: {
    userId: null,
    apiPassword: null,
    connected: false,
    categories: []
  },

  // 현재 생성 중인 글 정보
  currentGeneration: {
    topic: '',
    keywords: [],
    style: 'casual',
    length: 'medium',
    additionalInfo: '',
    referenceUrl: '',
    provider: 'anthropic',
    model: null,
    images: []
  },

  // 생성된 결과
  result: null,

  // 히스토리 (localStorage에서 로드)
  history: [],

  // 초안 목록
  drafts: [],

  // 템플릿 목록
  templates: [],

  // UI 상태
  ui: {
    isLoading: false,
    loadingMessage: '',
    error: null,
    sidebarOpen: false,
    streamingContent: ''
  }
};

// 전역 스토어 인스턴스
const store = new Store(initialAppState);

/**
 * 앱 초기화
 */
async function initializeApp() {
  // localStorage에서 설정 로드
  const settings = storage.getSettings();
  const history = storage.getHistory();
  const drafts = storage.getDrafts();
  const templates = storage.getTemplates();

  store.setState({
    settings,
    history: history.items || [],
    drafts: drafts.items || [],
    templates: templates.items || [],
    currentGeneration: {
      ...store.get('currentGeneration'),
      provider: settings.defaults?.provider || 'anthropic',
      model: settings.defaults?.model || null,
      style: settings.defaults?.style || 'casual',
      length: settings.defaults?.length || 'medium'
    }
  });

  // 테마 적용
  applyTheme(settings.theme || 'light');

  // 마이그레이션 체크
  storage.migrate();

  store.setState({ initialized: true });
  eventBus.emit(EVENT_TYPES.APP_READY);
}

/**
 * 테마 적용
 */
function applyTheme(theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }

  storage.updateSetting('theme', theme);
}

/**
 * API 키 설정 (메모리에만)
 */
function setApiKeys(keys) {
  store.setState({
    apiKeys: { ...store.get('apiKeys'), ...keys }
  });
}

/**
 * 현재 생성 정보 업데이트
 */
function updateCurrentGeneration(data) {
  store.setState({
    currentGeneration: { ...store.get('currentGeneration'), ...data }
  });
}

/**
 * 결과 설정
 */
function setResult(result) {
  store.setState({ result });

  // 히스토리에 추가
  if (result) {
    const historyItem = storage.addToHistory({
      title: result.title,
      content: result.content,
      keywords: result.keywords,
      style: result.style,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      charCount: result.charCount
    });

    store.setState({
      history: [historyItem, ...store.get('history').slice(0, 49)]
    });

    eventBus.emit(EVENT_TYPES.HISTORY_UPDATED);
  }
}

/**
 * UI 상태 업데이트
 */
function setUIState(ui) {
  store.setState({
    ui: { ...store.get('ui'), ...ui }
  });
}

/**
 * 로딩 시작
 */
function startLoading(message = '처리 중...') {
  setUIState({ isLoading: true, loadingMessage: message, error: null });
}

/**
 * 로딩 종료
 */
function stopLoading() {
  setUIState({ isLoading: false, loadingMessage: '' });
}

/**
 * 에러 설정
 */
function setError(error) {
  setUIState({ error: error?.message || error, isLoading: false });
}

/**
 * 에러 클리어
 */
function clearError() {
  setUIState({ error: null });
}

/**
 * 설정 업데이트
 */
function updateSettings(newSettings) {
  const settings = { ...store.get('settings'), ...newSettings };
  storage.saveSettings(settings);
  store.setState({ settings });
  eventBus.emit(EVENT_TYPES.SETTINGS_UPDATED, settings);
}

/**
 * 네이버 블로그 연결 정보 설정
 */
function setNaverBlogConnection(data) {
  store.setState({
    naverBlog: { ...store.get('naverBlog'), ...data }
  });
}

/**
 * 초안 저장
 */
function saveDraft(draft) {
  const savedDraft = storage.saveDraft(draft);
  store.setState({
    drafts: [savedDraft, ...store.get('drafts').filter(d => d.id !== savedDraft.id).slice(0, 9)]
  });
  eventBus.emit(EVENT_TYPES.DRAFT_SAVED, savedDraft);
  return savedDraft;
}

/**
 * 초안 삭제
 */
function deleteDraft(id) {
  storage.deleteDraft(id);
  store.setState({
    drafts: store.get('drafts').filter(d => d.id !== id)
  });
}

/**
 * 히스토리 삭제
 */
function deleteHistoryItem(id) {
  storage.deleteHistoryItem(id);
  store.setState({
    history: store.get('history').filter(h => h.id !== id)
  });
  eventBus.emit(EVENT_TYPES.HISTORY_UPDATED);
}

/**
 * 히스토리 전체 삭제
 */
function clearHistory() {
  storage.clearHistory();
  store.setState({ history: [] });
  eventBus.emit(EVENT_TYPES.HISTORY_UPDATED);
}

/**
 * 템플릿 저장
 */
function saveTemplate(template) {
  const savedTemplate = storage.saveTemplate(template);
  store.setState({
    templates: [savedTemplate, ...store.get('templates').filter(t => t.id !== savedTemplate.id)]
  });
  return savedTemplate;
}

/**
 * 템플릿 삭제
 */
function deleteTemplate(id) {
  storage.deleteTemplate(id);
  store.setState({
    templates: store.get('templates').filter(t => t.id !== id)
  });
}

export {
  store,
  initialAppState,
  initializeApp,
  applyTheme,
  setApiKeys,
  updateCurrentGeneration,
  setResult,
  setUIState,
  startLoading,
  stopLoading,
  setError,
  clearError,
  updateSettings,
  setNaverBlogConnection,
  saveDraft,
  deleteDraft,
  deleteHistoryItem,
  clearHistory,
  saveTemplate,
  deleteTemplate
};
