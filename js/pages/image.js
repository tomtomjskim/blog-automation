/**
 * Blog Automation - Image Page
 * AI 이미지 생성 + 로컬 이미지 업로드
 */

import { store, updateCurrentGeneration } from '../state.js';
import { llmService } from '../services/llm-service.js';
import { imageUploader } from '../services/image-uploader.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';
import { router } from '../core/router.js';

let generatedImages = [];
let isGenerating = false;
let activeTab = 'upload'; // 'upload' | 'generate'

/**
 * 이미지 페이지 렌더링
 */
export function renderImagePage() {
  const app = document.getElementById('app');
  const { result, apiKeys } = store.getState();

  // 이미지 생성 가능 여부 확인
  const canGenerate = apiKeys.openai || apiKeys.stability;
  const uploadedImages = imageUploader.images;

  app.innerHTML = `
    <div class="image-page">
      <div class="container container-md">
        <!-- 헤더 -->
        <div class="page-header">
          <button class="btn btn-ghost" onclick="history.back()">
            ← 뒤로
          </button>
          <h1 class="page-title">이미지</h1>
        </div>

        <!-- 탭 메뉴 -->
        <div class="tabs mb-6">
          <button class="tab ${activeTab === 'upload' ? 'active' : ''}" data-tab="upload">
            📁 이미지 업로드
          </button>
          <button class="tab ${activeTab === 'generate' ? 'active' : ''}" data-tab="generate">
            🎨 AI 생성
          </button>
        </div>

        <!-- 업로드 탭 -->
        <div class="tab-content ${activeTab === 'upload' ? '' : 'hidden'}" id="tab-upload">
          ${renderUploadSection(uploadedImages)}
        </div>

        <!-- 생성 탭 -->
        <div class="tab-content ${activeTab === 'generate' ? '' : 'hidden'}" id="tab-generate">
          ${!canGenerate ? renderNoApiKeyMessage() : `
          <!-- 프롬프트 입력 -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">이미지 프롬프트</h2>
              <p class="card-desc">생성하고 싶은 이미지를 설명해주세요</p>
            </div>
            <div class="card-body">
              <form id="image-form">
                <div class="input-group">
                  <textarea class="input" id="image-prompt" rows="4"
                    placeholder="예: 따뜻한 햇살이 비치는 카페 창가에서 커피를 마시는 고양이">${result?.imagePrompt || ''}</textarea>
                </div>

                ${result ? `
                  <button type="button" class="btn btn-ghost btn-sm mt-2" id="suggest-prompt">
                    ✨ 글 내용 기반으로 프롬프트 추천
                  </button>
                ` : ''}

                <!-- 생성 옵션 -->
                <div class="image-options mt-6">
                  <div class="option-row">
                    <div class="input-group">
                      <label class="input-label">이미지 제공자</label>
                      <select class="input select" id="image-provider">
                        ${apiKeys.openai ? '<option value="openai">DALL-E 3 (OpenAI)</option>' : ''}
                        ${apiKeys.stability ? '<option value="stability">Stable Diffusion (Stability AI)</option>' : ''}
                      </select>
                    </div>

                    <div class="input-group">
                      <label class="input-label">이미지 크기</label>
                      <select class="input select" id="image-size">
                        <option value="1024x1024">정사각형 (1024x1024)</option>
                        <option value="1792x1024">가로형 (1792x1024)</option>
                        <option value="1024x1792">세로형 (1024x1792)</option>
                      </select>
                    </div>
                  </div>

                  <div class="option-row mt-4">
                    <div class="input-group">
                      <label class="input-label">스타일</label>
                      <select class="input select" id="image-style">
                        <option value="vivid">선명한 (vivid)</option>
                        <option value="natural">자연스러운 (natural)</option>
                      </select>
                    </div>

                    <div class="input-group">
                      <label class="input-label">품질</label>
                      <select class="input select" id="image-quality">
                        <option value="standard">표준</option>
                        <option value="hd">HD (고품질)</option>
                      </select>
                    </div>
                  </div>

                  <div class="input-group mt-4">
                    <label class="input-label">생성 개수</label>
                    <div class="count-selector">
                      <button type="button" class="btn btn-secondary count-btn" data-action="decrease">-</button>
                      <span class="count-value" id="image-count">1</span>
                      <button type="button" class="btn btn-secondary count-btn" data-action="increase">+</button>
                    </div>
                    <span class="input-hint">DALL-E 3는 한 번에 1장만 생성 가능합니다</span>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-lg w-full mt-6" id="generate-btn">
                  🎨 이미지 생성
                </button>
              </form>
            </div>
          </div>

          <!-- 생성된 이미지 -->
          ${generatedImages.length > 0 ? renderGeneratedImages() : ''}

          <!-- 프롬프트 가이드 -->
          <div class="card mt-4">
            <div class="card-header">
              <h2 class="card-title">프롬프트 작성 가이드</h2>
            </div>
            <div class="card-body">
              <div class="prompt-tips">
                <div class="tip-item">
                  <span class="tip-icon">🎯</span>
                  <div class="tip-content">
                    <strong>구체적으로 설명하세요</strong>
                    <p>주제, 스타일, 분위기, 색상 등을 상세히 적으면 원하는 결과를 얻기 쉽습니다.</p>
                  </div>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">🎨</span>
                  <div class="tip-content">
                    <strong>스타일을 지정하세요</strong>
                    <p>예: "유화 스타일", "미니멀 일러스트", "사진처럼 사실적인" 등</p>
                  </div>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">💡</span>
                  <div class="tip-content">
                    <strong>부정어를 활용하세요</strong>
                    <p>"~없이", "~제외하고" 등으로 원하지 않는 요소를 제거할 수 있습니다.</p>
                  </div>
                </div>
              </div>

              <div class="example-prompts mt-4">
                <h4>예시 프롬프트</h4>
                <div class="example-list">
                  <button class="example-prompt" data-prompt="따뜻한 색감의 아늑한 카페 인테리어, 창문으로 들어오는 햇살, 커피잔과 책이 있는 나무 테이블, 미니멀 사진 스타일">
                    카페 인테리어
                  </button>
                  <button class="example-prompt" data-prompt="푸른 하늘 아래 넓은 초원에서 뛰어노는 골든 리트리버, 밝고 화사한 분위기, 고품질 사진">
                    강아지 야외
                  </button>
                  <button class="example-prompt" data-prompt="미래 도시의 야경, 네온 불빛이 반사되는 비 오는 거리, 사이버펑크 스타일, 영화같은 분위기">
                    사이버펑크 도시
                  </button>
                  <button class="example-prompt" data-prompt="수채화 스타일의 벚꽃 나무, 분홍색과 흰색 꽃잎이 바람에 날리는 장면, 동화적인 분위기">
                    벚꽃 일러스트
                  </button>
                </div>
              </div>
            </div>
          </div>
        `}
        </div>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  bindImageEvents();
  bindUploadEvents();
  bindTabEvents();
}

/**
 * 업로드 섹션 렌더링
 */
function renderUploadSection(uploadedImages) {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">로컬 이미지 업로드</h2>
        <p class="card-description">블로그에 사용할 이미지를 업로드하세요</p>
      </div>
      <div class="card-body">
        <!-- 업로드 영역 -->
        <div class="image-upload-zone">
          <div class="upload-area" id="upload-area">
            <input type="file" id="file-input" accept="image/*" multiple hidden>
            <div class="upload-placeholder">
              <span class="upload-icon">📷</span>
              <p class="upload-text">이미지를 드래그하거나 클릭하여 선택</p>
              <p class="upload-hint">JPEG, PNG, GIF, WebP (최대 10MB)</p>
              <p class="upload-hint"><kbd>Ctrl</kbd>+<kbd>V</kbd>로 클립보드에서 붙여넣기</p>
            </div>
          </div>

          <!-- 업로드된 이미지 미리보기 -->
          ${uploadedImages.length > 0 ? `
            <div class="upload-preview" id="upload-preview">
              ${uploadedImages.map(img => `
                <div class="preview-item" data-id="${img.id}">
                  <img src="${img.thumbnail || img.base64}" alt="${img.alt}">
                  <div class="preview-overlay">
                    <button class="btn-remove" data-id="${img.id}" title="삭제">×</button>
                  </div>
                  <div class="preview-info">
                    <input type="text" class="alt-input"
                      value="${img.alt}"
                      placeholder="alt 텍스트"
                      data-id="${img.id}">
                    <span class="preview-size">${formatFileSize(img.size)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="upload-actions">
              <span class="upload-count">${uploadedImages.length}/${imageUploader.constructor.MAX_FILES}개</span>
              <div class="flex gap-2">
                <button class="btn btn-outline btn-sm" id="clear-uploads">전체 삭제</button>
                <button class="btn btn-primary btn-sm" id="use-uploads">글에 사용하기</button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 사용 안내 -->
        <div class="prompt-tips mt-6">
          <div class="tip-item">
            <span class="tip-icon">✨</span>
            <div class="tip-content">
              <strong>자동 최적화</strong>
              <p>큰 이미지는 자동으로 리사이징되고 EXIF 정보가 제거됩니다</p>
            </div>
          </div>
          <div class="tip-item">
            <span class="tip-icon">📝</span>
            <div class="tip-content">
              <strong>Alt 텍스트</strong>
              <p>이미지 아래 입력창에서 SEO에 도움되는 alt 텍스트를 수정하세요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 탭 전환 이벤트
 */
function bindTabEvents() {
  document.querySelectorAll('.tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      renderImagePage();
    });
  });
}

/**
 * 업로드 이벤트 바인딩
 */
function bindUploadEvents() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');

  if (!uploadArea || !fileInput) return;

  // 클릭하여 파일 선택
  uploadArea.addEventListener('click', () => fileInput.click());

  // 파일 선택 시
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await handleFileUpload(e.target.files);
      fileInput.value = '';
    }
  });

  // 드래그 앤 드롭
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      await handleFileUpload(files);
    }
  });

  // 클립보드 붙여넣기 (페이지 전체)
  document.addEventListener('paste', handlePaste);

  // 이미지 삭제 버튼
  document.querySelectorAll('.preview-overlay .btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      imageUploader.remove(id);
      toast.success('이미지가 삭제되었습니다');
      renderImagePage();
    });
  });

  // Alt 텍스트 업데이트
  document.querySelectorAll('.alt-input').forEach(input => {
    input.addEventListener('change', (e) => {
      imageUploader.updateAlt(e.target.dataset.id, e.target.value);
    });
    input.addEventListener('click', (e) => e.stopPropagation());
  });

  // 전체 삭제
  document.getElementById('clear-uploads')?.addEventListener('click', () => {
    modal.confirm({
      title: '전체 삭제',
      message: '업로드된 모든 이미지를 삭제하시겠습니까?',
      confirmText: '삭제',
      onConfirm: () => {
        imageUploader.clear();
        toast.success('모든 이미지가 삭제되었습니다');
        renderImagePage();
      }
    });
  });

  // 글에 사용하기
  document.getElementById('use-uploads')?.addEventListener('click', () => {
    const images = imageUploader.images;
    if (images.length === 0) {
      toast.error('업로드된 이미지가 없습니다');
      return;
    }

    const currentGen = store.get('currentGeneration') || {};
    updateCurrentGeneration({
      images: [...(currentGen.images || []), ...images.map(img => ({
        url: img.base64,
        alt: img.alt,
        width: img.width,
        height: img.height,
        type: 'uploaded'
      }))]
    });

    toast.success(`${images.length}개 이미지가 글에 추가되었습니다`);
    imageUploader.clear();
    router.navigate('result');
  });
}

/**
 * 파일 업로드 처리
 */
async function handleFileUpload(files) {
  const loadingToast = toast.loading('이미지 처리 중...');

  try {
    const results = await imageUploader.processFiles(files);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    loadingToast.dismiss();

    if (successCount > 0) {
      toast.success(`${successCount}개 이미지 업로드 완료`);
    }
    if (failCount > 0) {
      const errors = results.filter(r => !r.success);
      toast.error(`${failCount}개 실패: ${errors[0].error}`);
    }

    renderImagePage();
  } catch (error) {
    loadingToast.dismiss();
    toast.error(error.message);
  }
}

/**
 * 클립보드 붙여넣기 처리
 */
async function handlePaste(e) {
  // 입력 필드에서는 무시
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        await handleFileUpload([file]);
      }
      break;
    }
  }
}

/**
 * 파일 크기 포맷
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * API 키 없음 메시지
 */
function renderNoApiKeyMessage() {
  return `
    <div class="card">
      <div class="card-body">
        <div class="empty-state">
          <div class="empty-state-icon">🔑</div>
          <h3 class="empty-state-title">API 키가 필요합니다</h3>
          <p class="empty-state-desc">
            이미지 생성을 위해 OpenAI(DALL-E) 또는 Stability AI의 API 키를 설정해주세요
          </p>
          <button class="btn btn-primary mt-4" onclick="window.location.hash='settings'">
            설정으로 이동
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 생성된 이미지 렌더링
 */
function renderGeneratedImages() {
  return `
    <div class="card mt-4">
      <div class="card-header flex justify-between items-center">
        <h2 class="card-title">생성된 이미지</h2>
        <button class="btn btn-ghost btn-sm" id="clear-images">
          지우기
        </button>
      </div>
      <div class="card-body">
        <div class="image-grid">
          ${generatedImages.map((img, index) => `
            <div class="image-item" data-index="${index}">
              <img src="${img.url}" alt="Generated image ${index + 1}" loading="lazy">
              <div class="image-overlay">
                <button class="btn btn-primary btn-sm" data-action="use" data-index="${index}">
                  사용하기
                </button>
                <button class="btn btn-secondary btn-sm" data-action="download" data-index="${index}">
                  다운로드
                </button>
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
function bindImageEvents() {
  // 이미지 생성 폼
  document.getElementById('image-form')?.addEventListener('submit', handleGenerateImage);

  // 프롬프트 추천
  document.getElementById('suggest-prompt')?.addEventListener('click', handleSuggestPrompt);

  // 생성 개수 조절
  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const countEl = document.getElementById('image-count');
      let count = parseInt(countEl.textContent);

      if (btn.dataset.action === 'increase' && count < 4) {
        count++;
      } else if (btn.dataset.action === 'decrease' && count > 1) {
        count--;
      }

      countEl.textContent = count;
    });
  });

  // 예시 프롬프트 클릭
  document.querySelectorAll('.example-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('image-prompt').value = btn.dataset.prompt;
    });
  });

  // 이미지 삭제
  document.getElementById('clear-images')?.addEventListener('click', () => {
    generatedImages = [];
    renderImagePage();
  });

  // 이미지 액션 (사용/다운로드)
  document.querySelectorAll('.image-overlay button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      const action = btn.dataset.action;

      if (action === 'use') {
        handleUseImage(index);
      } else if (action === 'download') {
        handleDownloadImage(index);
      }
    });
  });
}

