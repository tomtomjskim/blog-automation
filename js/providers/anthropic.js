/**
 * Blog Automation - Anthropic (Claude) Provider
 */

import { LLMProvider } from './base.js';

class AnthropicProvider extends LLMProvider {
  constructor(apiKey) {
    super(apiKey);
    this.name = 'anthropic';
    this.displayName = 'Claude';
    this.icon = '🤖';
    this.color = '#D4A574';
    this.baseUrl = '/api/proxy/anthropic';
    this.supportsStreaming = true;
    this.supportsImage = false;

    this.models = {
      'claude-opus-4-5-20250415': {
        name: 'Claude Opus 4.5',
        description: '최상위 모델, Extended Thinking 지원',
        maxTokens: 16384,
        inputCost: 15,
        outputCost: 75,
        tier: 'premium'
      },
      'claude-sonnet-4-20250514': {
        name: 'Claude Sonnet 4',
        description: '균형 잡힌 성능, 일반 블로그에 권장',
        maxTokens: 8192,
        inputCost: 3,
        outputCost: 15,
        tier: 'standard',
        default: true
      },
      'claude-3-5-sonnet-20241022': {
        name: 'Claude 3.5 Sonnet',
        description: '자연스러운 문체, 긴 글 작성에 적합',
        maxTokens: 8192,
        inputCost: 3,
        outputCost: 15,
        tier: 'standard'
      },
      'claude-3-haiku-20240307': {
        name: 'Claude 3 Haiku',
        description: '매우 빠름, 저렴',
        maxTokens: 4096,
        inputCost: 0.25,
        outputCost: 1.25,
        tier: 'economy'
      }
    };

    this.defaultModel = 'claude-sonnet-4-20250514';
  }

  async generateText(prompt, options = {}) {
    const {
      model = this.defaultModel,
      maxTokens = 4000,
      temperature = 0.7,
      systemPrompt = ''
    } = options;

    const { response, duration } = await this.fetchApi(this.baseUrl, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    const usage = {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    };

    return {
      content: data.content[0]?.text || '',
      usage,
      model: data.model,
      provider: this.name,
      duration,
      cost: this.calculateCost(model, usage)
    };
  }

  async *generateTextStream(prompt, options = {}) {
    const {
      model = this.defaultModel,
      maxTokens = 4000,
      temperature = 0.7,
      systemPrompt = ''
    } = options;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
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
    let usage = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text || '';
              totalContent += text;
              yield { type: 'delta', content: text };
            } else if (parsed.type === 'message_delta') {
              usage = {
                promptTokens: parsed.usage?.input_tokens || 0,
                completionTokens: parsed.usage?.output_tokens || 0,
                totalTokens: (parsed.usage?.input_tokens || 0) + (parsed.usage?.output_tokens || 0)
              };
            } else if (parsed.type === 'message_stop') {
              yield {
                type: 'done',
                content: totalContent,
                usage,
                model,
                provider: this.name,
                cost: usage ? this.calculateCost(model, usage) : null
              };
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
      const { response } = await this.fetchApi(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export { AnthropicProvider };
