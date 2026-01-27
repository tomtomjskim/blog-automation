/**
 * Blog Automation - Prompt Result Modal
 * 생성된 프롬프트를 표시하는 모달
 */

import { modal } from './modal.js';
import { toast } from './toast.js';

/**
 * 프롬프트 결과 모달 표시
 * @param {Object} options
 * @param {string} options.systemPrompt - 시스템 프롬프트
 * @param {string} options.userPrompt - 사용자 프롬프트
 * @param {Function} options.onGenerate - "이 프롬프트로 글 작성하기" 콜백
 */
export function showPromptResultModal({ systemPrompt, userPrompt, onGenerate }) {
  const combinedPrompt = `[시스템 프롬프트]\n${systemPrompt}\n\n[사용자 프롬프트]\n${userPrompt}`;
  
  const content = `
    <div class="prompt-result">
      <div class="prompt-result-tabs">
        <button class="prompt-tab active" data-tab="combined">전체 프롬프트</button>
        <button class="prompt-tab" data-tab="system">시스템 프롬프트</button>
        <button class="prompt-tab" data-tab="user">사용자 프롬프트</button>
      </div>
      
      <div class="prompt-result-content">
        <div class="prompt-tab-content active" data-content="combined">
          <pre class="prompt-text">${escapeHtml(combinedPrompt)}</pre>
        </div>
        <div class="prompt-tab-content" data-content="system">
          <pre class="prompt-text">${escapeHtml(systemPrompt)}</pre>
        </div>
        <div class="prompt-tab-content" data-content="user">
          <pre class="prompt-text">${escapeHtml(userPrompt)}</pre>
        </div>
      </div>
      
      <div class="prompt-hint">
        <span class="hint-icon">💡</span>
        <span class="hint-text">이 프롬프트를 ChatGPT, Claude 등에 붙여넣어 글을 생성하세요.</span>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary modal-close-btn">닫기</button>
    <button class="btn btn-ghost copy-prompt-btn">
      <span class="btn-icon">📋</span>
      복사
    </button>
    <button class="btn btn-primary generate-with-prompt-btn">
      <span class="btn-icon">✨</span>
      이 프롬프트로 글 작성하기
    </button>
  `;

  const modalEl = modal.open({
    title: '📋 생성된 프롬프트',
    content,
    footer,
    size: 'lg',
    closable: true
  });

  // 탭 전환 이벤트
  modalEl.querySelectorAll('.prompt-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // 탭 활성화
      modalEl.querySelectorAll('.prompt-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 컨텐츠 전환
      modalEl.querySelectorAll('.prompt-tab-content').forEach(c => c.classList.remove('active'));
      modalEl.querySelector(`.prompt-tab-content[data-content="${tabName}"]`).classList.add('active');
    });
  });

  // 닫기 버튼
  modalEl.querySelector('.modal-close-btn').addEventListener('click', () => {
    modal.close();
  });

  // 복사 버튼
  modalEl.querySelector('.copy-prompt-btn').addEventListener('click', async () => {
    const activeTab = modalEl.querySelector('.prompt-tab.active').dataset.tab;
    let textToCopy;
    
    if (activeTab === 'combined') {
      textToCopy = combinedPrompt;
    } else if (activeTab === 'system') {
      textToCopy = systemPrompt;
    } else {
      textToCopy = userPrompt;
    }
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('프롬프트가 복사되었습니다!');
      
      // 버튼 피드백
      const btn = modalEl.querySelector('.copy-prompt-btn');
      btn.innerHTML = '<span class="btn-icon">✓</span> 복사됨';
      setTimeout(() => {
        btn.innerHTML = '<span class="btn-icon">📋</span> 복사';
      }, 2000);
    } catch (err) {
      toast.error('복사에 실패했습니다');
    }
  });

  // "이 프롬프트로 글 작성하기" 버튼
  modalEl.querySelector('.generate-with-prompt-btn').addEventListener('click', () => {
    modal.close();
    if (onGenerate) {
      onGenerate();
    }
  });

  // 스타일 추가
  addPromptModalStyles();
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 프롬프트 모달 스타일 추가
 */
function addPromptModalStyles() {
  if (document.getElementById('prompt-modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'prompt-modal-styles';
  style.textContent = `
    .prompt-result {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .prompt-result-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-light, #E5E8EB);
      padding-bottom: 12px;
    }

    .prompt-tab {
      padding: 8px 16px;
      background: none;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-secondary, #6B7684);
      transition: all 0.15s ease;
    }

    .prompt-tab:hover {
      background-color: var(--bg-tertiary, #F2F4F6);
      color: var(--text-primary, #191F28);
    }

    .prompt-tab.active {
      background-color: var(--primary, #3B82F6);
      color: white;
    }

    .prompt-result-content {
      position: relative;
    }

    .prompt-tab-content {
      display: none;
    }

    .prompt-tab-content.active {
      display: block;
    }

    .prompt-text {
      background-color: var(--bg-tertiary, #F2F4F6);
      border: 1px solid var(--border-light, #E5E8EB);
      border-radius: 12px;
      padding: 16px;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 400px;
      overflow-y: auto;
      color: var(--text-primary, #191F28);
      font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
    }

    .prompt-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: var(--bg-info, #EFF6FF);
      border-radius: 8px;
      color: var(--text-info, #1D4ED8);
      font-size: 14px;
    }

    .hint-icon {
      font-size: 18px;
    }

    .modal-footer .copy-prompt-btn {
      margin-right: auto;
    }

    @media (max-width: 480px) {
      .prompt-result-tabs {
        flex-wrap: wrap;
      }

      .prompt-tab {
        flex: 1;
        min-width: calc(50% - 4px);
        text-align: center;
        padding: 10px 8px;
      }

      .prompt-text {
        max-height: 300px;
        font-size: 12px;
      }

      .modal-footer {
        flex-wrap: wrap;
        gap: 8px;
      }

      .modal-footer .btn {
        flex: 1;
        min-width: calc(50% - 4px);
      }

      .modal-footer .copy-prompt-btn {
        margin-right: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
