/**
 * Blog Automation - Batch Page
 * 대량 글 생성 페이지
 */

import { store } from '../state.js';
import { batchGenerator, MAX_ITEMS } from '../services/batch-generator.js';
import { llmService } from '../services/llm-service.js';
import { blogGenerator } from '../services/blog-generator.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';

let activeTab = 'manual';
let manualItems = [{ topic: '', keywords: '', additionalInfo: '' }];

/**
 * 배치 페이지 렌더링
 */
export function renderBatchPage() {
  const app = document.getElementById('app');
  const { apiKeys } = store.getState();
  const currentJob = batchGenerator.getJob();
  const styles = blogGenerator.getStyles();
  const lengths = blogGenerator.getLengthOptions();

  // 사용 가능한 Provider
  const availableProviders = Object.entries(apiKeys)
    .filter(([name, key]) => key && name !== 'stability')
    .map(([name]) => name);

  const allProviders = llmService.getAllProviderInfo();

  app.innerHTML = `
    <div class="batch-page">
      <div class="container container-md">
        <!-- 헤더 -->
        <div class="page-header">
          <div class="page-header-content">
            <h1 class="page-title">📦 대량 생성</h1>
            <p class="page-description">여러 글을 한 번에 생성합니다 (최대 ${MAX_ITEMS}개)</p>
          </div>
        </div>

        ${currentJob && currentJob.status !== 'idle' && currentJob.status !== 'completed' && currentJob.status !== 'stopped' ?
          renderProgressSection(currentJob) :
          renderInputSection(availableProviders, allProviders, styles, lengths, currentJob)
        }
      </div>
    </div>
  `;

  // 이벤트 바인딩
  bindBatchEvents();
}

/**
 * 입력 섹션 렌더링
 */
