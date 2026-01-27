/**
 * Blog Automation - Groq Provider
 * 무료, 초고속 LLM
 */

import { LLMProvider } from './base.js';

class GroqProvider extends LLMProvider {
  constructor(apiKey) {
    super(apiKey);
    this.name = 'groq';
    this.displayName = 'Groq';
    this.icon = '⚡';
    this.color = '#F55036';
    this.baseUrl = '/api/proxy/groq/';
    this.supportsStreaming = true;
    this.supportsImage = false;

    this.models = {
      'llama-3.3-70b-versatile': {
        name: 'Llama 3.3 70B',
        description: '최신 무료 모델, 고성능',
        maxTokens: 8000,
        inputCost: 0,
        outputCost: 0,
        tier: 'free',
        default: true
      },
      'llama-3.1-70b-versatile': {
        name: 'Llama 3.1 70B',
        description: '무료, 고성능',
        maxTokens: 8000,
        inputCost: 0,
        outputCost: 0,
        tier: 'free'
      },
      'llama-3.1-8b-instant': {
        name: 'Llama 3.1 8B',
        description: '무료, 초고속',
        maxTokens: 8000,
        inputCost: 0,
        outputCost: 0,
        tier: 'free'
      },
      'mixtral-8x7b-32768': {
        name: 'Mixtral 8x7B',
        description: '무료, 긴 컨텍스트',
        maxTokens: 32768,
        inputCost: 0,
        outputCost: 0,
        tier: 'free'
      },
      'gemma2-9b-it': {
        name: 'Gemma 2 9B',
        description: '무료, 균형 잡힌 성능',
        maxTokens: 8192,
        inputCost: 0,
        outputCost: 0,
        tier: 'free'
      }
    };

    this.defaultModel = 'llama-3.3-70b-versatile';
  }

  async generateText(prompt, options = {}) {
    const {
      model = this.defaultModel,
      maxTokens = 2000,
      temperature = 0.7,
      systemPrompt = ''
    } = options;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const { response, duration } = await this.fetchApi(`${this.baseUrl}chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature
      })
    });

    const data = await response.json();

    const usage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0
    };

    return {
      content: data.choices[0]?.message?.content || '',
      usage,
      model: data.model,
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

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.baseUrl}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(this.handleHttpError(response.status, error).message);
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
          if (data === '[DONE]') {
            yield {
              type: 'done',
              content: totalContent,
              model,
              provider: this.name,
              cost: { input: 0, output: 0, total: 0, currency: 'USD' }
            };
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content || '';
            if (delta) {
              totalContent += delta;
              yield { type: 'delta', content: delta };
            }
          } catch (e) {
            // JSON 파싱 실패 무시
          }
        }
      }
    }
  }

  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export { GroqProvider };
