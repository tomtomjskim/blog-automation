/**
 * Blog Automation - Base LLM Provider
 * 모든 LLM Provider의 기본 클래스
 */

class LLMProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = 'base';
    this.displayName = 'Base Provider';
    this.icon = '🤖';
    this.color = '#666666';
    this.baseUrl = '';
    this.models = {};
    this.defaultModel = '';
    this.supportsStreaming = false;
    this.supportsImage = false;
  }

  /**
   * 텍스트 생성 (서브클래스에서 구현)
   */
  async generateText(prompt, options = {}) {
    throw new Error('generateText not implemented');
  }

  /**
   * 스트리밍 텍스트 생성 (서브클래스에서 구현)
   */
  async *generateTextStream(prompt, options = {}) {
    throw new Error('generateTextStream not implemented');
  }

  /**
   * 이미지 생성 (서브클래스에서 구현)
   */
  async generateImage(prompt, options = {}) {
    throw new Error('generateImage not implemented');
  }

  /**
   * API 키 검증 (서브클래스에서 구현)
   */
  async validateApiKey() {
    throw new Error('validateApiKey not implemented');
  }

  /**
   * 지원 모델 목록 반환
   */
  getModels() {
    return Object.entries(this.models).map(([id, info]) => ({
      id,
      ...info
    }));
  }

  /**
   * 모델 정보 반환
   */
  getModel(modelId) {
    return this.models[modelId] || null;
  }

  /**
   * 기본 모델 ID 반환
   */
  getDefaultModel() {
    return this.defaultModel;
  }

  /**
   * 비용 계산
   */
  calculateCost(modelId, usage) {
    const model = this.models[modelId];
    if (!model || !model.inputCost) return null;

    const inputCost = (usage.promptTokens / 1000000) * model.inputCost;
    const outputCost = (usage.completionTokens / 1000000) * model.outputCost;

    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
      currency: 'USD'
    };
  }

  /**
   * HTTP 에러 처리
   */
  handleHttpError(status, error = {}) {
    const message = error.error?.message || error.message || 'Unknown error';

    switch (status) {
      case 400:
        return { code: 'BAD_REQUEST', message: `잘못된 요청: ${message}` };
      case 401:
        return { code: 'INVALID_API_KEY', message: 'API 키가 유효하지 않습니다' };
      case 403:
        return { code: 'FORBIDDEN', message: '접근이 거부되었습니다' };
      case 404:
        return { code: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다' };
      case 429:
        return { code: 'RATE_LIMIT', message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요' };
      case 500:
      case 502:
      case 503:
        return { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요' };
      default:
        return { code: 'UNKNOWN', message: `API 오류 (${status}): ${message}` };
    }
  }

  /**
   * 공통 fetch 래퍼
   */
  async fetchApi(url, options = {}) {
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      const duration = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = this.handleHttpError(response.status, errorData);
        throw new Error(error.message);
      }

      return { response, duration };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('네트워크 오류: 인터넷 연결을 확인해주세요');
      }
      throw error;
    }
  }

  /**
   * Provider 정보 반환
   */
  getInfo() {
    return {
      name: this.name,
      displayName: this.displayName,
      icon: this.icon,
      color: this.color,
      supportsStreaming: this.supportsStreaming,
      supportsImage: this.supportsImage,
      models: this.getModels()
    };
  }
}

// Provider 설정 상수
const PROVIDER_CONFIG = {
  anthropic: {
    id: 'anthropic',
    name: 'Claude',
    icon: '🤖',
    color: '#D4A574',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyFormat: /^sk-ant-/,
    keyPlaceholder: 'sk-ant-...'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: '🧠',
    color: '#10A37F',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyFormat: /^sk-/,
    keyPlaceholder: 'sk-...'
  },
  google: {
    id: 'google',
    name: 'Google',
    icon: '💎',
    color: '#4285F4',
    docsUrl: 'https://aistudio.google.com/apikey',
    keyFormat: /^AIza/,
    keyPlaceholder: 'AIza...'
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    color: '#F55036',
    docsUrl: 'https://console.groq.com/keys',
    keyFormat: /^gsk_/,
    keyPlaceholder: 'gsk_...'
  },
  stability: {
    id: 'stability',
    name: 'Stability AI',
    icon: '🎨',
    color: '#7C3AED',
    docsUrl: 'https://platform.stability.ai/account/keys',
    keyFormat: /^sk-/,
    keyPlaceholder: 'sk-...'
  }
};

export { LLMProvider, PROVIDER_CONFIG };
