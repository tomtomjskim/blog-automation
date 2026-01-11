/**
 * Blog Automation - API Connection Manager
 * API 키 등록, 연결 테스트, 상태 관리
 */

import { store, setApiKeys } from '../state.js';
import { eventBus, EVENT_TYPES } from '../core/events.js';

const CACHE_DURATION = 5 * 60 * 1000; // 5분

class ApiConnectionManager {
  constructor() {
    this.connectionCache = new Map();
    this.testInProgress = new Set();
  }

  /**
   * Provider 정보
   */
  static providers = {
    anthropic: {
      name: 'Anthropic',
      displayName: 'Claude',
      icon: '🤖',
      testEndpoint: 'https://api.anthropic.com/v1/messages',
      keyPrefix: 'sk-ant-',
      keyPattern: /^sk-ant-[a-zA-Z0-9_-]+$/,
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      docs: 'https://console.anthropic.com/settings/keys',
      quotaSupported: false
    },
    openai: {
      name: 'OpenAI',
      displayName: 'GPT',
      icon: '🧠',
      testEndpoint: 'https://api.openai.com/v1/models',
      keyPrefix: 'sk-',
      keyPattern: /^sk-[a-zA-Z0-9_-]+$/,
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      docs: 'https://platform.openai.com/api-keys',
      quotaSupported: true,
      quotaEndpoint: 'https://api.openai.com/dashboard/billing/usage'
    },
    google: {
      name: 'Google',
      displayName: 'Gemini',
      icon: '💎',
      testEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
      keyPrefix: 'AI',
      keyPattern: /^AI[a-zA-Z0-9_-]+$/,
      models: ['gemini-pro', 'gemini-1.5-pro'],
      docs: 'https://makersuite.google.com/app/apikey',
      quotaSupported: false
    },
    groq: {
      name: 'Groq',
      displayName: 'Groq',
      icon: '⚡',
      testEndpoint: 'https://api.groq.com/openai/v1/models',
      keyPrefix: 'gsk_',
      keyPattern: /^gsk_[a-zA-Z0-9_-]+$/,
      models: ['llama3-70b-8192', 'mixtral-8x7b-32768'],
      docs: 'https://console.groq.com/keys',
      quotaSupported: false,
      freeLimit: '14,400 req/day'
    },
    stability: {
      name: 'Stability AI',
      displayName: 'Stable Diffusion',
      icon: '🎨',
      testEndpoint: 'https://api.stability.ai/v1/user/account',
      keyPrefix: 'sk-',
      keyPattern: /^sk-[a-zA-Z0-9_-]+$/,
      models: ['stable-diffusion-xl'],
      docs: 'https://platform.stability.ai/account/keys',
      quotaSupported: true
    }
  };

  /**
   * API 키 형식 검증
   * @param {string} provider - Provider ID
   * @param {string} apiKey - API 키
   * @returns {object} 검증 결과
   */
  validateKeyFormat(provider, apiKey) {
    const providerInfo = ApiConnectionManager.providers[provider];
    if (!providerInfo) {
      return { valid: false, error: '알 수 없는 Provider' };
    }

    if (!apiKey || apiKey.trim() === '') {
      return { valid: false, error: 'API 키가 비어있습니다' };
    }

    const key = apiKey.trim();

    // Prefix 확인
    if (providerInfo.keyPrefix && !key.startsWith(providerInfo.keyPrefix)) {
      return {
        valid: false,
        error: `API 키는 '${providerInfo.keyPrefix}'로 시작해야 합니다`
      };
    }

    // 패턴 확인 (있는 경우)
    if (providerInfo.keyPattern && !providerInfo.keyPattern.test(key)) {
      return { valid: false, error: 'API 키 형식이 올바르지 않습니다' };
    }

    // 길이 확인
    if (key.length < 20) {
      return { valid: false, error: 'API 키가 너무 짧습니다' };
    }

    return { valid: true };
  }

