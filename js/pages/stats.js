/**
 * Blog Automation - Stats Page
 * 사용량 통계 대시보드 페이지
 */

import { usageTracker } from '../services/usage-tracker.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';

/**
 * 통계 페이지 렌더링
 */
export function renderStatsPage(container) {
  const currentPeriod = 'month';

  container.innerHTML = `
    <div class="stats-page">
      <header class="page-header">
        <h1>사용량 통계</h1>
        <p class="page-description">API 사용량, 토큰 소비, 비용을 추적합니다.</p>
      </header>

      <div class="stats-toolbar">
        <div class="period-tabs">
          <button class="period-tab active" data-period="today">오늘</button>
          <button class="period-tab" data-period="week">이번 주</button>
          <button class="period-tab" data-period="month">이번 달</button>
          <button class="period-tab" data-period="all">전체</button>
        </div>
        <div class="stats-actions">
          <button id="export-stats-btn" class="btn btn-sm btn-outline">
            <span class="icon">📊</span> 내보내기
          </button>
          <button id="reset-stats-btn" class="btn btn-sm btn-outline btn-danger">
            <span class="icon">🗑️</span> 초기화
          </button>
        </div>
      </div>

      <div class="stats-content">
        <!-- 요약 카드 -->
        <section class="stats-summary" id="stats-summary">
          ${renderSummaryCards('month')}
        </section>

        <!-- 차트 영역 -->
        <section class="stats-charts">
          <div class="chart-container">
            <h3>일별 사용량 추이</h3>
            <div class="chart-wrapper" id="daily-chart">
              ${renderDailyChart(30)}
            </div>
          </div>
        </section>

        <!-- 상세 통계 -->
        <div class="stats-details">
          <!-- 모델별 사용량 -->
          <section class="stats-section">
            <h3>모델별 사용량</h3>
            <div class="model-stats" id="model-stats">
              ${renderModelStats()}
            </div>
          </section>

          <!-- 비용 예측 -->
          <section class="stats-section">
            <h3>비용 예측</h3>
            <div class="cost-projection" id="cost-projection">
              ${renderCostProjection()}
            </div>
          </section>
        </div>

        <!-- 최근 기록 -->
        <section class="stats-section">
          <h3>최근 사용 기록</h3>
          <div class="recent-records" id="recent-records">
            ${renderRecentRecords()}
          </div>
        </section>
      </div>
    </div>
  `;

  setupStatsEventListeners(container);
}

/**
 * 요약 카드 렌더링
 */
function renderSummaryCards(period) {
  const stats = usageTracker.getStats(period);
  const summary = usageTracker.getSummary();

  return `
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon">📝</div>
        <div class="card-content">
          <div class="card-value">${stats.requests.toLocaleString()}</div>
          <div class="card-label">총 요청</div>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">✅</div>
        <div class="card-content">
          <div class="card-value">${stats.successRate}%</div>
          <div class="card-label">성공률</div>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">🔤</div>
        <div class="card-content">
          <div class="card-value">${formatTokens(stats.tokens.total)}</div>
          <div class="card-label">토큰 사용</div>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="card-value">$${stats.cost.toFixed(4)}</div>
          <div class="card-label">총 비용</div>
        </div>
      </div>
    </div>

    <div class="token-breakdown">
      <div class="breakdown-item">
        <span class="breakdown-label">입력 토큰</span>
        <span class="breakdown-value">${formatTokens(stats.tokens.input)}</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">출력 토큰</span>
        <span class="breakdown-value">${formatTokens(stats.tokens.output)}</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">입출력 비율</span>
        <span class="breakdown-value">
          1:${stats.tokens.input > 0 ? (stats.tokens.output / stats.tokens.input).toFixed(2) : '0'}
        </span>
      </div>
    </div>
  `;
}

/**
 * 일별 차트 렌더링 (텍스트 기반)
 */
