/**
 * Blog Automation - Google (Gemini) Provider
 */

import { LLMProvider } from './base.js';

class GoogleProvider extends LLMProvider {
  constructor(apiKey) {
    super(apiKey);
    this.name = 'google';
    this.displayName = 'Google';
    this.icon = '💎';
    this.color = '#4285F4';
    this.baseUrl = '/api/proxy/google';
    this.supportsStreaming = true;
    this.supportsImage = false;

    this.models = {
      'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro',
        description: '긴 컨텍스트 지원, 강력한 추론',
        maxTokens: 8192,
        inputCost: 0,
        outputCost: 0,
        tier: 'premium'
      },
      'gemini-1.5-flash': {
        name: 'Gemini 1.5 Flash',
        description: '빠르고 무료',
        maxTokens: 8192,
        inputCost: 0,
        outputCost: 0,
        tier: 'free',
        default: true
      },
      'gemini-2.0-flash-exp': {
        name: 'Gemini 2.0 Flash',
        description: '최신 실험 모델',
        maxTokens: 8192,
        inputCost: 0,
        outputCost: 0,
        tier: 'experimental'
      }
    };

    this.defaultModel = 'gemini-1.5-flash';
  }

  async generateText(prompt, options = {}) {
    const {
      model = this.defaultModel,
      maxTokens = 2000,
      temperature = 0.7,
      systemPrompt = ''
    } = options;

    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const url = `${this.baseUrl}models/${model}:generateContent?key=${this.apiKey}`;

    const { response, duration } = await this.fetchApi(url, {
      method: 'POST',
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      })
    });

    const data = await response.json();

    // 에러 체크
    if (data.error) {
      throw new Error(data.error.message || 'Google API error');
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0
    };

    return {
      content,
      usage,
      model,
      provider: this.name,
      duration,
      cost: { input: 0, output: 0, total: 0, currency: 'USD' }
    };
  }

  async *generateTextStream(prompt, options = {}) {
    const {
      model = this.defaultModel,
      maxTokens = 2000,
      temperature = 0.7,
      systemPrompt = ''
    } = options;

    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const url = `${this.baseUrl}models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Google API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              totalContent += text;
              yield { type: 'delta', content: text };
            }
          } catch (e) {
            // JSON 파싱 실패 무시
          }
        }
      }
    }

    yield {
      type: 'done',
      content: totalContent,
      model,
      provider: this.name,
      cost: { input: 0, output: 0, total: 0, currency: 'USD' }
    };
  }

  async validateApiKey() {
    try {
      const url = `${this.baseUrl}models?key=${this.apiKey}`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export { GoogleProvider };