  /**
   * API 키 등록 및 검증
   * @param {string} provider - Provider ID
   * @param {string} apiKey - API 키
   * @returns {object} 등록 결과
   */
  async registerKey(provider, apiKey) {
    // 형식 검증
    const formatResult = this.validateKeyFormat(provider, apiKey);
    if (!formatResult.valid) {
      return {
        success: false,
        validated: false,
        error: formatResult.error
      };
    }

    // 연결 테스트
    const testResult = await this.testConnection(provider, apiKey);

    if (testResult.connected) {
      // 상태에 저장
      const currentKeys = store.get('apiKeys') || {};
      setApiKeys({ ...currentKeys, [provider]: apiKey });

      eventBus.emit(EVENT_TYPES.API_KEY_REGISTERED, { provider });
    }

    return {
      success: testResult.connected,
      validated: testResult.connected,
      latency: testResult.latency,
      quota: testResult.quota,
      error: testResult.error
    };
  }

  /**
   * 연결 테스트
   * @param {string} provider - Provider ID
   * @param {string} apiKey - API 키 (없으면 저장된 키 사용)
   * @returns {object} 테스트 결과
   */
  async testConnection(provider, apiKey = null) {
    const key = apiKey || store.get('apiKeys')?.[provider];
    if (!key) {
      return {
        connected: false,
        error: 'API 키가 설정되지 않았습니다'
      };
    }

    // 이미 테스트 중인 경우
    if (this.testInProgress.has(provider)) {
      return { connected: false, error: '테스트 진행 중...' };
    }

    // 캐시 확인
    const cached = this.connectionCache.get(provider);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }

    this.testInProgress.add(provider);
    const startTime = Date.now();