function renderDailyChart(days) {
  const data = usageTracker.getDailyChartData(days);

  if (data.every(d => d.requests === 0)) {
    return `<div class="empty-chart">아직 사용 기록이 없습니다.</div>`;
  }

  const maxRequests = Math.max(...data.map(d => d.requests), 1);

  return `
    <div class="text-chart">
      <div class="chart-bars">
        ${data.map(d => {
          const height = (d.requests / maxRequests) * 100;
          return `
            <div class="chart-bar-wrapper" title="${d.date}: ${d.requests}건, ${formatTokens(d.tokens)} 토큰">
              <div class="chart-bar" style="height: ${height}%">
                ${d.requests > 0 ? `<span class="bar-value">${d.requests}</span>` : ''}
              </div>
              <span class="chart-label">${d.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div class="chart-legend">
      <span>최근 ${days}일 요청 수</span>
    </div>
  `;
}

/**
 * 모델별 통계 렌더링
 */
function renderModelStats() {
  const modelStats = usageTracker.getModelStats();

  if (modelStats.length === 0) {
    return `<div class="empty-state">아직 사용 기록이 없습니다.</div>`;
  }

  const maxRequests = Math.max(...modelStats.map(m => m.requests));

  return `
    <div class="model-list">
      ${modelStats.map(m => {
        const percent = (m.requests / maxRequests) * 100;
        return `
          <div class="model-item">
            <div class="model-info">
              <span class="model-provider">${m.provider}</span>
              <span class="model-name">${m.model}</span>
            </div>
            <div class="model-bar-container">
              <div class="model-bar" style="width: ${percent}%"></div>
            </div>
            <div class="model-stats-detail">
              <span>${m.requests}건</span>
              <span>${formatTokens(m.tokens.total)}</span>
              <span>$${m.cost.toFixed(4)}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * 비용 예측 렌더링
 */
function renderCostProjection() {
  const projection = usageTracker.getMonthlyProjection();
  const stats = usageTracker.getStats('month');

  return `
    <div class="projection-grid">
      <div class="projection-item">
        <div class="projection-label">현재 월 비용</div>
        <div class="projection-value">$${stats.cost.toFixed(4)}</div>
      </div>
      <div class="projection-item">
        <div class="projection-label">일 평균 (예상)</div>
        <div class="projection-value">$${projection.daily.toFixed(4)}</div>
      </div>
      <div class="projection-item">
        <div class="projection-label">주간 예상</div>
        <div class="projection-value">$${projection.weekly.toFixed(4)}</div>
      </div>
      <div class="projection-item highlight">
        <div class="projection-label">월간 예상</div>
        <div class="projection-value">$${projection.monthly.toFixed(4)}</div>
      </div>
    </div>

    <div class="projection-note">
      <small>* 최근 7일 사용량 기반 예측</small>
    </div>
  `;
}

/**
 * 최근 기록 렌더링
 */
function renderRecentRecords() {
  const records = usageTracker.getRecentRecords(20);

  if (records.length === 0) {
    return `<div class="empty-state">아직 사용 기록이 없습니다.</div>`;
  }

  return `
    <div class="records-table">
      <div class="table-header">
        <span>시간</span>
        <span>유형</span>
        <span>모델</span>
        <span>토큰</span>
        <span>비용</span>
        <span>상태</span>
      </div>
      <div class="table-body">
        ${records.map(r => `
          <div class="table-row ${r.success ? '' : 'failed'}">
            <span class="time">${formatTime(r.timestamp)}</span>
            <span class="type">${getTypeLabel(r.type)}</span>
            <span class="model">${r.provider}/${r.model?.split('/').pop() || 'unknown'}</span>
            <span class="tokens">${r.tokens.total.toLocaleString()}</span>
            <span class="cost">$${r.cost.toFixed(4)}</span>
            <span class="status ${r.success ? 'success' : 'error'}">
              ${r.success ? '성공' : '실패'}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * 이벤트 리스너 설정
 */
function setupStatsEventListeners(container) {
  // 기간 탭
  container.querySelectorAll('.period-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const period = tab.dataset.period;
      const summaryEl = container.querySelector('#stats-summary');
      if (summaryEl) {
        summaryEl.innerHTML = renderSummaryCards(period);
      }
    });
  });

  // 내보내기
  container.querySelector('#export-stats-btn')?.addEventListener('click', () => {
    handleExport();
  });

  // 초기화
  container.querySelector('#reset-stats-btn')?.addEventListener('click', () => {
    handleReset(container);
  });
}

/**
 * 데이터 내보내기
 */
function handleExport() {
  const report = usageTracker.generateReport('all');
  const json = JSON.stringify(report, null, 2);

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blog-automation-stats-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  toast.success('통계 데이터가 내보내졌습니다.');
}

/**
 * 데이터 초기화
 */
function handleReset(container) {
  modal.confirm({
    title: '통계 초기화',
    message: '모든 사용량 통계가 삭제됩니다. 계속하시겠습니까?',
    confirmText: '초기화',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      usageTracker.reset();
      renderStatsPage(container);
      toast.success('통계가 초기화되었습니다.');
    }
  });
}

/**
 * 토큰 포맷팅
 */
function formatTokens(tokens) {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(2) + 'M';
  }
  if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'K';
  }
  return tokens.toLocaleString();
}

/**
 * 시간 포맷팅
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  // 24시간 이내
  if (diff < 86400000) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  // 그 외
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

/**
 * 유형 라벨
 */
function getTypeLabel(type) {
  const labels = {
    generation: '글 생성',
    batch: '대량 생성',
    image: '이미지',
    seo: 'SEO 분석'
  };
  return labels[type] || type;
}
