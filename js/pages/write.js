/**
 * Blog Automation - Write Page
 * 새 글 생성 페이지
 */

import { store, updateCurrentGeneration, startLoading, stopLoading, setError, setResult, saveDraft, deleteDraft } from '../state.js';
import { blogGenerator } from '../services/blog-generator.js';
import { imageUploader } from '../services/image-uploader.js';
import { templateManager, TemplateManager } from '../services/template-manager.js';
import { router } from '../core/router.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';
import { TagInput } from '../ui/components.js';
import { createImageUploadZone } from '../ui/image-upload-zone.js';
import { showLLMSettingsModal, renderLLMIndicator } from '../ui/llm-settings-modal.js';

let tagInput = null;
let imageUploadZone = null;
let autoSaveTimeout = null;
let activeTemplateCategory = 'recent';

/**
 * 글 작성 페이지 렌더링
 */
export function renderWritePage() {
  const app = document.getElementById('app');
  const { currentGeneration, settings, apiKeys } = store.getState();

  // 사용 가능한 Provider 확인
  const availableProviders = Object.entries(apiKeys)
    .filter(([name, key]) => key && name !== 'stability')
    .map(([name]) => name);

  const styles = blogGenerator.getStyles();
  const lengths = blogGenerator.getLengthOptions();

  app.innerHTML = `
    <div class="write-page">
      <div class="container container-md">
        <!-- 헤더 -->
        <div class="page-header">
          <div class="page-header-content">
            <h1 class="page-title">✏️ 새 블로그 글 생성</h1>
            <p class="page-description">AI가 주제에 맞는 블로그 글을 자동으로 작성합니다</p>
          </div>
        </div>

        <!-- 템플릿 선택 -->
        ${renderTemplateSection()}

        <!-- 메인 폼 -->
        <form id="generate-form" class="generate-form">
          <!-- LLM 인디케이터 -->
          ${renderLLMIndicator()}

          <!-- 기본 정보 -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">기본 정보</h2>
              <span class="auto-save-indicator"></span>
            </div>
            <div class="card-body">
              <div class="input-group">
                <label class="input-label required">주제</label>
                <input
                  type="text"
                  id="topic"
                  class="input"
                  placeholder="예: 제주도 3박4일 여행 후기"
                  value="${currentGeneration.topic || ''}"
                  required
                >
                <span class="input-hint">블로그 글의 주제를 입력하세요</span>
              </div>

              <div class="input-group mt-4">
                <label class="input-label">키워드</label>
                <div id="keywords-input"></div>
                <span class="input-hint">SEO 최적화를 위한 키워드를 입력하세요 (Enter로 추가)</span>
              </div>
            </div>
          </div>

          <!-- 글 스타일 -->
          <div class="card mt-4">
            <div class="card-header">
              <h2 class="card-title">글 스타일</h2>
            </div>
            <div class="card-body">
              <div class="selection-grid">
                ${styles.map(style => `
                  <div class="selection-card ${currentGeneration.style === style.id ? 'selected' : ''}"
                       data-style="${style.id}">
                    <span class="selection-card-icon">${style.icon}</span>
                    <span class="selection-card-title">${style.name}</span>
                    <span class="selection-card-desc">${style.description}</span>
                  </div>
                `).join('')}
              </div>

              <div class="input-group mt-6">
                <label class="input-label">글 길이</label>
                <div class="radio-group">
                  ${lengths.map(len => `
                    <label class="radio-item">
                      <input
                        type="radio"
                        name="length"
                        class="radio-input"
                        value="${len.id}"
                        ${currentGeneration.length === len.id ? 'checked' : ''}
                      >
                      <span class="radio-label">${len.label}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- 이미지 업로드 -->
          <div class="card mt-4 collapsible" id="image-upload-card">
            <div class="card-header collapsible-header">
              <h2 class="card-title">이미지 (선택)</h2>
              <button type="button" class="btn btn-ghost btn-sm toggle-collapse">
                <span class="collapse-icon">▼</span>
              </button>
            </div>
            <div class="card-body collapsible-content" style="display: none;">
              <div id="image-upload-container"></div>
            </div>
          </div>

          <!-- 추가 정보 (접이식) -->
          <div class="card mt-4 collapsible" id="additional-info-card">
            <div class="card-header collapsible-header">
              <h2 class="card-title">추가 정보 (선택)</h2>
              <button type="button" class="btn btn-ghost btn-sm toggle-collapse">
                <span class="collapse-icon">▼</span>
              </button>
            </div>
            <div class="card-body collapsible-content" style="display: none;">
              <div class="input-group">
                <label class="input-label">참고 URL</label>
                <input
                  type="url"
                  id="reference-url"
                  class="input"
                  placeholder="https://..."
                  value="${currentGeneration.referenceUrl || ''}"
                >
              </div>

              <div class="input-group mt-4">
                <label class="input-label">상세 정보/메모</label>
                <textarea
                  id="additional-info"
                  class="input"
                  placeholder="추가로 포함할 내용을 자유롭게 입력하세요"
                  rows="4"
                >${currentGeneration.additionalInfo || ''}</textarea>
              </div>
            </div>
          </div>

          <!-- 생성 버튼 -->
          ${availableProviders.length > 0 ? `
            <div class="form-actions mt-6">
              <button type="submit" class="btn btn-primary btn-lg w-full" id="generate-btn">
                <span class="btn-icon">✨</span>
                글 생성하기
              </button>
            </div>
          ` : ''}
        </form>

        <!-- 저장된 초안 -->
        ${renderDraftsSection()}
      </div>
    </div>
  `;

  // 이벤트 바인딩
  bindWriteEvents();
  bindTemplateEvents();

  // 태그 입력 초기화
  initTagInput(currentGeneration.keywords || []);

  // 이미지 업로드 초기화
  initImageUpload();

  // 추가 정보에 내용이 있으면 펼치기
  if (currentGeneration.additionalInfo || currentGeneration.referenceUrl) {
    toggleCollapsible(document.getElementById('additional-info-card'), true);
  }

  // 이미지가 있으면 펼치기
  if (imageUploader.count > 0) {
    toggleCollapsible(document.getElementById('image-upload-card'), true);
  }
}

/**
 * 초안 섹션 렌더링
 */
function renderDraftsSection() {
  const { drafts } = store.getState();

  if (drafts.length === 0) return '';

  return `
    <div class="card mt-6">
      <div class="card-header">
        <h2 class="card-title">저장된 초안 (${drafts.length})</h2>
        <button class="btn btn-ghost btn-sm" id="clear-drafts">전체 삭제</button>
      </div>
      <div class="card-body">
        <div class="drafts-list">
          ${drafts.map(draft => `
            <div class="draft-item" data-id="${draft.id}">
              <div class="draft-content">
                <h4 class="draft-title">${draft.topic || '제목 없음'}</h4>
                <div class="draft-meta">
                  <span>${formatRelativeTime(draft.savedAt)}</span>
                  <span>·</span>
                  <span>${getStyleName(draft.style)}</span>
                </div>
              </div>
              <div class="draft-actions">
                <button class="btn btn-sm btn-secondary restore-draft">복원</button>
                <button class="btn btn-sm btn-ghost delete-draft">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * 이벤트 바인딩
 */
function bindWriteEvents() {
  const form = document.getElementById('generate-form');

  // 폼 제출
  form?.addEventListener('submit', handleGenerate);

  // 스타일 선택
  document.querySelectorAll('.selection-card[data-style]').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.selection-card[data-style]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      updateCurrentGeneration({ style: card.dataset.style });
      scheduleAutoSave();
    });
  });

  // 길이 선택
  document.querySelectorAll('input[name="length"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateCurrentGeneration({ length: radio.value });
      scheduleAutoSave();
    });
  });

  // LLM 설정 모달 열기
  document.getElementById('change-llm-btn')?.addEventListener('click', () => {
    showLLMSettingsModal(() => {
      // 모달에서 선택 후 인디케이터 업데이트
      const indicator = document.getElementById('llm-indicator');
      if (indicator) {
        indicator.outerHTML = renderLLMIndicator();
        // 새 인디케이터에 이벤트 재바인딩
        document.getElementById('change-llm-btn')?.addEventListener('click', () => {
          showLLMSettingsModal(() => {
            renderWritePage();
          });
        });
      }
    });
  });

  // 접이식 토글 - 헤더 전체 클릭 가능
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      toggleCollapsible(header.closest('.collapsible'));
    });
  });

  // 입력 필드 자동 저장
  ['topic', 'reference-url', 'additional-info'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      const stateKey = id === 'topic' ? 'topic' :
                       id === 'reference-url' ? 'referenceUrl' : 'additionalInfo';

      updateCurrentGeneration({ [stateKey]: e.target.value });
      scheduleAutoSave();
    });
  });

  // 초안 관련 이벤트
  document.getElementById('clear-drafts')?.addEventListener('click', handleClearDrafts);

  document.querySelectorAll('.restore-draft').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.draft-item').dataset.id;
      handleRestoreDraft(id);
    });
  });

  document.querySelectorAll('.delete-draft').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.draft-item').dataset.id;
      handleDeleteDraft(id);
    });
  });
}

/**
 * 태그 입력 초기화
 */
function initTagInput(initialTags) {
  const container = document.getElementById('keywords-input');
  if (!container) return;

  tagInput = new TagInput(container, {
    initialTags,
    placeholder: '키워드 입력 후 Enter',
    maxTags: 10,
    onChange: (tags) => {
      updateCurrentGeneration({ keywords: tags });
      scheduleAutoSave();
    }
  });
}

/**
 * 이미지 업로드 초기화
 */
function initImageUpload() {
  const container = document.getElementById('image-upload-container');
  if (!container) return;

  // 기존 인스턴스 정리
  if (imageUploadZone) {
    imageUploadZone.destroy();
  }

  imageUploadZone = createImageUploadZone(container, {
    onUpload: (image) => {
      // 이미지 업로드 시 카드 펼치기
      toggleCollapsible(document.getElementById('image-upload-card'), true);
    },
    onChange: (images) => {
      // 이미지 변경 시 상태 업데이트
      updateCurrentGeneration({ images: images.map(img => img.id) });
    }
  });
}

/**
 * 접이식 토글
 */
function toggleCollapsible(card, forceOpen = null) {
  const content = card.querySelector('.collapsible-content');
  const icon = card.querySelector('.collapse-icon');

  const isOpen = forceOpen !== null ? !forceOpen : content.style.display !== 'none';

  content.style.display = isOpen ? 'none' : 'block';
  icon.textContent = isOpen ? '▼' : '▲';
}

/**
 * 글 생성 핸들러
 */
async function handleGenerate(e) {
  e.preventDefault();

  const { currentGeneration, apiKeys } = store.getState();

  // 유효성 검사
  if (!currentGeneration.topic.trim()) {
    toast.error('주제를 입력해주세요');
    document.getElementById('topic').focus();
    return;
  }

  if (!apiKeys[currentGeneration.provider]) {
    toast.error('선택한 LLM의 API 키가 설정되지 않았습니다');
    return;
  }

  // 버튼 상태 변경
  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 생성 중...';

  startLoading('AI가 글을 작성하고 있습니다...');

  try {
    // 스트리밍 생성
    let fullContent = '';
    let result = null;

    for await (const chunk of blogGenerator.generateStream(currentGeneration)) {
      if (chunk.type === 'delta') {
        fullContent += chunk.content;
        // 스트리밍 UI 업데이트 (선택적)
      } else if (chunk.type === 'done') {
        result = chunk;
      }
    }

    if (result) {
      setResult(result);
      toast.success('글이 생성되었습니다!');
      router.navigate('result');
    }
  } catch (error) {
    console.error('Generation error:', error);
    setError(error.message);
    toast.error(error.message || '글 생성에 실패했습니다');
  } finally {
    stopLoading();
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">✨</span> 글 생성하기';
  }
}

/**
 * 자동 저장 스케줄
 */
function scheduleAutoSave() {
  const { settings } = store.getState();
  if (!settings?.ui?.autoSave) return;

  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    const { currentGeneration } = store.getState();

    if (currentGeneration.topic) {
      saveDraft({
        topic: currentGeneration.topic,
        keywords: currentGeneration.keywords,
        style: currentGeneration.style,
        length: currentGeneration.length,
        additionalInfo: currentGeneration.additionalInfo,
        referenceUrl: currentGeneration.referenceUrl,
        provider: currentGeneration.provider
      });

      // 저장 표시 업데이트
      const indicator = document.querySelector('.auto-save-indicator');
      if (indicator) {
        indicator.textContent = `저장됨 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
        indicator.classList.add('saved');
        setTimeout(() => indicator.classList.remove('saved'), 2000);
      }
    }
  }, 2000);
}

