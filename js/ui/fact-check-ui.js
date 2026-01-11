/**
 * Blog Automation - Fact Check UI Component
 * 팩트체크 결과 및 신뢰도 표시 UI
 */

import { factChecker, VERIFICATION_STATUS, CONFIDENCE_LEVELS } from '../services/fact-checker.js';
import { modal } from './modal.js';
import { toast } from './toast.js';

/**
 * 신뢰도 점수 배지 렌더링
 */
export function renderCredibilityBadge(score, options = {}) {
  const { size = 'md', showLabel = true } = options;
  const level = factChecker.getConfidenceLevel(score);

  const sizeClasses = {
    sm: 'credibility-badge-sm',
    md: 'credibility-badge-md',
    lg: 'credibility-badge-lg'
  };

  return `
    <div class="credibility-badge ${sizeClasses[size]} credibility-${level.level.toLowerCase()}"
         title="신뢰도: ${Math.round(score * 100)}%">
      <span class="credibility-icon">${level.icon}</span>
      <span class="credibility-score">${Math.round(score * 100)}%</span>
      ${showLabel ? `<span class="credibility-label">${level.label}</span>` : ''}
    </div>
  `;
}

/**
 * 신뢰도 바 렌더링
 */
export function renderCredibilityBar(score, options = {}) {
  const { width = '100%', height = '8px', showText = true } = options;
  const level = factChecker.getConfidenceLevel(score);
  const percentage = Math.round(score * 100);

  return `
    <div class="credibility-bar-container" style="width: ${width};">
      ${showText ? `
        <div class="credibility-bar-header">
          <span>신뢰도</span>
          <span class="credibility-bar-value">${percentage}%</span>
        </div>
      ` : ''}
      <div class="credibility-bar" style="height: ${height};">
        <div class="credibility-bar-fill credibility-${level.level.toLowerCase()}"
             style="width: ${percentage}%;">
        </div>
      </div>
    </div>
  `;
}

/**
 * 검증 결과 카드 렌더링
 */
