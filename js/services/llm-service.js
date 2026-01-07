/**
 * Blog Automation - LLM Service
 * 통합 LLM 서비스
 */

import { AnthropicProvider } from '../providers/anthropic.js';
import { OpenAIProvider } from '../providers/openai.js';
import { GoogleProvider } from '../providers/google.js';
import { GroqProvider } from '../providers/groq.js';
import { StabilityProvider } from '../providers/stability.js';
import { storage } from '../core/storage.js';
import { eventBus, EVENT_TYPES } from '../core/events.js';

class LLMService {
  constructor() {
    this.providers = new Map();
    this.providerClasses = {
      anthropic: AnthropicProvider,
      openai: OpenAIProvider,
      google: GoogleProvider,
      groq: GroqProvider,
      stability: StabilityProvider
    };
  }

  /**
   * Provider 초기화 (API 키로)
   */
  initProvider(name, apiKey) {
    const ProviderClass = this.providerClasses[name];
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${name}`);
    }

    const provider = new ProviderClass(apiKey);
    this.providers.set(name, provider);
    return provider;
  }

  /**
   * 저장된 API 키로 모든 Provider 초기화
   */
  async initFromStorage(apiKeys) {
    Object.entries(apiKeys).forEach(([name, apiKey]) => {
      if (apiKey) {
        this.initProvider(name, apiKey);
      }
    });
  }

  /**
   * Provider 가져오기
   */
  getProvider(name) {
    return this.providers.get(name);
  }

  /**
   * 활성화된 Provider 목록
   */
  getActiveProviders() {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      ...provider.getInfo()
    }));
  }

  /**
   * 텍스트 지원 Provider 목록
   */
  getTextProviders() {
    return this.getActiveProviders().filter(p => !p.supportsImage || p.supportsStreaming);
  }

  /**
   * 이미지 지원 Provider 목록
   */
  getImageProviders() {
    return this.getActiveProviders().filter(p => p.supportsImage);
  }

  /**
   * 텍스트 생성
   */
  async generateText(providerName, prompt, options = {}) {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider "${providerName}" not initialized. API 키를 설정해주세요.`);
    }

    eventBus.emit(EVENT_TYPES.GENERATE_START, { provider: providerName, options });

    try {
      const result = await provider.generateText(prompt, options);

      // 사용량 추적
      storage.trackUsage({
        provider: providerName,
        usage: result.usage,
        cost: result.cost
      });

      eventBus.emit(EVENT_TYPES.GENERATE_COMPLETE, result);
      return result;
    } catch (error) {
      eventBus.emit(EVENT_TYPES.GENERATE_ERROR, { provider: providerName, error: error.message });
      throw error;
    }
  }

  /**
   * 스트리밍 텍스트 생성
   */
  async *generateTextStream(providerName, prompt, options = {}) {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider "${providerName}" not initialized. API 키를 설정해주세요.`);
    }

    if (!provider.supportsStreaming) {
      throw new Error(`Provider "${providerName}" does not support streaming`);
    }

    eventBus.emit(EVENT_TYPES.GENERATE_START, { provider: providerName, options, streaming: true });

    try {
      for await (const chunk of provider.generateTextStream(prompt, options)) {
        if (chunk.type === 'delta') {
          eventBus.emit(EVENT_TYPES.GENERATE_STREAM, chunk);
          yield chunk;
        } else if (chunk.type === 'done') {
          // 사용량 추적
          if (chunk.usage) {
            storage.trackUsage({
              provider: providerName,
              usage: chunk.usage,
              cost: chunk.cost
            });
          }

          eventBus.emit(EVENT_TYPES.GENERATE_COMPLETE, chunk);
          yield chunk;
        }
      }
    } catch (error) {
      eventBus.emit(EVENT_TYPES.GENERATE_ERROR, { provider: providerName, error: error.message });
      throw error;
    }
  }

  /**
   * 이미지 생성
   */
  async generateImage(providerName, prompt, options = {}) {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider "${providerName}" not initialized. API 키를 설정해주세요.`);
    }

    if (!provider.supportsImage) {
      throw new Error(`Provider "${providerName}" does not support image generation`);
    }

    eventBus.emit(EVENT_TYPES.IMAGE_START, { provider: providerName, options });

    try {
      const result = await provider.generateImage(prompt, options);

      // 사용량 추적
      storage.trackUsage({
        provider: providerName,
        type: 'image',
        cost: result.cost
      });

      eventBus.emit(EVENT_TYPES.IMAGE_COMPLETE, result);
      return result;
    } catch (error) {
      eventBus.emit(EVENT_TYPES.IMAGE_ERROR, { provider: providerName, error: error.message });
      throw error;
    }
  }

  /**
   * API 키 검증
   */
  async validateApiKey(providerName, apiKey) {
    const ProviderClass = this.providerClasses[providerName];
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    const tempProvider = new ProviderClass(apiKey);
    return tempProvider.validateApiKey();
  }

  /**
   * Fallback으로 텍스트 생성
   */
  async generateTextWithFallback(prompt, options = {}, preferredProviders = []) {
    const providers = preferredProviders.length > 0
      ? preferredProviders
      : ['anthropic', 'groq', 'google', 'openai'];

    for (const providerName of providers) {
      if (!this.providers.has(providerName)) continue;

      try {
        const result = await this.generateText(providerName, prompt, options);
        return { ...result, usedProvider: providerName };
      } catch (error) {
        console.warn(`Provider ${providerName} failed:`, error.message);

        // Rate limit이나 서버 에러면 다음 provider로
        if (error.message.includes('한도') ||
            error.message.includes('서버') ||
            error.message.includes('Rate')) {
          continue;
        }

        // 다른 에러는 throw
        throw error;
      }
    }

    throw new Error('사용 가능한 LLM이 없습니다. API 키를 확인해주세요.');
  }

  /**
   * Provider 모델 목록 가져오기
   */
  getProviderModels(providerName) {
    const provider = this.getProvider(providerName);
    return provider ? provider.getModels() : [];
  }

  /**
   * 모든 Provider 정보
   */
  getAllProviderInfo() {
    return Object.entries(this.providerClasses).map(([name, ProviderClass]) => {
      const instance = new ProviderClass('');
      return {
        name,
        ...instance.getInfo(),
        initialized: this.providers.has(name)
      };
    });
  }
}

// 싱글톤 인스턴스
const llmService = new LLMService();

export { llmService, LLMService };
