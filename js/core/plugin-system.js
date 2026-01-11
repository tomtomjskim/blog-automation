/**
 * Blog Automation - Plugin System
 * 확장 가능한 플러그인 아키텍처
 */

import { eventBus, EVENT_TYPES } from './events.js';

/**
 * 플러그인 훅 정의
 */
const PLUGIN_HOOKS = {
  // 생성 관련
  'beforeGenerate': [],      // 글 생성 전
  'afterGenerate': [],       // 글 생성 후
  'onGenerateError': [],     // 생성 오류 시

  // 발행 관련
  'beforePublish': [],       // 발행 전
  'afterPublish': [],        // 발행 후
  'onPublishError': [],      // 발행 오류 시

  // 컨텐츠 관련
  'beforeSave': [],          // 저장 전
  'afterSave': [],           // 저장 후
  'onContentChange': [],     // 컨텐츠 변경 시

  // 이미지 관련
  'beforeImageUpload': [],   // 이미지 업로드 전
  'afterImageUpload': [],    // 이미지 업로드 후
  'beforeImageInsert': [],   // 이미지 삽입 전

  // 분석 관련
  'onSEOAnalysis': [],       // SEO 분석 시
  'onContentAnalysis': [],   // 컨텐츠 분석 시

  // 앱 관련
  'onAppReady': [],          // 앱 초기화 완료
  'onRouteChange': [],       // 라우트 변경 시
  'onSettingsChange': [],    // 설정 변경 시
  'onError': []              // 오류 발생 시
};

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = JSON.parse(JSON.stringify(PLUGIN_HOOKS));
    this.enabled = new Set();
    this.context = {};
  }

  /**
   * 플러그인 등록
   * @param {object} plugin - 플러그인 객체
   * @returns {boolean} 등록 성공 여부
   */
  register(plugin) {
    // 유효성 검사
    if (!plugin.name || !plugin.version) {
      console.error('[PluginManager] Plugin must have name and version');
      return false;
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginManager] Plugin "${plugin.name}" already registered`);
      return false;
    }

    // 플러그인 정보 저장
    const pluginInfo = {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description || '',
      author: plugin.author || 'Unknown',
      dependencies: plugin.dependencies || [],
      settings: plugin.defaultSettings || {},
      hooks: {},
      instance: plugin
    };

    // 훅 등록
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
        if (this.hooks[hookName]) {
          this.hooks[hookName].push({
            plugin: plugin.name,
            handler,
            priority: handler.priority || 10
          });
          pluginInfo.hooks[hookName] = true;

          // 우선순위 정렬
          this.hooks[hookName].sort((a, b) => a.priority - b.priority);
        } else {
          console.warn(`[PluginManager] Unknown hook: ${hookName}`);
        }
      });
    }

    this.plugins.set(plugin.name, pluginInfo);

    // 초기화 함수 호출
    if (typeof plugin.init === 'function') {
      try {
        plugin.init(this.getPluginAPI(plugin.name));
      } catch (error) {
        console.error(`[PluginManager] Failed to init plugin "${plugin.name}":`, error);
        return false;
      }
    }

    // 기본적으로 활성화
    this.enabled.add(plugin.name);

    eventBus.emit(EVENT_TYPES.PLUGIN_REGISTERED, { name: plugin.name });
    console.log(`[PluginManager] Plugin "${plugin.name}" v${plugin.version} registered`);

    return true;
  }

  /**
   * 플러그인 해제
   * @param {string} name - 플러그인 이름
   * @returns {boolean} 해제 성공 여부
   */
  unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    // 훅 제거
    Object.keys(this.hooks).forEach(hookName => {
      this.hooks[hookName] = this.hooks[hookName].filter(h => h.plugin !== name);
    });

    // 종료 함수 호출
    if (typeof plugin.instance.destroy === 'function') {
      try {
        plugin.instance.destroy();
      } catch (error) {
        console.error(`[PluginManager] Error destroying plugin "${name}":`, error);
      }
    }

    this.plugins.delete(name);
    this.enabled.delete(name);

    eventBus.emit(EVENT_TYPES.PLUGIN_UNREGISTERED, { name });
    console.log(`[PluginManager] Plugin "${name}" unregistered`);

    return true;
  }

  /**
   * 플러그인 활성화
   * @param {string} name - 플러그인 이름
   */
  enable(name) {
    if (!this.plugins.has(name)) return false;
    this.enabled.add(name);
    eventBus.emit(EVENT_TYPES.PLUGIN_ENABLED, { name });
    return true;
  }

  /**
   * 플러그인 비활성화
   * @param {string} name - 플러그인 이름
   */
  disable(name) {
    if (!this.plugins.has(name)) return false;
    this.enabled.delete(name);
    eventBus.emit(EVENT_TYPES.PLUGIN_DISABLED, { name });
    return true;
  }

  /**
   * 훅 실행
   * @param {string} hookName - 훅 이름
   * @param {object} context - 컨텍스트 데이터
   * @returns {object} 수정된 컨텍스트
   */
  async runHook(hookName, context = {}) {
    const handlers = this.hooks[hookName];
    if (!handlers || handlers.length === 0) {
      return context;
    }

    let result = { ...context };

    for (const handler of handlers) {
      // 비활성화된 플러그인 건너뛰기
      if (!this.enabled.has(handler.plugin)) continue;

      try {
        const hookResult = await handler.handler(result, this.getPluginAPI(handler.plugin));

        // 결과가 있으면 병합
        if (hookResult !== undefined && hookResult !== null) {
          if (typeof hookResult === 'object') {
            result = { ...result, ...hookResult };
          } else {
            result = hookResult;
          }
        }

        // 중단 플래그 확인
        if (result._stop === true) {
          delete result._stop;
          break;
        }
      } catch (error) {
        console.error(`[PluginManager] Hook error in "${handler.plugin}":`, error);

        // 오류 훅 실행
        if (hookName !== 'onError') {
          await this.runHook('onError', {
            plugin: handler.plugin,
            hook: hookName,
            error
          });
        }
      }
    }

    return result;
  }

  /**
   * 동기 훅 실행
   * @param {string} hookName - 훅 이름
   * @param {object} context - 컨텍스트 데이터
   * @returns {object} 수정된 컨텍스트
   */
  runHookSync(hookName, context = {}) {
    const handlers = this.hooks[hookName];
    if (!handlers || handlers.length === 0) {
      return context;
    }

    let result = { ...context };

    for (const handler of handlers) {
      if (!this.enabled.has(handler.plugin)) continue;

      try {
        const hookResult = handler.handler(result, this.getPluginAPI(handler.plugin));

        if (hookResult !== undefined && hookResult !== null) {
          if (typeof hookResult === 'object') {
            result = { ...result, ...hookResult };
          } else {
            result = hookResult;
          }
        }

        if (result._stop === true) {
          delete result._stop;
          break;
        }
      } catch (error) {
        console.error(`[PluginManager] Sync hook error in "${handler.plugin}":`, error);
      }
    }

    return result;
  }

  /**
   * 플러그인 API 객체 생성
   * @param {string} pluginName - 플러그인 이름
   * @returns {object} API 객체
   */
  getPluginAPI(pluginName) {
    const plugin = this.plugins.get(pluginName);

    return {
      // 플러그인 정보
      name: pluginName,

      // 설정
      getSettings: () => plugin?.settings || {},
      updateSettings: (settings) => {
        if (plugin) {
          plugin.settings = { ...plugin.settings, ...settings };
        }
      },

      // 컨텍스트 공유
      getContext: (key) => this.context[key],
      setContext: (key, value) => { this.context[key] = value; },

      // 이벤트
      emit: (event, data) => eventBus.emit(event, { plugin: pluginName, ...data }),
      on: (event, handler) => eventBus.on(event, handler),
      off: (event, handler) => eventBus.off(event, handler),

      // 다른 플러그인 조회
      getPlugin: (name) => this.plugins.get(name)?.instance,
      isEnabled: (name) => this.enabled.has(name),

      // 유틸리티
      log: (...args) => console.log(`[${pluginName}]`, ...args),
      warn: (...args) => console.warn(`[${pluginName}]`, ...args),
      error: (...args) => console.error(`[${pluginName}]`, ...args)
    };
  }

  /**
   * 플러그인 목록 조회
   * @returns {array} 플러그인 목록
   */
  list() {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
      author: p.author,
      enabled: this.enabled.has(p.name),
      hooks: Object.keys(p.hooks)
    }));
  }

  /**
   * 플러그인 정보 조회
   * @param {string} name - 플러그인 이름
   * @returns {object|null} 플러그인 정보
   */
  get(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return null;

    return {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      enabled: this.enabled.has(name),
      hooks: Object.keys(plugin.hooks),
      settings: plugin.settings
    };
  }

  /**
   * 사용 가능한 훅 목록
   * @returns {array} 훅 이름 목록
   */
  getAvailableHooks() {
    return Object.keys(PLUGIN_HOOKS);
  }

  /**
   * 훅에 등록된 플러그인 목록
   * @param {string} hookName - 훅 이름
   * @returns {array} 플러그인 목록
   */
  getHookPlugins(hookName) {
    const handlers = this.hooks[hookName];
    if (!handlers) return [];

    return handlers.map(h => ({
      plugin: h.plugin,
      priority: h.priority,
      enabled: this.enabled.has(h.plugin)
    }));
  }
}

/**
 * 플러그인 템플릿 (예시)
 */
const PluginTemplate = {
  name: 'example-plugin',
  version: '1.0.0',
  description: '예시 플러그인',
  author: 'Developer',

  // 기본 설정
  defaultSettings: {
    option1: true,
    option2: 'default'
  },

  // 의존성 (다른 플러그인 이름)
  dependencies: [],

  // 훅 핸들러
  hooks: {
    beforeGenerate: async (context, api) => {
      api.log('Before generate:', context.topic);
      return context; // 수정된 컨텍스트 반환
    },

    afterGenerate: async (context, api) => {
      api.log('After generate:', context.title);
      // _stop: true 를 반환하면 이후 핸들러 중단
    }
  },

  // 초기화 (플러그인 등록 시 호출)
  init(api) {
    api.log('Plugin initialized');
  },

  // 종료 (플러그인 해제 시 호출)
  destroy() {
    console.log('Plugin destroyed');
  }
};

// 싱글톤 인스턴스
const pluginManager = new PluginManager();

export { pluginManager, PluginManager, PluginTemplate, PLUGIN_HOOKS };
