/**
 * Blog Automation - Result Page
 * 생성 결과 미리보기 페이지
 */

import { store, updateCurrentGeneration, setResult } from '../state.js';
import { blogGenerator } from '../services/blog-generator.js';
import { naverBlogService } from '../services/naver-blog.js';
import { contentImageManager } from '../services/content-image-manager.js';
import { imageUploader } from '../services/image-uploader.js';
import { showScheduleModal } from './schedule.js';
import { router } from '../core/router.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';
import { copyToClipboard } from '../ui/components.js';

let isEditing = false;
let editedContent = '';
let imageInsertModalOpen = false;

/**
 * 결과 페이지 렌더링
 */
export function renderResultPage() {
  const app = document.getElementById('app');
  const { result, naverBlog } = store.getState();

  if (!result) {
    router.navigate('home');
    return;
  }

  const seoAnalysis = blogGenerator.analyzeSEO(result.content, result.keywords);

  app.innerHTML = `
    <div class="result-page">
      <div class="container container-md">
        <!-- 헤더 -->
        <div class="page-header">
          <div class="page-header-content">
            <h1 class="page-title">📄 생성 결과</h1>
            <p class="page-description">생성된 글을 확인하고 편집하세요</p>
          </div>
          <button class="btn btn-ghost" onclick="window.location.hash='history'">
            📚 히스토리
          </button>
        </div>

        <!-- 생성 정보 -->
        <div class="result-info card">
          <div class="card-body flex items-center justify-between">
            <div>
              <span class="result-status">✅ 생성 완료</span>
              <span class="result-time">${result.duration ? `${(result.duration / 1000).toFixed(1)}초` : ''}</span>
            </div>
            <div class="result-provider">
              ${getProviderIcon(result.provider)} ${getProviderName(result.provider)}
              ${result.model ? `· ${result.model}` : ''}
            </div>
          </div>
        </div>

        <!-- 미리보기 / 편집 -->
        <div class="card mt-4">
          <div class="card-header flex justify-between items-center">
            <h2 class="card-title">${isEditing ? '편집 모드' : '미리보기'}</h2>
            <button class="btn btn-secondary btn-sm" id="toggle-edit">
              ${isEditing ? '미리보기' : '편집 모드'}
            </button>
          </div>
          <div class="card-body">
            ${isEditing ? `
              <div class="edit-mode">
                <div class="input-group">
                  <label class="input-label">제목</label>
                  <input type="text" class="input" id="edit-title" value="${escapeHtml(result.title)}">
                </div>
                <div class="editor-split mt-4">
                  <div class="editor-pane">
                    <div class="editor-pane-header">
                      <span class="editor-pane-title">편집</span>
                      <div class="editor-toolbar">
                        <button type="button" class="btn btn-ghost btn-sm" id="insert-image-btn" title="이미지 삽입">
                          🖼️ 이미지 삽입 ${imageUploader.count > 0 ? `(${imageUploader.count})` : ''}
                        </button>
                      </div>
                      <span class="editor-char-count" id="char-count">${result.content.length}자</span>
                    </div>
                    <textarea class="input edit-content" id="edit-content">${escapeHtml(result.content)}</textarea>
                  </div>
                  <div class="preview-pane">
                    <div class="preview-pane-header">
                      <span class="preview-pane-title">미리보기</span>
                      <label class="preview-style-toggle">
                        <input type="checkbox" id="naver-style-toggle">
                        <span>네이버 스타일</span>
                      </label>
                    </div>
                    <div class="preview-content markdown-body" id="live-preview">
                      ${renderMarkdown(result.content)}
                    </div>
                  </div>
                </div>
                <div class="edit-actions mt-4 flex justify-end gap-3">
                  <button class="btn btn-secondary" id="cancel-edit">취소</button>
                  <button class="btn btn-primary" id="save-edit">변경사항 저장</button>
                </div>
              </div>
            ` : `
              <div class="preview-content markdown-body" id="preview-content">
                ${renderMarkdown(result.content)}
              </div>
            `}
          </div>
        </div>

        <!-- 글 정보 -->
        <div class="card mt-4">
          <div class="card-header">
            <h2 class="card-title">글 정보</h2>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">글자 수</span>
                <span class="info-value">${result.charCount?.toLocaleString() || '-'}자</span>
              </div>
              <div class="info-item">
                <span class="info-label">예상 읽기 시간</span>
                <span class="info-value">${result.readTime || '-'}분</span>
              </div>
              <div class="info-item">
                <span class="info-label">키워드</span>
                <span class="info-value">
                  ${result.keywords?.length > 0 ?
                    result.keywords.map(k => `<span class="tag">${k}</span>`).join(' ') :
                    '-'}
                </span>
              </div>
              ${result.usage ? `
                <div class="info-item">
                  <span class="info-label">토큰 사용</span>
                  <span class="info-value">${result.usage.totalTokens?.toLocaleString() || '-'}</span>
                </div>
              ` : ''}
              ${result.cost?.total ? `
                <div class="info-item">
                  <span class="info-label">비용</span>
                  <span class="info-value">$${result.cost.total.toFixed(4)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- SEO 분석 -->
        <div class="card mt-4">
          <div class="card-header">
            <h2 class="card-title">SEO 분석</h2>
            <span class="seo-score ${getSEOScoreClass(seoAnalysis.score)}">${seoAnalysis.score}/100</span>
          </div>
          <div class="card-body">
            <div class="progress mb-4">
              <div class="progress-bar" style="width: ${seoAnalysis.score}%; background-color: ${getSEOScoreColor(seoAnalysis.score)}"></div>
            </div>
            <div class="seo-items">
              ${seoAnalysis.items.map(item => `
                <div class="seo-item">
                  <span class="seo-item-status ${item.status}">${getStatusIcon(item.status)}</span>
                  <span class="seo-item-name">${item.name}</span>
                  <span class="seo-item-message">${item.message}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="card mt-4">
          <div class="card-header">
            <h2 class="card-title">액션</h2>
          </div>
          <div class="card-body">
            <div class="action-buttons">
              <button class="btn btn-secondary" id="copy-btn">
                <span>📋</span> 복사
              </button>
              <button class="btn btn-secondary" id="regenerate-btn">
                <span>🔄</span> 재생성
              </button>
              <button class="btn btn-secondary" id="image-btn">
                <span>🖼️</span> 이미지 생성
              </button>
              <button class="btn btn-secondary" id="schedule-btn">
                <span>📅</span> 예약하기
              </button>
            </div>
          </div>
        </div>

        <!-- 네이버 블로그 포스팅 -->
        <div class="card mt-4">
          <div class="card-header">
            <h2 class="card-title">네이버 블로그 포스팅</h2>
          </div>
          <div class="card-body">
            ${naverBlog.connected ? `
              <div class="naver-post-form">
                <div class="input-group">
                  <label class="input-label">카테고리</label>
                  <select class="input select" id="naver-category">
                    <option value="">선택 안함</option>
                    ${naverBlog.categories?.map(cat => `
                      <option value="${cat.categoryId}">${cat.categoryName}</option>
                    `).join('') || ''}
                  </select>
                </div>
                <div class="input-group mt-4">
                  <label class="input-label">공개 설정</label>
                  <div class="radio-group">
                    <label class="radio-item">
                      <input type="radio" name="visibility" class="radio-input" value="public" checked>
                      <span class="radio-label">공개</span>
                    </label>
                    <label class="radio-item">
                      <input type="radio" name="visibility" class="radio-input" value="neighbor">
                      <span class="radio-label">이웃공개</span>
                    </label>
                    <label class="radio-item">
                      <input type="radio" name="visibility" class="radio-input" value="private">
                      <span class="radio-label">비공개</span>
                    </label>
                  </div>
                </div>
                <button class="btn btn-primary btn-lg w-full mt-6" id="post-naver-btn">
                  🚀 네이버 블로그에 포스팅
                </button>
              </div>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3 class="empty-state-title">네이버 블로그 연동 필요</h3>
                <p class="empty-state-desc">블로그에 글을 포스팅하려면 먼저 연동을 설정해주세요</p>
                <button class="btn btn-primary mt-4" onclick="window.location.hash='settings'">
                  설정으로 이동
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  bindResultEvents();
}

/**
 * 이벤트 바인딩
 */
function bindResultEvents() {
  // 편집 토글
  document.getElementById('toggle-edit')?.addEventListener('click', () => {
    isEditing = !isEditing;
    if (isEditing) {
      editedContent = store.get('result').content;
    }
    renderResultPage();
  });

  // 실시간 미리보기
  const editContent = document.getElementById('edit-content');
  const livePreview = document.getElementById('live-preview');
  const charCount = document.getElementById('char-count');

  if (editContent && livePreview) {
    editContent.addEventListener('input', () => {
      const content = editContent.value;
      livePreview.innerHTML = renderMarkdown(content);
      if (charCount) {
        charCount.textContent = content.length + '자';
      }
    });

    // 네이버 스타일 토글
    document.getElementById('naver-style-toggle')?.addEventListener('change', (e) => {
      livePreview.classList.toggle('naver-blog-style', e.target.checked);
    });
  }

  // 편집 취소
  document.getElementById('cancel-edit')?.addEventListener('click', () => {
    isEditing = false;
    editedContent = '';
    renderResultPage();
  });

  // 편집 저장
  document.getElementById('save-edit')?.addEventListener('click', () => {
    const newTitle = document.getElementById('edit-title').value;
    const newContent = document.getElementById('edit-content').value;

    const result = store.get('result');
    const parsed = blogGenerator.parseResult(newContent);

    setResult({
      ...result,
      title: newTitle,
      content: newContent,
      ...parsed
    });

    isEditing = false;
    toast.success('변경사항이 저장되었습니다');
    renderResultPage();
  });

  // 복사
  document.getElementById('copy-btn')?.addEventListener('click', async () => {
    const result = store.get('result');
    const success = await copyToClipboard(result.content);
    if (success) {
      toast.success('클립보드에 복사되었습니다');
    } else {
      toast.error('복사에 실패했습니다');
    }
  });

  // 재생성
  document.getElementById('regenerate-btn')?.addEventListener('click', handleRegenerate);

  // 이미지 생성/추가 페이지
  document.getElementById('image-btn')?.addEventListener('click', () => {
    router.navigate('image');
  });

  // 이미지 삽입 버튼 (편집 모드)
  document.getElementById('insert-image-btn')?.addEventListener('click', () => {
    showImageInsertModal();
  });

  // 예약 포스팅
  document.getElementById('schedule-btn')?.addEventListener('click', () => {
    const result = store.get('result');
    const { naverBlog } = store.getState();

    if (!naverBlog.connected) {
      toast.warning('먼저 네이버 블로그를 연동해주세요');
      router.navigate('settings');
      return;
    }

    showScheduleModal({
      title: result.title,
      content: result.content,
      keywords: result.keywords || []
    }, naverBlog.categories || []);
  });

  // 네이버 포스팅
  document.getElementById('post-naver-btn')?.addEventListener('click', handleNaverPost);
}

/**
 * 재생성 핸들러
 */
async function handleRegenerate() {
  const confirmed = await modal.confirm({
    title: '글 재생성',
    message: '현재 글을 삭제하고 새로 생성하시겠습니까?',
    confirmText: '재생성'
  });

  if (!confirmed) return;

  const result = store.get('result');

  const btn = document.getElementById('regenerate-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 재생성 중...';

  try {
    const newResult = await blogGenerator.regenerate(result);
    setResult(newResult);
    toast.success('글이 재생성되었습니다');
    renderResultPage();
  } catch (error) {
    toast.error(error.message || '재생성에 실패했습니다');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🔄</span> 재생성';
  }
}

/**
 * 네이버 포스팅 핸들러
 */
async function handleNaverPost() {
  const result = store.get('result');
  const categoryId = document.getElementById('naver-category')?.value || '';
  const visibility = document.querySelector('input[name="visibility"]:checked')?.value || 'public';

  const btn = document.getElementById('post-naver-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 포스팅 중...';

  try {
    const postResult = await naverBlogService.postArticle({
      title: result.title,
      content: result.content,
      categoryId,
      tags: result.keywords,
      isPublic: visibility === 'public'
    });

    await modal.alert({
      title: '포스팅 완료',
      message: `글이 성공적으로 포스팅되었습니다!\n\n${postResult.url}`
    });

    // 새 탭에서 열기 옵션
    if (confirm('포스팅된 글을 확인하시겠습니까?')) {
      window.open(postResult.url, '_blank');
    }
  } catch (error) {
    toast.error(error.message || '포스팅에 실패했습니다');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🚀 네이버 블로그에 포스팅';
  }
}

/**
 * 마크다운 렌더링 (간단한 버전)
 */
function renderMarkdown(text) {
  // HTML 태그 (이미지 div 등)는 보존
  const htmlBlocks = [];
  let html = text.replace(/<div[\s\S]*?<\/div>/gi, (match) => {
    htmlBlocks.push(match);
    return `__HTML_BLOCK_${htmlBlocks.length - 1}__`;
  });

  // img 태그도 보존
  html = html.replace(/<img[^>]*>/gi, (match) => {
    htmlBlocks.push(match);
    return `__HTML_BLOCK_${htmlBlocks.length - 1}__`;
  });

  html = escapeHtml(html);

  // 제목
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 굵게, 기울임
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 마크다운 이미지 (![alt](src))
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; display: block; margin: 10px auto;">');

  // 링크
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // 리스트
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // 번호 리스트
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // 줄바꿈
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // HTML 블록 복원
  html = html.replace(/__HTML_BLOCK_(\d+)__/g, (match, index) => {
    return htmlBlocks[parseInt(index, 10)] || match;
  });

  return `<p>${html}</p>`;
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
 * Provider 아이콘
 */
function getProviderIcon(provider) {
  const icons = {
    anthropic: '🤖',
    openai: '🧠',
    google: '💎',
    groq: '⚡'
  };
  return icons[provider] || '🤖';
}

/**
 * Provider 이름
 */
function getProviderName(provider) {
  const names = {
    anthropic: 'Claude',
    openai: 'OpenAI',
    google: 'Gemini',
    groq: 'Groq'
  };
  return names[provider] || provider;
}

/**
 * SEO 점수 클래스
 */
function getSEOScoreClass(score) {
  if (score >= 80) return 'score-good';
  if (score >= 60) return 'score-warning';
  return 'score-error';
}

/**
 * SEO 점수 색상
 */
function getSEOScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--error)';
}

/**
 * 상태 아이콘
 */
function getStatusIcon(status) {
  const icons = {
    good: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };
  return icons[status] || '•';
}

/**
 * 이미지 삽입 모달 표시
 */
function showImageInsertModal() {
  const images = imageUploader.images;

  // 이미지가 없으면 이미지 페이지로 이동 안내
  if (images.length === 0) {
    modal.confirm({
      title: '업로드된 이미지 없음',
      message: '삽입할 이미지가 없습니다.\n이미지를 먼저 업로드하시겠습니까?',
      confirmText: '이미지 추가',
      onConfirm: () => {
        router.navigate('image');
      }
    });
    return;
  }

  // 모달 생성
  const modalEl = document.createElement('div');
  modalEl.className = 'modal image-insert-modal';
  modalEl.id = 'image-insert-modal';
  modalEl.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">이미지 삽입</h2>
        <button type="button" class="btn-close" id="close-image-modal">&times;</button>
      </div>

      <div class="modal-body">
        <p class="modal-description">삽입할 이미지를 선택하세요 (여러 개 선택 가능)</p>

        <div class="image-select-grid" id="image-select-grid">
          ${images.map((img, idx) => `
            <div class="image-select-item" data-id="${img.id}" data-index="${idx}">
              <img src="${img.thumbnail || img.base64}" alt="${escapeHtml(img.alt)}">
              <div class="image-select-check">
                <input type="checkbox" id="select-img-${idx}" data-id="${img.id}">
                <label for="select-img-${idx}"></label>
              </div>
              <div class="image-select-name">${escapeHtml(img.alt || `이미지 ${idx + 1}`)}</div>
            </div>
          `).join('')}
        </div>

        <div class="insert-options mt-4">
          <div class="form-group">
            <label class="input-label">삽입 위치</label>
            <div class="radio-group">
              <label class="radio-item">
                <input type="radio" name="insert-position" class="radio-input" value="cursor" checked>
                <span class="radio-label">커서 위치</span>
              </label>
              <label class="radio-item">
                <input type="radio" name="insert-position" class="radio-input" value="headings">
                <span class="radio-label">소제목 아래</span>
              </label>
              <label class="radio-item">
                <input type="radio" name="insert-position" class="radio-input" value="end">
                <span class="radio-label">글 끝</span>
              </label>
            </div>
          </div>

          <div class="form-group mt-3">
            <label class="input-label">정렬</label>
            <div class="btn-group-toggle">
              <button type="button" class="btn btn-sm" data-align="left">좌측</button>
              <button type="button" class="btn btn-sm active" data-align="center">중앙</button>
              <button type="button" class="btn btn-sm" data-align="right">우측</button>
            </div>
          </div>

          <div class="form-group mt-3">
            <label class="checkbox-label">
              <input type="checkbox" id="add-caption" checked>
              <span>캡션 추가</span>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-insert">취소</button>
        <button type="button" class="btn btn-primary" id="confirm-insert">삽입</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);
  requestAnimationFrame(() => modalEl.classList.add('open'));

  // 이벤트 바인딩
  bindImageModalEvents(modalEl);
}

/**
 * 이미지 모달 이벤트 바인딩
 */
function bindImageModalEvents(modalEl) {
  // 닫기
  const closeModal = () => {
    modalEl.classList.remove('open');
    setTimeout(() => modalEl.remove(), 200);
  };

  modalEl.querySelector('#close-image-modal').addEventListener('click', closeModal);
  modalEl.querySelector('#cancel-insert').addEventListener('click', closeModal);
  modalEl.querySelector('.modal-backdrop').addEventListener('click', closeModal);

  // 이미지 선택 토글
  modalEl.querySelectorAll('.image-select-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      checkbox.checked = !checkbox.checked;
      item.classList.toggle('selected', checkbox.checked);
    });
  });

  // 정렬 버튼
  modalEl.querySelectorAll('[data-align]').forEach(btn => {
    btn.addEventListener('click', () => {
      modalEl.querySelectorAll('[data-align]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 삽입 확정
  modalEl.querySelector('#confirm-insert').addEventListener('click', () => {
    const selectedIds = Array.from(modalEl.querySelectorAll('.image-select-item input:checked'))
      .map(input => input.dataset.id);

    if (selectedIds.length === 0) {
      toast.warning('이미지를 선택해주세요');
      return;
    }

    const position = modalEl.querySelector('input[name="insert-position"]:checked')?.value || 'cursor';
    const align = modalEl.querySelector('[data-align].active')?.dataset.align || 'center';
    const caption = modalEl.querySelector('#add-caption')?.checked ?? true;

    // 에디터 설정
    const textarea = document.getElementById('edit-content');
    if (!textarea) {
      toast.error('편집 모드에서만 삽입할 수 있습니다');
      closeModal();
      return;
    }

    contentImageManager.setEditor(textarea);

    // 이미지 삽입
    try {
      const insertedCount = contentImageManager.insertMultiple(selectedIds, {
        position,
        align,
        caption,
        style: 'naver'
      });

      toast.success(`${insertedCount}개 이미지가 삽입되었습니다`);
      closeModal();
    } catch (error) {
      toast.error(error.message || '이미지 삽입에 실패했습니다');
    }
  });
}