/**
 * 이미지 생성 핸들러
 */
async function handleGenerateImage(e) {
  e.preventDefault();

  if (isGenerating) return;

  const prompt = document.getElementById('image-prompt').value.trim();
  if (!prompt) {
    toast.error('프롬프트를 입력하세요');
    return;
  }

  const provider = document.getElementById('image-provider').value;
  const size = document.getElementById('image-size').value;
  const style = document.getElementById('image-style').value;
  const quality = document.getElementById('image-quality').value;
  const count = parseInt(document.getElementById('image-count').textContent);

  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 생성 중...';
  isGenerating = true;

  try {
    const options = {
      prompt,
      provider,
      size,
      style,
      quality,
      count: provider === 'openai' ? 1 : count
    };

    const results = await llmService.generateImage(options);

    // 생성된 이미지 추가
    const newImages = Array.isArray(results) ? results : [results];
    generatedImages = [...newImages, ...generatedImages];

    toast.success(`이미지 ${newImages.length}장이 생성되었습니다`);
    renderImagePage();
  } catch (error) {
    toast.error(error.message || '이미지 생성에 실패했습니다');
    console.error('Image generation error:', error);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🎨 이미지 생성';
    isGenerating = false;
  }
}

/**
 * 프롬프트 추천 핸들러
 */
