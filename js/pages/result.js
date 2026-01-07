/**
 * Blog Automation - Result Page
 * 생성 결과 미리보기 페이지
 */

import { store, updateCurrentGeneration, setResult } from '../state.js';
import { blogGenerator } from '../services/blog-generator.js';
import { naverBlogService } from '../services/naver-blog.js';
import { router } from '../core/router.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';
import { copyToClipboard } from '../ui/components.js';

let isEditing = false;
let editedContent = '';

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
          <button class="btn btn-ghost" onclick="window.location.hash='home'">
            ← 뒤로
          </button>
          <div class="page-header-actions">
            <button class="btn btn-ghost" onclick="window.location.hash='history'">
              히스토리
            </button>
          </div>
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
                <div class="input-group mt-4">
                  <label class="input-label">본문</label>
                  <textarea class="input edit-content" id="edit-content" rows="20">${escapeHtml(result.content)}</textarea>
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

  // 이미지 생성
  document.getElementById('image-btn')?.addEventListener('click', () => {
    router.navigate('image');
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
  let html = escapeHtml(text);

  // 제목
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 굵게, 기울임
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

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
