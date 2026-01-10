/**
 * Blog Automation - Image Uploader Service
 * 이미지 업로드, 리사이징, 압축 처리
 */

import { generateUUID, formatFileSize } from '../utils/helpers.js';
import { eventBus, EVENT_TYPES } from '../core/events.js';

class ImageUploader extends EventTarget {
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static MAX_FILES = 10;
  static MAX_DIMENSION = 1920;
  static QUALITY = 0.85;
  static THUMBNAIL_SIZE = 200;
  static ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  constructor() {
    super();
    this.uploadedImages = [];
  }

  /**
   * 파일 유효성 검사
   * @param {File} file - 검사할 파일
   * @returns {string[]} 에러 메시지 배열
   */
  validateFile(file) {
    const errors = [];

    if (!ImageUploader.ALLOWED_TYPES.includes(file.type)) {
      errors.push(`지원하지 않는 형식입니다: ${file.type}`);
    }

    if (file.size > ImageUploader.MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      errors.push(`파일이 너무 큽니다: ${sizeMB}MB (최대 10MB)`);
    }

    if (this.uploadedImages.length >= ImageUploader.MAX_FILES) {
      errors.push(`최대 ${ImageUploader.MAX_FILES}개까지 업로드할 수 있습니다`);
    }

    return errors;
  }

  /**
   * 이미지 처리 파이프라인
   * @param {File} file - 처리할 파일
   * @returns {Promise<object>} 처리된 이미지 데이터
   */
  async processImage(file) {
    // 1. 유효성 검사
    const errors = this.validateFile(file);
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    // 2. 이미지 로드
    const img = await this.loadImage(file);

    // 3. 리사이징 (Canvas 통해 EXIF도 자동 제거됨)
    const resized = this.resizeImage(img);

    // 4. 압축 및 변환
    const blob = await this.compressImage(resized, file.type);

    // 5. Base64 변환 (네이버 블로그용)
    const base64 = await this.blobToBase64(blob);

    // 6. 썸네일 생성
    const thumbnail = await this.createThumbnail(resized);

    const imageData = {
      id: `img_${generateUUID().slice(0, 8)}`,
      originalName: file.name,
      type: file.type,
      originalSize: file.size,
      size: blob.size,
      width: resized.width,
      height: resized.height,
      blob,
      base64,
      thumbnail,
      alt: this.generateAltText(file.name),
      uploadedAt: new Date().toISOString()
    };

    this.uploadedImages.push(imageData);
    this.emit('uploaded', imageData);

    return imageData;
  }

  /**
   * 이미지 로드
   * @param {File} file - 이미지 파일
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지를 로드할 수 없습니다'));
      };

      img.src = url;
    });
  }

  /**
   * 이미지 리사이징
   * @param {HTMLImageElement} img - 원본 이미지
   * @returns {HTMLCanvasElement} 리사이징된 캔버스
   */
  resizeImage(img) {
    const { width, height } = img;
    const maxDim = ImageUploader.MAX_DIMENSION;

    let newWidth = width;
    let newHeight = height;

    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      newWidth = Math.round(width * ratio);
      newHeight = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext('2d');

    // 부드러운 리사이징
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    return canvas;
  }

  /**
   * 이미지 압축
   * @param {HTMLCanvasElement} canvas - 캔버스
   * @param {string} mimeType - 원본 MIME 타입
   * @returns {Promise<Blob>}
   */
  compressImage(canvas, mimeType) {
    return new Promise(resolve => {
      // GIF는 압축하지 않음 (애니메이션 손실 방지)
      if (mimeType === 'image/gif') {
        canvas.toBlob(resolve, mimeType);
      } else {
        // JPEG 또는 WebP로 압축
        const targetType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(resolve, targetType, ImageUploader.QUALITY);
      }
    });
  }