/**
 * 초안 복원
 */
function handleRestoreDraft(id) {
  const { drafts } = store.getState();
  const draft = drafts.find(d => d.id === id);

  if (draft) {
    updateCurrentGeneration({
      topic: draft.topic || '',
      keywords: draft.keywords || [],
      style: draft.style || 'casual',
      length: draft.length || 'medium',
      additionalInfo: draft.additionalInfo || '',
      referenceUrl: draft.referenceUrl || '',
      provider: draft.provider || 'anthropic'
    });

    toast.success('초안이 복원되었습니다');
    renderWritePage();
  }
}

/**
 * 초안 삭제
 */
function handleDeleteDraft(id) {
  deleteDraft(id);
  toast.success('초안이 삭제되었습니다');
  renderWritePage();
}

/**
 * 전체 초안 삭제
 */
async function handleClearDrafts() {
  const confirmed = await modal.confirm({
    title: '초안 전체 삭제',
    message: '모든 저장된 초안을 삭제하시겠습니까?',
    confirmText: '삭제',
    danger: true
  });

  if (confirmed) {
    const { drafts } = store.getState();
    drafts.forEach(d => deleteDraft(d.id));
    toast.success('모든 초안이 삭제되었습니다');
    renderWritePage();
  }
}

/**
 * 상대 시간 포맷
 */
function formatRelativeTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return d.toLocaleDateString('ko-KR');
}

/**
 * 스타일 이름 반환
 */
function getStyleName(styleId) {
  const styles = {
    casual: '일상형',
    informative: '정보형',
    review: '리뷰형',
    marketing: '마케팅형',
    story: '스토리형'
  };
  return styles[styleId] || styleId;
}

/**
 * 템플릿 섹션 렌더링
 */
function renderTemplateSection() {
  const categories = TemplateManager.getCategories();
  const templates = templateManager.getByCategory(activeTemplateCategory);

  return `
    <div class="card template-section mb-4">
      <div class="card-header">
        <h2 class="card-title">템플릿으로 시작하기</h2>
      </div>
      <div class="card-body">
        <!-- 카테고리 탭 -->
        <div class="template-categories">
          ${categories.map(cat => `
            <button class="template-category-tab ${activeTemplateCategory === cat.id ? 'active' : ''}"
                    data-category="${cat.id}">
              ${cat.icon} ${cat.name}
            </button>
          `).join('')}
        </div>

        <!-- 템플릿 목록 -->
        <div class="template-list">
          ${templates.length > 0 ? templates.map(t => `
            <div class="template-card" data-template-id="${t.id}">
              <span class="template-emoji">${t.emoji}</span>
              <div class="template-info">
                <span class="template-name">${t.name}</span>
                <span class="template-desc">${t.description}</span>
              </div>
              ${t.usageCount ? `<span class="template-usage">${t.usageCount}회</span>` : ''}
            </div>
          `).join('') : `
            <div class="template-empty">
              ${activeTemplateCategory === 'recent' ? '최근 사용한 템플릿이 없습니다' :
                activeTemplateCategory === 'custom' ? '저장된 템플릿이 없습니다' :
                '이 카테고리에 템플릿이 없습니다'}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * 템플릿 이벤트 바인딩
 */
function bindTemplateEvents() {
  // 카테고리 탭 클릭
  document.querySelectorAll('.template-category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTemplateCategory = tab.dataset.category;
      // 템플릿 섹션만 다시 렌더링
      const templateSection = document.querySelector('.template-section');
      if (templateSection) {
        templateSection.outerHTML = renderTemplateSection();
        bindTemplateEvents();
      }
    });
  });

  // 템플릿 카드 클릭
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const templateId = card.dataset.templateId;
      showTemplateModal(templateId);
    });
  });
}

