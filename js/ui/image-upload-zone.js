/**
 * Blog Automation - Image Upload Zone UI
 * 이미지 업로드 UI 컴포넌트
 */

import { imageUploader } from '../services/image-uploader.js';
import { escapeHtml, formatFileSize } from '../utils/helpers.js';
import { toast } from './toast.js';

/**
 * 이미지 업로드 영역 생성
 * @param {HTMLElement} container - 컨테이너 요소
 * @param {object} options - 옵션
 * @returns {ImageUploadZone}
 */
class ImageUploadZone {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onUpload: null,
      onRemove: null,
      onChange: null,
      ...options
    };

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.bindUploaderEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="image-upload-zone">
        <div class="upload-area" id="upload-area">
          <input type="file"
                 id="file-input"
                 accept="image/*"
                 multiple
                 hidden>

          <div class="upload-placeholder" id="upload-placeholder">
            <span class="upload-icon">📷</span>
            <p class="upload-text">이미지를 드래그하거나 클릭하여 업로드</p>
            <p class="upload-hint">
              JPEG, PNG, GIF, WebP | 최대 10MB | 최대 10개
            </p>
            <p class="upload-hint">
              <kbd>Ctrl</kbd>+<kbd>V</kbd>로 클립보드에서 붙여넣기
            </p>
          </div>

          <div class="upload-preview" id="upload-preview"></div>
        </div>

        <div class="upload-actions" id="upload-actions" hidden>
          <span class="upload-count">
            <span id="image-count">0</span>개 이미지
            (<span id="total-size">0</span>)
          </span>
          <button type="button" class="btn btn-sm btn-ghost" id="btn-clear-images">
            전체 삭제
          </button>
        </div>
      </div>
    `;

    // 요소 참조 저장
    this.uploadArea = this.container.querySelector('#upload-area');
    this.fileInput = this.container.querySelector('#file-input');
    this.placeholder = this.container.querySelector('#upload-placeholder');
    this.preview = this.container.querySelector('#upload-preview');
    this.actions = this.container.querySelector('#upload-actions');
    this.countEl = this.container.querySelector('#image-count');
    this.sizeEl = this.container.querySelector('#total-size');
    this.clearBtn = this.container.querySelector('#btn-clear-images');
  }

  bindEvents() {
    // 클릭으로 파일 선택
    this.uploadArea.addEventListener('click', (e) => {
      // 미리보기 영역 클릭은 제외
      if (e.target.closest('.preview-item')) return;
      this.fileInput.click();
    });

    // 파일 선택 시
    this.fileInput.addEventListener('change', async (e) => {
      await this.handleFileSelect(e.target.files);
      this.fileInput.value = '';
    });

    // 드래그 앤 드롭
    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    });

    this.uploadArea.addEventListener('dragleave', (e) => {
      // 자식 요소로 이동하는 경우 무시
      if (e.relatedTarget && this.uploadArea.contains(e.relatedTarget)) return;
      this.uploadArea.classList.remove('dragover');
    });

    this.uploadArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      await imageUploader.handleDrop(e);
    });

    // 전체 삭제
    this.clearBtn.addEventListener('click', () => {
      if (confirm('모든 이미지를 삭제하시겠습니까?')) {
        imageUploader.clear();
      }
    });

    // 클립보드 붙여넣기 (전역)
    this.pasteHandler = async (e) => {
      // 입력 필드에서는 무시
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const result = await imageUploader.handlePaste(e);
      if (result) {
        e.preventDefault();
        toast.success('클립보드에서 이미지가 추가되었습니다');
      }
    };
    document.addEventListener('paste', this.pasteHandler);
  }

  bindUploaderEvents() {
    imageUploader.addEventListener('uploaded', (e) => {
      this.updateUI();
      this.options.onUpload?.(e.detail);
      this.options.onChange?.(imageUploader.images);
    });

    imageUploader.addEventListener('removed', (e) => {
      this.updateUI();
      this.options.onRemove?.(e.detail);
      this.options.onChange?.(imageUploader.images);
    });

    imageUploader.addEventListener('cleared', () => {
      this.updateUI();
      this.options.onChange?.(imageUploader.images);
    });

    imageUploader.addEventListener('updated', () => {
      this.updateUI();
      this.options.onChange?.(imageUploader.images);
    });

    imageUploader.addEventListener('error', (e) => {
      toast.error(`${e.detail.file}: ${e.detail.error}`);
    });
  }

  async handleFileSelect(files) {
    const results = await imageUploader.processFiles(files);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (successful > 0) {
      toast.success(`${successful}개 이미지가 업로드되었습니다`);
    }
    if (failed > 0) {
      toast.error(`${failed}개 이미지 업로드에 실패했습니다`);
    }
  }

  updateUI() {
    const images = imageUploader.images;
    const hasImages = images.length > 0;

    // 플레이스홀더 표시/숨김
    this.placeholder.style.display = hasImages ? 'none' : 'block';

    // 미리보기 렌더링
    this.preview.innerHTML = images.map(img => `
      <div class="preview-item" data-id="${img.id}">
        <img src="${img.thumbnail}" alt="${escapeHtml(img.alt)}">
        <div class="preview-overlay">
          <button type="button" class="btn-remove" data-action="remove" data-id="${img.id}">×</button>
        </div>
        <div class="preview-info">
          <input type="text"
                 class="alt-input"
                 placeholder="대체 텍스트"
                 value="${escapeHtml(img.alt)}"
                 data-action="alt"
                 data-id="${img.id}">
          <span class="preview-size">${formatFileSize(img.size)}</span>
        </div>
      </div>
    `).join('');

    // 미리보기 이벤트 바인딩
    this.preview.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        imageUploader.remove(btn.dataset.id);
      });
    });

    this.preview.querySelectorAll('[data-action="alt"]').forEach(input => {
      input.addEventListener('change', (e) => {
        imageUploader.updateAlt(input.dataset.id, e.target.value);
      });
      input.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    // 통계 업데이트
    this.countEl.textContent = images.length;
    this.sizeEl.textContent = formatFileSize(imageUploader.totalSize);

    // 액션 영역 표시/숨김
    this.actions.hidden = !hasImages;
  }

  /**
   * 현재 이미지 목록 반환
   * @returns {object[]}
   */
  getImages() {
    return imageUploader.images;
  }

  /**
   * 이미지 초기화
   */
  clear() {
    imageUploader.clear();
  }

  /**
   * 컴포넌트 정리
   */
  destroy() {
    document.removeEventListener('paste', this.pasteHandler);
    imageUploader.clear();
    this.container.innerHTML = '';
  }
}

/**
 * 간편 생성 함수
 * @param {HTMLElement|string} container - 컨테이너 요소 또는 선택자
 * @param {object} options - 옵션
 * @returns {ImageUploadZone}
 */
export function createImageUploadZone(container, options = {}) {
  const el = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!el) {
    throw new Error('Container element not found');
  }

  return new ImageUploadZone(el, options);
}

export { ImageUploadZone };