function renderInputSection(availableProviders, allProviders, styles, lengths, currentJob) {
  return `
    <!-- 입력 방식 선택 -->
    <div class="card">
      <div class="card-body p-0">
        <div class="tab-buttons">
          <button class="tab-btn ${activeTab === 'manual' ? 'active' : ''}" data-tab="manual">
            직접 입력
          </button>
          <button class="tab-btn ${activeTab === 'csv' ? 'active' : ''}" data-tab="csv">
            CSV 파일
          </button>
        </div>
      </div>
    </div>

    <!-- 직접 입력 -->
    <div class="tab-content ${activeTab === 'manual' ? 'active' : ''}" id="tab-manual">
      <div class="card mt-4">
        <div class="card-header">
          <h2 class="card-title">항목 목록</h2>
          <span class="item-count">${manualItems.length}개</span>
        </div>
        <div class="card-body">
          <div class="batch-items" id="batch-items">
            ${manualItems.map((item, index) => renderBatchItem(item, index)).join('')}
          </div>
          <button class="btn btn-secondary btn-full mt-4" id="btn-add-item">
            + 항목 추가
          </button>
        </div>
      </div>
    </div>

    <!-- CSV 업로드 -->
    <div class="tab-content ${activeTab === 'csv' ? 'active' : ''}" id="tab-csv">
      <div class="card mt-4">
        <div class="card-header">
          <h2 class="card-title">CSV 파일 업로드</h2>
        </div>
        <div class="card-body">
          <div class="file-upload-area" id="csv-drop-area">
            <input type="file" id="csv-file" accept=".csv" hidden>
            <label for="csv-file" class="file-upload-label">
              <span class="icon">📄</span>
              <span class="text">CSV 파일을 선택하거나 드래그하세요</span>
              <span class="hint">형식: 주제, 키워드(|구분), 추가정보</span>
            </label>
          </div>
          <div class="csv-preview" id="csv-preview"></div>

          <div class="csv-template mt-4">
            <p class="text-sm text-tertiary">CSV 템플릿:</p>
            <code class="code-block">topic,keywords,additionalInfo
제주도 여행 후기,제주도|여행|맛집,3박4일 일정
서울 카페 추천,서울|카페|디저트,</code>
            <button class="btn btn-ghost btn-sm mt-2" id="download-template">
              템플릿 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 전역 설정 -->
    <div class="card mt-4">
      <div class="card-header">
        <h2 class="card-title">공통 설정</h2>
      </div>
      <div class="card-body">
        <div class="settings-grid">
          <div class="form-group">
            <label class="input-label">스타일</label>
            <select id="batch-style" class="input select">
              ${styles.map(s => `
                <option value="${s.id}">${s.icon} ${s.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="input-label">길이</label>
            <select id="batch-length" class="input select">
              ${lengths.map(l => `
                <option value="${l.id}" ${l.id === 'medium' ? 'selected' : ''}>
                  ${l.label}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="input-label">LLM</label>
            <select id="batch-provider" class="input select">
              ${availableProviders.length > 0 ?
                allProviders
                  .filter(p => availableProviders.includes(p.name))
                  .map(p => `
                    <option value="${p.name}">${p.icon} ${p.displayName}</option>
                  `).join('')
                : '<option value="">API 키 설정 필요</option>'
              }
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 비용 예측 -->
    <div class="cost-estimate mt-4">
      <div class="cost-card">
        <span class="label">예상 비용</span>
        <span class="value" id="estimated-cost">$0.00</span>
      </div>
      <div class="cost-card">
        <span class="label">예상 시간</span>
        <span class="value" id="estimated-time">0분</span>
      </div>
      <div class="cost-card">
        <span class="label">항목 수</span>
        <span class="value" id="item-count">${manualItems.length}개</span>
      </div>
    </div>

    <!-- 액션 버튼 -->
    <div class="batch-actions mt-6">
      <button class="btn btn-secondary" id="btn-clear-batch">목록 초기화</button>
      <button class="btn btn-primary btn-lg" id="btn-start-batch"
              ${availableProviders.length === 0 || manualItems.length === 0 ? 'disabled' : ''}>
        생성 시작
      </button>
    </div>
  `;
}

/**
 * 진행 섹션 렌더링
 */
function renderProgressSection(job) {
  const progress = batchGenerator.getProgress();
  const { total, completed, failed } = job.progress;

  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">
          ${job.status === 'processing' ? '생성 진행 중...' :
            job.status === 'paused' ? '일시 정지됨' :
            '처리 완료'}
        </h2>
        <div class="progress-controls">
          ${job.status === 'processing' ? `
            <button class="btn btn-sm btn-secondary" id="btn-pause">일시정지</button>
          ` : job.status === 'paused' ? `
            <button class="btn btn-sm btn-primary" id="btn-resume">재개</button>
          ` : ''}
          <button class="btn btn-sm btn-ghost" id="btn-stop">중지</button>
        </div>
      </div>
      <div class="card-body">
        <div class="progress-bar-container">
          <div class="progress">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${completed + failed} / ${total}</span>
        </div>

        <div class="progress-stats mt-4">
          <span class="stat success">완료 <strong>${completed}</strong></span>
          <span class="stat failed">실패 <strong>${failed}</strong></span>
          <span class="stat cost">비용 <strong>$${job.cost.actual.toFixed(4)}</strong></span>
        </div>

        <div class="progress-items mt-4" id="progress-items">
          ${job.items.map(item => renderProgressItem(item)).join('')}
        </div>
      </div>
    </div>

    ${job.status === 'completed' || job.status === 'stopped' ? `
      <div class="card mt-4">
        <div class="card-header">
          <h2 class="card-title">결과 내보내기</h2>
        </div>
        <div class="card-body">
          <div class="export-buttons">
            <button class="btn btn-secondary" id="btn-export-json">
              📄 JSON 다운로드
            </button>
            <button class="btn btn-secondary" id="btn-export-md">
              📝 Markdown 다운로드
            </button>
          </div>
          <button class="btn btn-primary btn-full mt-4" id="btn-new-batch">
            새 배치 작업
          </button>
        </div>
      </div>
    ` : ''}
  `;
}

/**
 * 배치 항목 렌더링
 */
function renderBatchItem(item, index) {
  return `
    <div class="batch-item" data-index="${index}">
      <div class="item-header">
        <span class="item-number">${index + 1}</span>
        ${manualItems.length > 1 ? `
          <button class="btn-remove" data-index="${index}">×</button>
        ` : ''}
      </div>
      <div class="item-body">
        <input type="text"
               class="input input-topic"
               placeholder="주제 입력"
               value="${escapeHtml(item.topic || '')}"
               data-index="${index}"
               data-field="topic">
        <input type="text"
               class="input input-keywords"
               placeholder="키워드 (쉼표로 구분)"
               value="${escapeHtml(item.keywords || '')}"
               data-index="${index}"
               data-field="keywords">
      </div>
    </div>
  `;
}

/**
 * 진행 항목 렌더링
 */
function renderProgressItem(item) {
  const statusIcons = {
    pending: '⏳',
    processing: '🔄',
    completed: '✅',
    failed: '❌',
    skipped: '⏭️'
  };

  return `
    <div class="progress-item ${item.status}">
      <span class="progress-item-status">${statusIcons[item.status]}</span>
      <span class="progress-item-topic">${escapeHtml(item.input.topic)}</span>
      ${item.error ? `<span class="progress-item-error">${escapeHtml(item.error)}</span>` : ''}
    </div>
  `;
}

/**
 * 이벤트 바인딩
 */
function bindBatchEvents() {
  // 탭 전환
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderBatchPage();
    });
  });

  // 항목 입력 변경
  document.querySelectorAll('.batch-item input').forEach(input => {
    input.addEventListener('input', () => {
      const index = parseInt(input.dataset.index);
      const field = input.dataset.field;
      manualItems[index][field] = input.value;
      updateEstimates();
    });
  });

  // 항목 추가
  document.getElementById('btn-add-item')?.addEventListener('click', () => {
    if (manualItems.length >= MAX_ITEMS) {
      toast.warning(`최대 ${MAX_ITEMS}개까지 추가할 수 있습니다`);
      return;
    }
    manualItems.push({ topic: '', keywords: '', additionalInfo: '' });
    renderBatchPage();
  });

  // 항목 제거
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      manualItems.splice(index, 1);
      renderBatchPage();
    });
  });

  // 목록 초기화
  document.getElementById('btn-clear-batch')?.addEventListener('click', async () => {
    const confirmed = await modal.confirm({
      title: '목록 초기화',
      message: '모든 항목을 삭제하시겠습니까?',
      confirmText: '초기화',
      danger: true
    });

    if (confirmed) {
      manualItems = [{ topic: '', keywords: '', additionalInfo: '' }];
      batchGenerator.reset();
      renderBatchPage();
    }
  });

  // 설정 변경
  ['batch-style', 'batch-length', 'batch-provider'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', updateEstimates);
  });

  // CSV 파일 업로드
  const csvInput = document.getElementById('csv-file');
  csvInput?.addEventListener('change', handleCSVUpload);

  // CSV 드래그 앤 드롭
  const dropArea = document.getElementById('csv-drop-area');
  if (dropArea) {
    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('dragover');
    });
    dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('dragover');
    });
    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleCSVFile(file);
    });
  }

  // 템플릿 다운로드
  document.getElementById('download-template')?.addEventListener('click', downloadTemplate);

  // 생성 시작
  document.getElementById('btn-start-batch')?.addEventListener('click', startBatch);

  // 일시정지
  document.getElementById('btn-pause')?.addEventListener('click', () => {
    batchGenerator.pause();
  });

  // 재개
  document.getElementById('btn-resume')?.addEventListener('click', () => {
    batchGenerator.resume();
  });

  // 중지
  document.getElementById('btn-stop')?.addEventListener('click', async () => {
    const confirmed = await modal.confirm({
      title: '작업 중지',
      message: '진행 중인 작업을 중지하시겠습니까?',
      confirmText: '중지',
      danger: true
    });

    if (confirmed) {
      batchGenerator.stop();
      renderBatchPage();
    }
  });

  // 내보내기
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const json = batchGenerator.exportJSON();
    if (json) downloadFile(json, 'batch-result.json', 'application/json');
  });

  document.getElementById('btn-export-md')?.addEventListener('click', () => {
    const md = batchGenerator.exportMarkdown();
    if (md) downloadFile(md, 'batch-result.md', 'text/markdown');
  });

  // 새 배치
  document.getElementById('btn-new-batch')?.addEventListener('click', () => {
    batchGenerator.reset();
    manualItems = [{ topic: '', keywords: '', additionalInfo: '' }];
    renderBatchPage();
  });

  // 이벤트 리스너 등록
  setupBatchListeners();

  // 초기 예상치 업데이트
  updateEstimates();
}

/**
 * 배치 이벤트 리스너
 */
function setupBatchListeners() {
  batchGenerator.on('itemComplete', () => renderBatchPage());
  batchGenerator.on('itemError', () => renderBatchPage());
  batchGenerator.on('completed', () => {
    toast.success('대량 생성이 완료되었습니다!');
    renderBatchPage();
  });
  batchGenerator.on('paused', () => renderBatchPage());
}

/**
 * CSV 업로드 핸들러
 */
function handleCSVUpload(e) {
  const file = e.target.files[0];
  if (file) handleCSVFile(file);
}

/**
 * CSV 파일 처리
 */
async function handleCSVFile(file) {
  if (!file.name.endsWith('.csv')) {
    toast.error('CSV 파일만 업로드할 수 있습니다');
    return;
  }

  try {
    const content = await file.text();
    const items = batchGenerator.parseCSV(content);

    manualItems = items.map(item => ({
      topic: item.topic,
      keywords: item.keywords.join(', '),
      additionalInfo: item.additionalInfo || ''
    }));

    toast.success(`${items.length}개 항목을 불러왔습니다`);
    activeTab = 'manual';
    renderBatchPage();
  } catch (error) {
    toast.error(error.message);
  }
}

/**
 * 템플릿 다운로드
 */
function downloadTemplate() {
  const template = `topic,keywords,additionalInfo
제주도 3박4일 여행 후기,제주도|여행|맛집,가족여행
서울 성수동 카페 투어,성수동|카페|디저트,
부산 해운대 맛집 추천,부산|해운대|맛집,현지인 추천`;

  downloadFile(template, 'batch-template.csv', 'text/csv');
}

/**
 * 파일 다운로드
 */
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 생성 시작
 */
async function startBatch() {
  // 유효한 항목 필터링
  const validItems = manualItems.filter(item => item.topic.trim());

  if (validItems.length === 0) {
    toast.warning('최소 1개 이상의 주제를 입력해주세요');
    return;
  }

  const settings = {
    provider: document.getElementById('batch-provider')?.value || 'groq',
    style: document.getElementById('batch-style')?.value || 'casual',
    length: document.getElementById('batch-length')?.value || 'medium'
  };

  try {
    // 작업 생성
    batchGenerator.createJob(
      validItems.map(item => ({
        topic: item.topic.trim(),
        keywords: item.keywords.split(',').map(k => k.trim()).filter(Boolean),
        additionalInfo: item.additionalInfo
      })),
      settings
    );

    // 시작
    renderBatchPage();
    await batchGenerator.start();
  } catch (error) {
    toast.error(error.message);
  }
}

/**
 * 예상치 업데이트
 */
function updateEstimates() {
  const validItems = manualItems.filter(item => item.topic.trim());
  const settings = {
    provider: document.getElementById('batch-provider')?.value || 'groq',
    length: document.getElementById('batch-length')?.value || 'medium'
  };

  const cost = batchGenerator.estimateCost(validItems, settings);
  const time = batchGenerator.estimateTime(validItems.length);

  const costEl = document.getElementById('estimated-cost');
  const timeEl = document.getElementById('estimated-time');
  const countEl = document.getElementById('item-count');

  if (costEl) costEl.textContent = `$${cost.toFixed(4)}`;
  if (timeEl) timeEl.textContent = `약 ${time}분`;
  if (countEl) countEl.textContent = `${validItems.length}개`;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