async function handleSuggestPrompt() {
  const result = store.get('result');
  if (!result?.content) {
    toast.error('글 내용이 없습니다');
    return;
  }

  const btn = document.getElementById('suggest-prompt');
  btn.disabled = true;
  btn.textContent = '추천 중...';

  try {
    const { apiKeys } = store.getState();
    const provider = apiKeys.anthropic ? 'anthropic' :
                     apiKeys.openai ? 'openai' :
                     apiKeys.groq ? 'groq' : null;

    if (!provider) {
      toast.error('텍스트 생성용 API 키가 필요합니다');
      return;
    }

    const systemPrompt = `당신은 이미지 프롬프트 전문가입니다. 주어진 블로그 글 내용을 기반으로
블로그 대표 이미지에 적합한 이미지 생성 프롬프트를 작성해주세요.

규칙:
1. 글의 핵심 주제와 분위기를 반영
2. 구체적이고 시각적인 설명 포함
3. 블로그 대표 이미지로 적합한 구도
4. 한글로 작성
5. 프롬프트만 출력 (다른 설명 없이)`;

    const response = await llmService.generate({
      provider,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `다음 블로그 글에 어울리는 대표 이미지 프롬프트를 작성해주세요:\n\n${result.content.slice(0, 1500)}` }
      ],
      maxTokens: 200
    });

    document.getElementById('image-prompt').value = response.content;
    toast.success('프롬프트가 추천되었습니다');
  } catch (error) {
    toast.error('프롬프트 추천에 실패했습니다');
    console.error('Suggest prompt error:', error);
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ 글 내용 기반으로 프롬프트 추천';
  }
}

/**
 * 이미지 사용 핸들러
 */
function handleUseImage(index) {
  const image = generatedImages[index];
  if (!image) return;

  const currentGen = store.get('currentGeneration');
  updateCurrentGeneration({
    images: [...(currentGen.images || []), image]
  });

  toast.success('이미지가 글에 추가되었습니다');
  router.navigate('result');
}

/**
 * 이미지 다운로드 핸들러
 */
async function handleDownloadImage(index) {
  const image = generatedImages[index];
  if (!image) return;

  try {
    const response = await fetch(image.url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-image-${Date.now()}.png`;
    a.click();

    URL.revokeObjectURL(url);
    toast.success('이미지를 다운로드했습니다');
  } catch (error) {
    // 직접 다운로드 실패 시 새 탭에서 열기
    window.open(image.url, '_blank');
    toast.info('새 탭에서 이미지를 열었습니다');
  }
}