    try {
      let result;

      switch (provider) {
        case 'anthropic':
          result = await this.testAnthropic(key);
          break;
        case 'openai':
          result = await this.testOpenAI(key);
          break;
        case 'google':
          result = await this.testGoogle(key);
          break;
        case 'groq':
          result = await this.testGroq(key);
          break;
        case 'stability':
          result = await this.testStability(key);
          break;
        default:
          result = { connected: false, error: '알 수 없는 Provider' };
      }

      const latency = Date.now() - startTime;
      const finalResult = {
        ...result,
        latency,
        lastChecked: new Date().toISOString()
      };

      // 캐시 저장
      this.connectionCache.set(provider, {
        timestamp: Date.now(),
        result: finalResult
      });

      return finalResult;
    } catch (error) {
      return {
        connected: false,
        error: error.message || '연결 테스트 실패',
        latency: Date.now() - startTime
      };
    } finally {
      this.testInProgress.delete(provider);
    }
  }

  /**
   * Anthropic 연결 테스트
   */
  async testAnthropic(apiKey) {
    try {
      // 빈 요청으로 인증 테스트
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      // 인증 오류 확인
      if (response.status === 401) {
        return { connected: false, error: 'API 키가 유효하지 않습니다' };
      }

      // 200 또는 400 (잘못된 요청이지만 인증은 성공)이면 OK
      return { connected: response.status === 200 || response.status < 500 };
    } catch (error) {
      if (error.name === 'TypeError') {
        return { connected: false, error: 'CORS 정책으로 직접 테스트 불가 (키 저장됨)' };
      }
      throw error;
    }
  }

  /**
   * OpenAI 연결 테스트
   */
  async testOpenAI(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.status === 401) {
        return { connected: false, error: 'API 키가 유효하지 않습니다' };
      }

      if (response.ok) {
        const data = await response.json();
        return {
          connected: true,
          models: data.data?.slice(0, 5).map(m => m.id)
        };
      }

      return { connected: false, error: `HTTP ${response.status}` };
    } catch (error) {
      if (error.name === 'TypeError') {
        return { connected: false, error: 'CORS 정책으로 직접 테스트 불가 (키 저장됨)' };
      }
      throw error;
    }
  }

  /**
   * Google 연결 테스트
   */
  async testGoogle(apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      );

      if (response.status === 400 || response.status === 401) {
        return { connected: false, error: 'API 키가 유효하지 않습니다' };
      }

      if (response.ok) {
        return { connected: true };
      }

      return { connected: false, error: `HTTP ${response.status}` };
    } catch (error) {
      if (error.name === 'TypeError') {
        return { connected: false, error: 'CORS 정책으로 직접 테스트 불가 (키 저장됨)' };
      }
      throw error;
    }
  }

  /**
   * Groq 연결 테스트
   */
  async testGroq(apiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.status === 401) {
        return { connected: false, error: 'API 키가 유효하지 않습니다' };
      }

      if (response.ok) {
        return {
          connected: true,
          freeLimit: '14,400 req/day'
        };
      }

      return { connected: false, error: `HTTP ${response.status}` };
    } catch (error) {
      if (error.name === 'TypeError') {
        return { connected: false, error: 'CORS 정책으로 직접 테스트 불가 (키 저장됨)' };
      }
      throw error;
    }
  }

  /**
   * Stability AI 연결 테스트
   */
  async testStability(apiKey) {
    try {
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.status === 401) {
        return { connected: false, error: 'API 키가 유효하지 않습니다' };
      }

      if (response.ok) {
        const data = await response.json();
        return {
          connected: true,
          quota: {
            credits: data.credits
          }
        };
      }

      return { connected: false, error: `HTTP ${response.status}` };
    } catch (error) {
      if (error.name === 'TypeError') {
        return { connected: false, error: 'CORS 정책으로 직접 테스트 불가 (키 저장됨)' };
      }
      throw error;
    }
  }

  /**
   * 모든 Provider 상태 대시보드
   * @returns {object} 대시보드 데이터
   */
  async getDashboard() {
    const apiKeys = store.get('apiKeys') || {};
    const providers = [];
    const recommendations = [];

    for (const [id, info] of Object.entries(ApiConnectionManager.providers)) {
      const hasKey = !!apiKeys[id];

      let status = 'not_configured';
      let details = null;

      if (hasKey) {
        const cached = this.connectionCache.get(id);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          status = cached.result.connected ? 'connected' : 'error';
          details = cached.result;
        } else {
          status = 'unknown';
        }
      }

      providers.push({
        id,
        name: info.displayName,
        icon: info.icon,
        status,
        hasKey,
        details,
        docs: info.docs,
        freeLimit: info.freeLimit
      });
    }

    // 추천 사항
    if (!apiKeys.anthropic && !apiKeys.openai) {
      recommendations.push({
        type: 'warning',
        message: 'AI 모델 API 키가 설정되지 않았습니다. 글 생성을 위해 최소 하나의 API 키를 등록해주세요.'
      });
    }

    if (!apiKeys.groq) {
      recommendations.push({
        type: 'info',
        message: 'Groq는 무료로 사용 가능합니다 (일 14,400 요청). 빠른 테스트에 좋습니다.'
      });
    }

    return { providers, recommendations };
  }

  /**
   * 모든 연결 상태 새로고침
   */
  async refreshAll() {
    const apiKeys = store.get('apiKeys') || {};
    const results = {};

    for (const provider of Object.keys(apiKeys)) {
      if (apiKeys[provider]) {
        results[provider] = await this.testConnection(provider);
      }
    }

    eventBus.emit(EVENT_TYPES.API_STATUS_REFRESHED, results);
    return results;
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.connectionCache.clear();
  }

  /**
   * API 키 삭제
   * @param {string} provider - Provider ID
   */
  removeKey(provider) {
    const currentKeys = store.get('apiKeys') || {};
    delete currentKeys[provider];
    setApiKeys(currentKeys);
    this.connectionCache.delete(provider);
    eventBus.emit(EVENT_TYPES.API_KEY_REMOVED, { provider });
  }
}

// 싱글톤 인스턴스
const apiConnectionManager = new ApiConnectionManager();

export { apiConnectionManager, ApiConnectionManager };
