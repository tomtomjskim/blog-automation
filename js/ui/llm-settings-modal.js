/**
 * Blog Automation - LLM Settings Modal
 * LLM Provider/Model 설정 모달
 */

import { store, updateCurrentGeneration } from '../state.js';
import { llmService } from '../services/llm-service.js';
import { modal } from './modal.js';

/**
 * LLM 설정 모달 열기
 * @param {Function} onSave - 저장 후 콜백
 */
export function showLLMSettingsModal(onSave) {
  const { currentGeneration, apiKeys } = store.getState();

  // 사용 가능한 Provider 확인
  const availableProviders = Object.entries(apiKeys)
    .filter(([name, key]) => key && name !== 'stability')
    .map(([name]) => name);

  const allProviders = llmService.getAllProviderInfo();
  const filteredProviders = allProviders.filter(
    p => availableProviders.includes(p.name) && !p.name.includes('stability')
  );

  if (filteredProviders.length === 0) {
    modal.alert({
      title: 'API 키 필요',
      message: 'LLM을 사용하려면 먼저 설정에서 API 키를 등록해주세요.'
    });
    return;
  }

  const content = `
    <div class="llm-settings-modal">
      <p class="llm-settings-desc">글 생성에 사용할 AI 모델을 선택하세요</p>

      <div class="llm-provider-list">
        ${filteredProviders.map(provider => `
          <div class="llm-provider-item ${currentGeneration.provider === provider.name ? 'selected' : ''}"
               data-provider="${provider.name}">
            <div class="llm-provider-info">
              <span class="llm-provider-icon">${provider.icon}</span>
              <div class="llm-provider-details">
                <span class="llm-provider-name">${provider.displayName}</span>
                <span class="llm-provider-desc">${getProviderDescription(provider.name)}</span>
              </div>
              <span class="llm-provider-check">${currentGeneration.provider === provider.name ? '✓' : ''}</span>
            </div>
            <select class="llm-model-select input input-sm" data-provider="${provider.name}"
                    ${currentGeneration.provider !== provider.name ? 'style="display:none"' : ''}>
              ${provider.models.map(model => `
                <option value="${model.id}"
                  ${currentGeneration.model === model.id ? 'selected' : ''}
                  ${model.default && !currentGeneration.model ? 'selected' : ''}>
                  ${model.name}
                </option>
              `).join('')}
            </select>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary modal-cancel">취소</button>
    <button class="btn btn-primary modal-save">적용</button>
  `;

  const modalEl = modal.open({
    title: 'LLM 설정',
    content,
    footer,
    size: 'sm',
    closable: true
  });

  // Provider 선택 이벤트
  modalEl.querySelectorAll('.llm-provider-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // select 클릭 시 이벤트 버블링 방지
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;

      const provider = item.dataset.provider;

      // 선택 상태 업데이트
      modalEl.querySelectorAll('.llm-provider-item').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('.llm-provider-check').textContent = '';
        el.querySelector('.llm-model-select').style.display = 'none';
      });

      item.classList.add('selected');
      item.querySelector('.llm-provider-check').textContent = '✓';
      item.querySelector('.llm-model-select').style.display = 'block';
    });
  });

  // 취소 버튼
  modalEl.querySelector('.modal-cancel').addEventListener('click', () => {
    modal.close();
  });

  // 저장 버튼
  modalEl.querySelector('.modal-save').addEventListener('click', () => {
    const selectedItem = modalEl.querySelector('.llm-provider-item.selected');
    if (selectedItem) {
      const provider = selectedItem.dataset.provider;
      const modelSelect = selectedItem.querySelector('.llm-model-select');
      const model = modelSelect?.value || null;

      updateCurrentGeneration({ provider, model });

      if (onSave) {
        onSave({ provider, model });
      }
    }
    modal.close();
  });

  // 스타일 추가
  addLLMModalStyles();
}

/**
 * Provider 설명 텍스트
 */
function getProviderDescription(name) {
  const descriptions = {
    anthropic: '고품질, 장문 작성에 강함',
    openai: 'GPT-4o, 범용적',
    google: '무료, 빠른 응답',
    groq: '무료, 초고속 추론'
  };
  return descriptions[name] || '';
}

/**
 * 현재 LLM 정보 가져오기
 */
export function getCurrentLLMInfo() {
  const { currentGeneration, apiKeys } = store.getState();
  const allProviders = llmService.getAllProviderInfo();

  const provider = allProviders.find(p => p.name === currentGeneration.provider);
  if (!provider) return null;

  const model = provider.models.find(m => m.id === currentGeneration.model) || provider.models[0];

  return {
    provider: provider,
    model: model,
    hasApiKey: !!apiKeys[currentGeneration.provider]
  };
}

/**
 * LLM 인디케이터 HTML 생성
 * API 키 미설정 시에도 간결하게 표시 (알림 센터에서 경고 처리)
 */
export function renderLLMIndicator() {
  const info = getCurrentLLMInfo();

  if (!info || !info.hasApiKey) {
    return `
      <div class="llm-indicator llm-indicator-compact" id="llm-indicator">
        <span class="llm-indicator-icon">🤖</span>
        <span class="llm-indicator-text">AI 모델 선택</span>
        <button type="button" class="btn btn-sm btn-primary" id="change-llm-btn">
          설정
        </button>
      </div>
    `;
  }

  return `
    <div class="llm-indicator" id="llm-indicator">
      <span class="llm-indicator-icon">${info.provider.icon}</span>
      <div class="llm-indicator-info">
        <span class="llm-indicator-provider">${info.provider.displayName}</span>
        <span class="llm-indicator-model">${info.model.name}</span>
      </div>
      <button type="button" class="btn btn-sm btn-ghost llm-indicator-btn" id="change-llm-btn">
        변경
      </button>
    </div>
  `;
}

/**
 * 스타일 추가
 */
function addLLMModalStyles() {
  if (document.getElementById('llm-modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'llm-modal-styles';
  style.textContent = `
    .llm-settings-modal {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .llm-settings-desc {
      color: var(--text-tertiary);
      font-size: var(--text-sm);
      margin: 0;
    }

    .llm-provider-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .llm-provider-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .llm-provider-item:hover {
      border-color: var(--border-default);
      background-color: var(--bg-secondary);
    }

    .llm-provider-item.selected {
      border-color: var(--primary);
      background-color: var(--primary-light);
    }

    .llm-provider-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .llm-provider-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .llm-provider-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .llm-provider-name {
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }

    .llm-provider-desc {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .llm-provider-check {
      color: var(--primary);
      font-weight: bold;
      font-size: 18px;
      width: 24px;
      text-align: center;
    }

    .llm-model-select {
      margin-top: var(--space-2);
    }

    /* LLM Indicator */
    .llm-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
    }

    .llm-indicator-compact {
      padding: var(--space-2) var(--space-3);
    }

    .llm-indicator-icon {
      font-size: 20px;
    }

    .llm-indicator-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .llm-indicator-provider {
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      font-size: var(--text-sm);
    }

    .llm-indicator-model {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .llm-indicator-text {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .llm-indicator-btn {
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}
