/**
 * Blog Automation - Utility Functions
 * 공통 유틸리티 함수
 */

/**
 * HTML 특수문자 이스케이프 (XSS 방지)
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 날짜/시간 포맷팅 (한국어)
 * @param {Date|string} date - 날짜 객체 또는 ISO 문자열
 * @param {object} options - Intl.DateTimeFormat 옵션
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatDateTime(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date);

  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return new Intl.DateTimeFormat('ko-KR', defaultOptions).format(d);
}

/**
 * 날짜만 포맷팅
 * @param {Date|string} date - 날짜 객체 또는 ISO 문자열
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

/**
 * 상대 시간 포맷팅
 * @param {Date|string} date - 날짜 객체 또는 ISO 문자열
 * @returns {string} 상대 시간 문자열
 */
export function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return formatDate(d);
}

/**
 * 글 스타일 라벨 반환
 * @param {string} style - 스타일 키
 * @returns {string} 한글 라벨
 */
export function getStyleLabel(style) {
  const labels = {
    casual: '친근한',
    informative: '정보형',
    review: '리뷰형',
    marketing: '마케팅',
    story: '스토리'
  };
  return labels[style] || style;
}

/**
 * 글 길이 라벨 반환
 * @param {string} length - 길이 키
 * @returns {string} 한글 라벨
 */
export function getLengthLabel(length) {
  const labels = {
    short: '짧게 (~500자)',
    medium: '보통 (~1000자)',
    long: '길게 (~2000자)'
  };
  return labels[length] || length;
}

/**
 * 파일 크기 포맷팅
 * @param {number} bytes - 바이트 수
 * @returns {string} 포맷된 크기
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

/**
 * 숫자 천 단위 구분자 추가
 * @param {number} num - 숫자
 * @returns {string} 포맷된 숫자
 */
export function formatNumber(num) {
  return num.toLocaleString('ko-KR');
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 쓰로틀 함수
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (ms)
 * @returns {Function} 쓰로틀된 함수
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * UUID 생성 (v4 형식)
 * @returns {string} UUID 문자열
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 클립보드에 텍스트 복사
 * @param {string} text - 복사할 텍스트
 * @returns {Promise<boolean>} 성공 여부
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 폴백: 구형 브라우저 지원
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  }
}

/**
 * 문자열 자르기 (말줄임)
 * @param {string} str - 원본 문자열
 * @param {number} maxLength - 최대 길이
 * @param {string} suffix - 접미사
 * @returns {string} 잘린 문자열
 */
export function truncate(str, maxLength, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * URL 쿼리 파라미터 파싱
 * @param {string} queryString - 쿼리 문자열
 * @returns {object} 파라미터 객체
 */
export function parseQueryString(queryString) {
  return Object.fromEntries(new URLSearchParams(queryString));
}

/**
 * 객체를 쿼리 문자열로 변환
 * @param {object} params - 파라미터 객체
 * @returns {string} 쿼리 문자열
 */
export function toQueryString(params) {
  return new URLSearchParams(params).toString();
}
