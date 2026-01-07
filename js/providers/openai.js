/**
 * Blog Automation - OpenAI Provider
 */

import { LLMProvider } from './base.js';

class OpenAIProvider extends LLMProvider {
  constructor(apiKey) {
    super(apiKey);
    this.name = 'openai';
    this.displayName = 'OpenAI';
    this.icon = '🧠';
    this.color = '#10A37F';
    this.baseUrl = '/api/proxy/openai';
    this.supportsStreaming = true;
    this.supportsImage = true;

    this.models = {
      'gpt-4o': {
        name: 'GPT-4o',
        description: '가장 강력함, 비용 높음',
        maxTokens: 4096,
        inputCost: 5,
        outputCost: 15,
        tier: 'premium'
      },
      'gpt-4o-mini': {
        name: 'GPT-4o Mini',
        description: '빠르고 저렴함',
        maxTokens: 4096,
        inputCost: 0.15,
        outputCost: 0.6,
        tier: 'standard',
        default: true
      },
      'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        description: '긴 컨텍스트 지원',
        maxTokens: 4096,
        inputCost: 10,
        outputCost: 30,
        tier: 'premium'
      }
    };

    this.imageModels = {
      'dall-e-3': {
        name: 'DALL-E 3',
        description: '고품질 이미지 생성',
        cost: 0.04
      }
    };

    this.defaultModel = 'gpt-4o-mini';
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
      cost: this.calculateCost(model, usage)
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
              provider: this.name
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

  async generateImage(prompt, options = {}) {
    const {
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'standard',
      style = 'natural'
    } = options;

    const { response, duration } = await this.fetchApi(`${this.baseUrl}images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        quality,
        style
      })
    });

    const data = await response.json();

    return {
      url: data.data[0]?.url,
      revisedPrompt: data.data[0]?.revised_prompt,
      provider: this.name,
      model,
      duration
    };
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

export { OpenAIProvider };