/**
 * 템플릿 적용 모달
 */
function showTemplateModal(templateId) {
  const template = templateManager.get(templateId);
  if (!template) return;

  const hasVariables = template.variables && Object.keys(template.variables).length > 0;

  // 변수가 없으면 바로 적용
  if (!hasVariables) {
    applyTemplate(templateId, {});
    return;
  }

  // 변수 입력 모달 표시
  const modalHtml = `
    <div class="modal-overlay template-modal-overlay">
      <div class="modal template-modal">
        <div class="modal-header">
          <h3>${template.emoji} ${template.name}</h3>
          <button class="btn btn-ghost btn-sm modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">${template.description}</p>
          <form id="template-form" class="template-variables-form">
            ${Object.entries(template.variables).map(([key, v]) => `
              <div class="input-group">
                <label class="input-label">${v.label}</label>
                <input type="text" class="input" name="${key}" placeholder="${v.placeholder || ''}" required>
              </div>
            `).join('')}
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close">취소</button>
          <button class="btn btn-primary" id="apply-template-btn">적용하기</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay = document.querySelector('.template-modal-overlay');
  const form = document.getElementById('template-form');

  // 닫기 버튼
  overlay.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => overlay.remove());
  });

  // 오버레이 클릭으로 닫기
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // 적용 버튼
  document.getElementById('apply-template-btn').addEventListener('click', () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const variables = Object.fromEntries(formData);

    overlay.remove();
    applyTemplate(templateId, variables);
  });

  // 엔터키로 제출
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('apply-template-btn').click();
    }
  });

  // 첫 번째 입력 필드에 포커스
  form.querySelector('input')?.focus();
}

/**
 * 템플릿 적용
 */
function applyTemplate(templateId, variables) {
  try {
    const applied = templateManager.apply(templateId, variables);

    updateCurrentGeneration({
      topic: applied.topic,
      keywords: applied.keywords.filter(k => !k.includes('{{')), // 미치환 변수 제거
      style: applied.style,
      length: applied.length,
      provider: applied.provider
    });

    toast.success(`"${applied.templateName}" 템플릿이 적용되었습니다`);
    renderWritePage();
  } catch (error) {
    toast.error(error.message);
  }
}
