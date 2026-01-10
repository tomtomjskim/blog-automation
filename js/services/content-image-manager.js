/**
 * Blog Automation - Content Image Manager
 * 본문에 이미지를 삽입하고 관리하는 서비스
 */

import { imageUploader } from './image-uploader.js';
import { escapeHtml } from '../utils/helpers.js';

/**
 * 에디터 인터페이스 기본 구현 (textarea 기반)
 */
class SimpleTextareaEditor {
  constructor(textarea) {
    this.textarea = textarea;
  }

  getValue() {
    return this.textarea.value;
  }

  setValue(value) {
    this.textarea.value = value;
  }

  getCursorPosition() {
    return this.textarea.selectionStart;
  }

  insertAtCursor(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const value = this.textarea.value;

    this.textarea.value = value.substring(0, start) + text + value.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
    this.textarea.focus();

    // 입력 이벤트 발생 (실시간 미리보기용)
    this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  insertAfterLine(lineNumber, text) {
    const lines = this.textarea.value.split('\n');
    if (lineNumber >= 0 && lineNumber < lines.length) {
      lines.splice(lineNumber + 1, 0, text);
      this.textarea.value = lines.join('\n');
      this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  focus() {
    this.textarea.focus();
  }
}

/**
 * Content Image Manager
 * 본문 내 이미지 삽입 관리
 */
class ContentImageManager {
  constructor() {
    this.editor = null;
    this.insertedImages = new Map(); // position -> imageId
  }

  /**
   * 에디터 설정
   * @param {HTMLTextAreaElement|EditorInterface} editor - 에디터 요소 또는 인터페이스
   */
  setEditor(editor) {
    if (editor instanceof HTMLTextAreaElement) {
      this.editor = new SimpleTextareaEditor(editor);
    } else {
      this.editor = editor;
    }
  }

  /**
   * 커서 위치에 이미지 삽입
   * @param {string} imageId - 이미지 ID
   * @param {object} options - 삽입 옵션
   * @returns {string} 삽입된 마크다운
   */
  insertAtCursor(imageId, options = {}) {
    if (!this.editor) {
      throw new Error('에디터가 설정되지 않았습니다');
    }

    const image = imageUploader.images.find(img => img.id === imageId);
    if (!image) {
      throw new Error('이미지를 찾을 수 없습니다');
    }

    const markdown = this.generateImageMarkdown(image, options);
    this.editor.insertAtCursor('\n' + markdown + '\n');

    // 위치 추적
    const position = this.editor.getCursorPosition();
    this.insertedImages.set(position, imageId);

    return markdown;
  }

  /**
   * 특정 줄 아래에 이미지 삽입
   * @param {number} lineNumber - 라인 번호 (0-based)
   * @param {string} imageId - 이미지 ID
   * @param {object} options - 삽입 옵션
   * @returns {string} 삽입된 마크다운
   */
  insertAfterLine(lineNumber, imageId, options = {}) {
    if (!this.editor) {
      throw new Error('에디터가 설정되지 않았습니다');
    }

    const image = imageUploader.images.find(img => img.id === imageId);
    if (!image) {
      throw new Error('이미지를 찾을 수 없습니다');
    }

    const markdown = this.generateImageMarkdown(image, options);
    this.editor.insertAfterLine(lineNumber, '\n' + markdown);

    return markdown;
  }

  /**
   * 소제목 아래에 이미지 자동 배치
   * @param {string[]} imageIds - 이미지 ID 배열
   * @param {object} options - 삽입 옵션
   */
  insertAfterHeadings(imageIds, options = {}) {
    if (!this.editor) {
      throw new Error('에디터가 설정되지 않았습니다');
    }

    const content = this.editor.getValue();
    const lines = content.split('\n');
    const headingLines = [];

    // ## 소제목 라인 찾기
    lines.forEach((line, index) => {
      if (/^##\s/.test(line)) {
        headingLines.push(index);
      }
    });

    // 이미지를 소제목에 순서대로 배치 (역순으로 삽입해야 라인 번호가 밀리지 않음)
    const imagesToInsert = imageIds.slice(0, headingLines.length);

    for (let i = imagesToInsert.length - 1; i >= 0; i--) {
      const lineNumber = headingLines[i];
      this.insertAfterLine(lineNumber, imagesToInsert[i], {
        align: 'center',
        caption: true,
        ...options
      });
    }

    return imagesToInsert.length;
  }

  /**
   * 콘텐츠 끝에 이미지 삽입
   * @param {string} imageId - 이미지 ID
   * @param {object} options - 삽입 옵션
   * @returns {string} 삽입된 마크다운
   */
  insertAtEnd(imageId, options = {}) {
    if (!this.editor) {
      throw new Error('에디터가 설정되지 않았습니다');
    }

    const image = imageUploader.images.find(img => img.id === imageId);
    if (!image) {
      throw new Error('이미지를 찾을 수 없습니다');
    }

    const markdown = this.generateImageMarkdown(image, options);
    const currentContent = this.editor.getValue();
    this.editor.setValue(currentContent + '\n\n' + markdown);

    return markdown;
  }

  /**
   * 여러 이미지 삽입
   * @param {string[]} imageIds - 이미지 ID 배열
   * @param {object} options - 삽입 옵션
   * @returns {number} 삽입된 이미지 수
   */
  insertMultiple(imageIds, options = {}) {
    const { position = 'cursor' } = options;
    let insertedCount = 0;

    if (position === 'headings') {
      return this.insertAfterHeadings(imageIds, options);
    }

    for (const imageId of imageIds) {
      try {
        if (position === 'end') {
          this.insertAtEnd(imageId, options);
        } else {
          this.insertAtCursor(imageId, options);
        }
        insertedCount++;
      } catch (error) {
        console.error(`이미지 삽입 실패: ${imageId}`, error);
      }
    }

    return insertedCount;
  }

  /**
   * 이미지 마크다운/HTML 생성
   * @param {object} image - 이미지 데이터
   * @param {object} options - 옵션
   * @returns {string} 마크다운 또는 HTML
   */
  generateImageMarkdown(image, options = {}) {
    const {
      align = 'center',
      caption = false,
      captionText = '',
      width = '100%',
      style = 'naver' // markdown | naver | html
    } = options;

    const alt = escapeHtml(image.alt || '이미지');

    if (style === 'markdown') {
      return `![${alt}](${image.base64})`;
    }

    if (style === 'naver') {
      let html = `
<div class="se-image" style="text-align: ${align}; margin: 20px 0;">
  <img src="${image.base64}" alt="${alt}" style="max-width: ${width}; height: auto;">`;

      if (caption && (captionText || image.alt)) {
        html += `
  <p class="se-caption" style="font-size: 13px; color: #888; margin-top: 8px; text-align: center;">
    ${escapeHtml(captionText || image.alt)}
  </p>`;
      }

      html += '\n</div>';
      return html.trim();
    }

    // HTML 기본
    return `<img src="${image.base64}" alt="${alt}" style="max-width: ${width}; display: block; margin: 20px auto;">`;
  }

  /**
   * 이미지 플레이스홀더 생성
   * @param {number} index - 인덱스
   * @returns {string} 플레이스홀더 문자열
   */
  createPlaceholder(index) {
    return `{{IMAGE_${index}}}`;
  }

  /**
   * 콘텐츠 내 플레이스홀더를 실제 이미지로 치환
   * @param {string} content - 원본 콘텐츠
   * @param {object} options - 옵션
   * @returns {string} 치환된 콘텐츠
   */
  replacePlaceholders(content, options = {}) {
    const images = imageUploader.images;

    return content.replace(/\{\{IMAGE_(\d+)\}\}/g, (match, indexStr) => {
      const index = parseInt(indexStr, 10);
      if (index < images.length) {
        return this.generateImageMarkdown(images[index], {
          style: 'naver',
          caption: true,
          ...options
        });
      }
      return match;
    });
  }

  /**
   * 콘텐츠에 이미지 포함 여부 확인
   * @param {string} content - 콘텐츠
   * @returns {boolean} 이미지 포함 여부
   */
  hasImages(content) {
    // base64 이미지 또는 플레이스홀더 확인
    return /data:image\/[a-z]+;base64,/.test(content) ||
           /\{\{IMAGE_\d+\}\}/.test(content) ||
           /<img\s+[^>]*src=/.test(content);
  }

  /**
   * 콘텐츠에서 이미지 개수 확인
   * @param {string} content - 콘텐츠
   * @returns {number} 이미지 개수
   */
  countImages(content) {
    const base64Count = (content.match(/data:image\/[a-z]+;base64,/g) || []).length;
    const placeholderCount = (content.match(/\{\{IMAGE_\d+\}\}/g) || []).length;
    const imgTagCount = (content.match(/<img\s+[^>]*src=/g) || []).length;

    return Math.max(base64Count, imgTagCount) + placeholderCount;
  }

  /**
   * 사용 가능한 이미지 목록 반환
   * @returns {object[]} 이미지 배열
   */
  getAvailableImages() {
    return imageUploader.images;
  }

  /**
   * 이미지 업로더 접근
   * @returns {ImageUploader} 이미지 업로더 인스턴스
   */
  getUploader() {
    return imageUploader;
  }

  /**
   * 상태 초기화
   */
  reset() {
    this.editor = null;
    this.insertedImages.clear();
  }
}

// 싱글톤 인스턴스
const contentImageManager = new ContentImageManager();

export { contentImageManager, ContentImageManager, SimpleTextareaEditor };