export function renderVerificationCard(result) {
  const statusConfig = {
    [VERIFICATION_STATUS.VERIFIED]: { icon: '✅', label: '검증됨', class: 'verified' },
    [VERIFICATION_STATUS.PARTIALLY_VERIFIED]: { icon: '⚠️', label: '부분 검증', class: 'partial' },
    [VERIFICATION_STATUS.UNVERIFIED]: { icon: '🔍', label: '미검증', class: 'unverified' },
    [VERIFICATION_STATUS.DISPUTED]: { icon: '💬', label: '논쟁 중', class: 'disputed' },
    [VERIFICATION_STATUS.FALSE]: { icon: '❌', label: '거짓', class: 'false' }
  };

  const status = statusConfig[result.status] || statusConfig[VERIFICATION_STATUS.UNVERIFIED];

  return `
    <div class="verification-card verification-${status.class}">
      <div class="verification-header">
        <span class="verification-status">
          <span class="verification-icon">${status.icon}</span>
          <span class="verification-label">${status.label}</span>
        </span>
        ${renderCredibilityBadge(result.confidence, { size: 'sm', showLabel: false })}
      </div>

      <div class="verification-claim">
        "${result.claim}"
      </div>

      ${result.reasoning ? `
        <div class="verification-reasoning">
          <strong>판단 근거:</strong> ${result.reasoning}
        </div>
      ` : ''}

      ${result.correction ? `
        <div class="verification-correction">
          <strong>정정:</strong> ${result.correction}
        </div>
      ` : ''}

      ${result.evidence && result.evidence.length > 0 ? `
        <div class="verification-evidence">
          <strong>근거:</strong>
          <ul>
            ${result.evidence.map(e => `<li>${e}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${result.sources && result.sources.length > 0 ? `
        <div class="verification-sources">
          <strong>출처 (${result.sources.length}개):</strong>
          <div class="source-list">
            ${result.sources.slice(0, 3).map(s => `
              <a href="${s.url}" target="_blank" class="source-link" title="${s.title}">
                ${s.credibility ? `
                  <span class="source-credibility" style="color: ${getCredibilityColor(s.credibility.score)}">
                    ${Math.round(s.credibility.score * 100)}%
                  </span>
                ` : ''}
                <span class="source-title">${truncate(s.title, 40)}</span>
              </a>
            `).join('')}
            ${result.sources.length > 3 ? `<span class="more-sources">+${result.sources.length - 3}개 더보기</span>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 경고 배너 렌더링
 */
export function renderWarningBanner(warnings) {
  if (!warnings || warnings.length === 0) return '';

  const errorCount = warnings.filter(w => w.type === 'error').length;
  const warningCount = warnings.filter(w => w.type === 'warning').length;

  let bannerClass = 'warning-banner-info';
  if (errorCount > 0) bannerClass = 'warning-banner-error';
  else if (warningCount > 0) bannerClass = 'warning-banner-warning';

  return `
    <div class="warning-banner ${bannerClass}">
      <div class="warning-banner-header">
        <span class="warning-banner-icon">⚠️</span>
        <span class="warning-banner-title">
          검증 주의사항 ${errorCount > 0 ? `(오류 ${errorCount}건)` : ''}
        </span>
      </div>
      <ul class="warning-list">
        ${warnings.map(w => `
          <li class="warning-item warning-${w.type}">
            <span class="warning-icon">${w.icon}</span>
            <span class="warning-message">${w.message}</span>
            ${w.correction ? `<span class="warning-correction">→ ${w.correction}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * 팩트체크 결과 전체 UI 렌더링
 */
export function renderFactCheckResult(result) {
  if (!result) return '';

  const level = factChecker.getConfidenceLevel(result.overallScore);

  return `
    <div class="factcheck-result">
      <div class="factcheck-header">
        <h3>팩트체크 결과</h3>
        <span class="factcheck-timestamp">${formatDate(result.timestamp)}</span>
      </div>

      <div class="factcheck-summary-section">
        <div class="factcheck-score-display">
          <div class="score-circle credibility-${level.level.toLowerCase()}">
            <span class="score-value">${Math.round(result.overallScore * 100)}</span>
            <span class="score-unit">점</span>
          </div>
          <div class="score-label">${level.label}</div>
        </div>

        <div class="factcheck-stats">
          ${result.summary ? `<div class="factcheck-summary-text">${result.summary.replace(/\n/g, '<br>')}</div>` : ''}
        </div>
      </div>

      ${renderWarningBanner(result.warnings)}

      ${result.verificationResults && result.verificationResults.length > 0 ? `
        <div class="factcheck-details">
          <h4>검증 상세</h4>
          <div class="verification-cards">
            ${result.verificationResults.map(r => renderVerificationCard(r)).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 팩트체크 로딩 UI
 */
export function renderFactCheckLoading(step, progress) {
  const steps = {
    extracting: { icon: '🔍', label: '주장 추출 중...' },
    verifying: { icon: '✓', label: `검증 중... (${progress?.current || 0}/${progress?.total || 0})` },
    complete: { icon: '✅', label: '완료!' }
  };

  const currentStep = steps[step] || steps.extracting;

  return `
    <div class="factcheck-loading">
      <div class="factcheck-loading-icon">${currentStep.icon}</div>
      <div class="factcheck-loading-label">${currentStep.label}</div>
      ${step === 'verifying' && progress ? `
        <div class="factcheck-progress-bar">
          <div class="factcheck-progress-fill" style="width: ${(progress.current / progress.total) * 100}%"></div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 팩트체크 버튼 렌더링
 */
export function renderFactCheckButton(options = {}) {
  const { disabled = false, loading = false } = options;

  return `
    <button class="btn btn-secondary factcheck-btn"
            ${disabled ? 'disabled' : ''}
            id="factcheck-btn">
      ${loading ? `
        <span class="btn-loading"></span>
        <span>검증 중...</span>
      ` : `
        <span>🔍</span>
        <span>팩트체크</span>
      `}
    </button>
  `;
}

/**
 * 팩트체크 모달 열기
 */
export async function showFactCheckModal(text, options = {}) {
  const modalContent = document.createElement('div');
  modalContent.className = 'factcheck-modal-content';
  modalContent.innerHTML = renderFactCheckLoading('extracting');

  const modalInstance = modal.open({
    title: '팩트체크',
    content: modalContent,
    size: 'lg',
    actions: [
      { label: '닫기', action: 'close' }
    ]
  });

  try {
    const result = await factChecker.checkText(text, {
      ...options,
      onProgress: (progress) => {
        modalContent.innerHTML = renderFactCheckLoading(progress.step, progress);
      }
    });

    modalContent.innerHTML = renderFactCheckResult(result);

  } catch (error) {
    modalContent.innerHTML = `
      <div class="factcheck-error">
        <span class="error-icon">❌</span>
        <span class="error-message">팩트체크 중 오류가 발생했습니다: ${error.message}</span>
      </div>
    `;
  }

  return modalInstance;
}

/**
 * 빠른 팩트체크 인디케이터
 */
export async function quickFactCheckIndicator(text, container) {
  container.innerHTML = `
    <div class="quick-factcheck">
      <span class="quick-factcheck-loading"></span>
      <span>빠른 검증 중...</span>
    </div>
  `;

  try {
    const result = await factChecker.quickCheck(text);

    container.innerHTML = `
      <div class="quick-factcheck ${result.passed ? 'passed' : 'warning'}"
           title="클릭하여 상세 보기">
        <span class="quick-factcheck-icon">${result.passed ? '✅' : '⚠️'}</span>
        <span class="quick-factcheck-score">${Math.round(result.score * 100)}%</span>
        <span class="quick-factcheck-message">${result.message}</span>
      </div>
    `;

    // 클릭 시 상세 모달 열기
    container.querySelector('.quick-factcheck').addEventListener('click', () => {
      showFactCheckModal(text);
    });

  } catch (error) {
    container.innerHTML = `
      <div class="quick-factcheck error" title="${error.message}">
        <span class="quick-factcheck-icon">⚠️</span>
        <span>검증 불가</span>
      </div>
    `;
  }
}

// 헬퍼 함수
function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getCredibilityColor(score) {
  if (score >= 0.8) return 'var(--color-success)';
  if (score >= 0.6) return 'var(--color-warning)';
  if (score >= 0.4) return 'var(--color-orange)';
  return 'var(--color-error)';
}

export default {
  renderCredibilityBadge,
  renderCredibilityBar,
  renderVerificationCard,
  renderWarningBanner,
  renderFactCheckResult,
  renderFactCheckLoading,
  renderFactCheckButton,
  showFactCheckModal,
  quickFactCheckIndicator
};
