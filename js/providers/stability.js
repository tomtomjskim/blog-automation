/**
 * Blog Automation - Stability AI Provider
 * 이미지 생성 전용
 */

import { LLMProvider } from './base.js';

class StabilityProvider extends LLMProvider {
  constructor(apiKey) {
    super(apiKey);
    this.name = 'stability';
    this.displayName = 'Stability AI';
    this.icon = '🎨';
    this.color = '#7C3AED';
    this.baseUrl = '/api/proxy/stability';
    this.supportsStreaming = false;
    this.supportsImage = true;

    this.models = {
      'sd3-large': {
        name: 'Stable Diffusion 3 Large',
        description: '최고 품질, 8B 파라미터',
        cost: 0.065
      },
      'sd3-medium': {
        name: 'Stable Diffusion 3 Medium',
        description: '균형 잡힌 품질',
        cost: 0.035
      },
      'sd3-large-turbo': {
        name: 'SD3 Large Turbo',
        description: '빠른 생성',
        cost: 0.04
      },
      'stable-image-core': {
        name: 'Stable Image Core',
        description: '일반 이미지 생성',
        cost: 0.03,
        default: true
      },
      'stable-image-ultra': {
        name: 'Stable Image Ultra',
        description: '최고 품질 이미지',
        cost: 0.08
      }
    };

    this.defaultModel = 'stable-image-core';

    this.aspectRatios = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3',
      '3:4': '3:4',
      '21:9': '21:9'
    };

    this.stylePresets = [
      'photographic',
      'digital-art',
      'anime',
      'cinematic',
      'comic-book',
      'fantasy-art',
      'line-art',
      'neon-punk',
      '3d-model',
      'pixel-art'
    ];
  }

  async generateText() {
    throw new Error('Stability AI does not support text generation');
  }

  async generateImage(prompt, options = {}) {
    const {
      model = this.defaultModel,
      aspectRatio = '16:9',
      outputFormat = 'png',
      style = 'photographic',
      negativePrompt = ''
    } = options;

    // FormData 생성
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('aspect_ratio', aspectRatio);
    formData.append('output_format', outputFormat);

    if (style && this.stylePresets.includes(style)) {
      formData.append('style_preset', style);
    }

    if (negativePrompt) {
      formData.append('negative_prompt', negativePrompt);
    }

    const startTime = performance.now();

    // 모델에 따라 다른 엔드포인트 사용
    let endpoint;
    if (model.startsWith('sd3')) {
      endpoint = `${this.baseUrl}stable-image/generate/sd3`;
    } else if (model === 'stable-image-ultra') {
      endpoint = `${this.baseUrl}stable-image/generate/ultra`;
    } else {
      endpoint = `${this.baseUrl}stable-image/generate/core`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'image/*'
      },
      body: formData
    });

    const duration = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.errors?.[0]?.message || 'Unknown error';
      } catch {
        errorMessage = `HTTP ${response.status}`;
      }
      throw new Error(`이미지 생성 실패: ${errorMessage}`);
    }

    // 이미지 blob 처리
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Base64로도 변환 (저장용)
    const base64 = await this.blobToBase64(blob);

    return {
      url,
      blob,
      base64,
      format: outputFormat,
      provider: this.name,
      model,
      duration,
      cost: {
        total: this.models[model]?.cost || 0,
        currency: 'USD'
      }
    };
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}user/account`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getAspectRatios() {
    return Object.entries(this.aspectRatios).map(([key, value]) => ({
      id: key,
      value,
      label: key
    }));
  }

  getStylePresets() {
    return this.stylePresets.map(style => ({
      id: style,
      label: style.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    }));
  }
}

export { StabilityProvider };