  /**
   * 썸네일 생성
   * @param {HTMLCanvasElement} canvas - 원본 캔버스
   * @param {number} size - 썸네일 크기
   * @returns {Promise<string>} 썸네일 Object URL
   */
  async createThumbnail(canvas, size = ImageUploader.THUMBNAIL_SIZE) {
    const thumbCanvas = document.createElement('canvas');
    const ratio = Math.min(size / canvas.width, size / canvas.height);

    thumbCanvas.width = Math.round(canvas.width * ratio);
    thumbCanvas.height = Math.round(canvas.height * ratio);

    const ctx = thumbCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

    return new Promise(resolve => {
      thumbCanvas.toBlob(blob => {
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.7);
    });
  }

  /**
   * Base64 변환
   * @param {Blob} blob - 이미지 Blob
   * @returns {Promise<string>}
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Alt 텍스트 자동 생성
   * @param {string} filename - 파일명
   * @returns {string}
   */
  generateAltText(filename) {
    return filename
      .replace(/\.[^.]+$/, '')           // 확장자 제거
      .replace(/[-_]/g, ' ')             // 하이픈, 언더스코어 -> 공백
      .replace(/\d{10,}/g, '')           // 긴 숫자 제거
      .trim() || '이미지';
  }

  /**
   * 클립보드 이미지 처리
   * @param {ClipboardEvent} event - 클립보드 이벤트
   * @returns {Promise<object|null>}
   */
  async handlePaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return null;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          return this.processImage(file);
        }
      }
    }
    return null;
  }

  /**
   * 드래그 앤 드롭 처리
   * @param {DragEvent} event - 드래그 이벤트
   * @returns {Promise<object[]>}
   */
  async handleDrop(event) {
    event.preventDefault();

    const files = Array.from(event.dataTransfer.files)
      .filter(file => file.type.startsWith('image/'));

    const results = [];
    for (const file of files) {
      try {
        const result = await this.processImage(file);
        results.push(result);
      } catch (error) {
        this.emit('error', { file: file.name, error: error.message });
      }
    }

    return results;
  }

  /**
   * 여러 파일 처리
   * @param {FileList|File[]} files - 파일 목록
   * @returns {Promise<object[]>}
   */
  async processFiles(files) {
    const results = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const result = await this.processImage(file);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, file: file.name, error: error.message });
        this.emit('error', { file: file.name, error: error.message });
      }
    }

    return results;
  }

  /**
   * 이미지 삭제
   * @param {string} id - 이미지 ID
   * @returns {boolean}
   */
  remove(id) {
    const index = this.uploadedImages.findIndex(img => img.id === id);
    if (index >= 0) {
      const removed = this.uploadedImages.splice(index, 1)[0];

      // 썸네일 Object URL 해제
      if (removed.thumbnail) {
        URL.revokeObjectURL(removed.thumbnail);
      }

      this.emit('removed', removed);
      return true;
    }
    return false;
  }

  /**
   * 전체 초기화
   */
  clear() {
    this.uploadedImages.forEach(img => {
      if (img.thumbnail) {
        URL.revokeObjectURL(img.thumbnail);
      }
    });
    this.uploadedImages = [];
    this.emit('cleared');
  }

  /**
   * 이미지 Alt 텍스트 업데이트
   * @param {string} id - 이미지 ID
   * @param {string} alt - 새 Alt 텍스트
   */
  updateAlt(id, alt) {
    const image = this.uploadedImages.find(img => img.id === id);
    if (image) {
      image.alt = alt;
      this.emit('updated', image);
    }
  }

  /**
   * 마크다운 이미지 태그 생성
   * @param {object} image - 이미지 데이터
   * @param {object} options - 옵션
   * @returns {string}
   */
  toMarkdown(image, options = {}) {
    const { inline = false, align = 'center' } = options;

    if (inline) {
      return `![${image.alt}](${image.base64})`;
    }

    // 네이버 블로그 스타일
    return `
<div style="text-align: ${align}; margin: 20px 0;">
  <img src="${image.base64}" alt="${image.alt}" style="max-width: 100%; height: auto;">
</div>`.trim();
  }

  /**
   * 네이버 블로그용 HTML 생성
   * @param {object} image - 이미지 데이터
   * @param {object} options - 옵션
   * @returns {string}
   */
  toNaverHtml(image, options = {}) {
    const { align = 'center', caption = '' } = options;

    let html = `
<div class="se-image" style="text-align: ${align}; margin: 20px 0;">
  <img src="${image.base64}" alt="${image.alt}" style="max-width: 100%; height: auto;">`;

    if (caption || image.alt) {
      html += `
  <p class="se-caption" style="font-size: 13px; color: #888; margin-top: 8px;">
    ${caption || image.alt}
  </p>`;
    }

    html += '\n</div>';
    return html.trim();
  }

  /**
   * 이벤트 발행
   * @param {string} eventName - 이벤트 이름
   * @param {*} detail - 이벤트 데이터
   */
  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));

    // 전역 이벤트 버스에도 발행
    if (eventBus) {
      eventBus.emit(`image:${eventName}`, detail);
    }
  }

  // Getters
  get images() {
    return [...this.uploadedImages];
  }

  get count() {
    return this.uploadedImages.length;
  }

  get totalSize() {
    return this.uploadedImages.reduce((sum, img) => sum + img.size, 0);
  }

  get isEmpty() {
    return this.uploadedImages.length === 0;
  }

  get isFull() {
    return this.uploadedImages.length >= ImageUploader.MAX_FILES;
  }
}

// 싱글톤 인스턴스
const imageUploader = new ImageUploader();

export { imageUploader, ImageUploader };
