/**
 * Blog Automation - History Page
 * 생성 히스토리 관리
 */

import { store, deleteHistoryItem, clearHistory, setResult } from '../state.js';
import { router } from '../core/router.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';
import { formatDate, copyToClipboard } from '../ui/components.js';

let searchQuery = '';
let sortBy = 'date'; // date, title, charCount
let sortOrder = 'desc';
let filterProvider = 'all';

/**
 * 히스토리 페이지 렌더링
 */
export function renderHistoryPage() {
  const app = document.getElementById('app');
  const { history } = store.getState();

  // 필터링 및 정렬
  const filteredHistory = getFilteredHistory(history);

  app.innerHTML = `
    <div class="history-page">
      <div class="container container-lg">
        <!-- 헤더 -->
        <div class="page-header">
          <button class="btn btn-ghost" onclick="window.location.hash='home'">
            ← 뒤로
          </button>
          <h1 class="page-title">히스토리</h1>
          <div class="page-header-actions">
            ${history.length > 0 ? `
              <button class="btn btn-ghost text-danger" id="clear-all-history">
                전체 삭제
              </button>
            ` : ''}
          </div>
        </div>

        ${history.length > 0 ? `
          <!-- 검색 및 필터 -->
          <div class="history-filters card">
            <div class="card-body">
              <div class="filters-row">
                <div class="search-box">
                  <input type="text" class="input" id="history-search"
                    placeholder="제목 또는 내용 검색..." value="${searchQuery}">
                </div>
                <div class="filter-group">
                  <select class="input select" id="filter-provider">
                    <option value="all" ${filterProvider === 'all' ? 'selected' : ''}>모든 제공자</option>
                    <option value="anthropic" ${filterProvider === 'anthropic' ? 'selected' : ''}>Claude</option>
                    <option value="openai" ${filterProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
                    <option value="google" ${filterProvider === 'google' ? 'selected' : ''}>Gemini</option>
                    <option value="groq" ${filterProvider === 'groq' ? 'selected' : ''}>Groq</option>
                  </select>
                </div>
                <div class="sort-group">
                  <select class="input select" id="sort-by">
                    <option value="date" ${sortBy === 'date' ? 'selected' : ''}>날짜순</option>
                    <option value="title" ${sortBy === 'title' ? 'selected' : ''}>제목순</option>
                    <option value="charCount" ${sortBy === 'charCount' ? 'selected' : ''}>글자수순</option>
                  </select>
                  <button class="btn btn-ghost btn-sm" id="toggle-sort">
                    ${sortOrder === 'desc' ? '↓' : '↑'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 통계 -->
          <div class="history-stats mt-4">
            <div class="stat-badge">
              총 <strong>${history.length}</strong>개의 글
            </div>
            <div class="stat-badge">
              총 <strong>${getTotalCharCount(history).toLocaleString()}</strong>자
            </div>
            ${filteredHistory.length !== history.length ? `
              <div class="stat-badge filtered">
                검색 결과: <strong>${filteredHistory.length}</strong>개
              </div>
            ` : ''}
          </div>

          <!-- 히스토리 목록 -->
          <div class="history-list mt-4">
            ${filteredHistory.length > 0 ?
              filteredHistory.map(item => renderHistoryItem(item)).join('') :
              `<div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3 class="empty-state-title">검색 결과가 없습니다</h3>
                <p class="empty-state-desc">다른 검색어로 시도해보세요</p>
              </div>`
            }
          </div>
        ` : `
          <div class="card">
            <div class="card-body">
              <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3 class="empty-state-title">아직 생성된 글이 없습니다</h3>
                <p class="empty-state-desc">첫 번째 블로그 글을 생성해보세요!</p>
                <button class="btn btn-primary mt-4" onclick="window.location.hash='home'">
                  글 생성하러 가기
                </button>
              </div>
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  // 이벤트 바인딩
  bindHistoryEvents();
}

/**
 * 히스토리 아이템 렌더링
 */
function renderHistoryItem(item) {
  const providerInfo = getProviderInfo(item.provider);
  const preview = item.content?.slice(0, 150) || '';

  return `
    <div class="history-item card" data-id="${item.id}">
      <div class="card-body">
        <div class="history-item-header">
          <h3 class="history-item-title">${item.title || '제목 없음'}</h3>
          <div class="history-item-meta">
            <span class="provider-badge ${item.provider}">
              ${providerInfo.icon} ${providerInfo.name}
            </span>
            <span class="date-badge">${formatDate(item.createdAt)}</span>
          </div>
        </div>

        <p class="history-item-preview">${preview}${preview.length >= 150 ? '...' : ''}</p>

        <div class="history-item-footer">
          <div class="history-item-stats">
            ${item.charCount ? `<span class="stat">${item.charCount.toLocaleString()}자</span>` : ''}
            ${item.usage?.totalTokens ? `<span class="stat">${item.usage.totalTokens.toLocaleString()} 토큰</span>` : ''}
            ${item.keywords?.length > 0 ? `
              <div class="tags">
                ${item.keywords.slice(0, 3).map(k => `<span class="tag tag-sm">${k}</span>`).join('')}
                ${item.keywords.length > 3 ? `<span class="tag tag-sm">+${item.keywords.length - 3}</span>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="history-item-actions">
            <button class="btn btn-ghost btn-sm" data-action="view" data-id="${item.id}" title="보기">
              👁
            </button>
            <button class="btn btn-ghost btn-sm" data-action="copy" data-id="${item.id}" title="복사">
              📋
            </button>
            <button class="btn btn-ghost btn-sm" data-action="reuse" data-id="${item.id}" title="재사용">
              🔄
            </button>
            <button class="btn btn-ghost btn-sm text-danger" data-action="delete" data-id="${item.id}" title="삭제">
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 필터링된 히스토리 가져오기
 */
function getFilteredHistory(history) {
  let filtered = [...history];

  // 검색 필터
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.content?.toLowerCase().includes(query) ||
      item.keywords?.some(k => k.toLowerCase().includes(query))
    );
  }

  // 제공자 필터
  if (filterProvider !== 'all') {
    filtered = filtered.filter(item => item.provider === filterProvider);
  }

  // 정렬
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
        break;
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      case 'charCount':
        comparison = (b.charCount || 0) - (a.charCount || 0);
        break;
    }

    return sortOrder === 'desc' ? comparison : -comparison;
  });

  return filtered;
}

/**
 * 총 글자수 계산
 */
function getTotalCharCount(history) {
  return history.reduce((sum, item) => sum + (item.charCount || 0), 0);
}

/**
 * 제공자 정보
 */
function getProviderInfo(provider) {
  const providers = {
    anthropic: { name: 'Claude', icon: '🤖' },
    openai: { name: 'OpenAI', icon: '🧠' },
    google: { name: 'Gemini', icon: '💎' },
    groq: { name: 'Groq', icon: '⚡' }
  };
  return providers[provider] || { name: provider, icon: '🤖' };
}

/**
 * 이벤트 바인딩
 */
function bindHistoryEvents() {
  // 검색
  const searchInput = document.getElementById('history-search');
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      renderHistoryPage();
    }, 300);
  });

  // 제공자 필터
  document.getElementById('filter-provider')?.addEventListener('change', (e) => {
    filterProvider = e.target.value;
    renderHistoryPage();
  });

  // 정렬
  document.getElementById('sort-by')?.addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderHistoryPage();
  });

  // 정렬 순서 토글
  document.getElementById('toggle-sort')?.addEventListener('click', () => {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    renderHistoryPage();
  });

  // 전체 삭제
  document.getElementById('clear-all-history')?.addEventListener('click', handleClearAllHistory);

  // 아이템 액션
  document.querySelectorAll('.history-item-actions button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      switch (action) {
        case 'view':
          handleViewItem(id);
          break;
        case 'copy':
          handleCopyItem(id);
          break;
        case 'reuse':
          handleReuseItem(id);
          break;
        case 'delete':
          handleDeleteItem(id);
          break;
      }
    });
  });

  // 아이템 클릭 (보기)
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      handleViewItem(item.dataset.id);
    });
  });
}

/**
 * 아이템 보기 핸들러
 */
function handleViewItem(id) {
  const history = store.get('history');
  const item = history.find(h => h.id === id);

  if (!item) {
    toast.error('항목을 찾을 수 없습니다');
    return;
  }

  setResult(item);
  router.navigate('result');
}

/**
 * 아이템 복사 핸들러
 */
async function handleCopyItem(id) {
  const history = store.get('history');
  const item = history.find(h => h.id === id);

  if (!item) {
    toast.error('항목을 찾을 수 없습니다');
    return;
  }

  const success = await copyToClipboard(item.content);
  if (success) {
    toast.success('내용이 복사되었습니다');
  } else {
    toast.error('복사에 실패했습니다');
  }
}

/**
 * 아이템 재사용 핸들러
 */
async function handleReuseItem(id) {
  const history = store.get('history');
  const item = history.find(h => h.id === id);

  if (!item) {
    toast.error('항목을 찾을 수 없습니다');
    return;
  }

  const choice = await modal.confirm({
    title: '글 재사용',
    message: '이 글의 설정을 사용하여 새 글을 생성하시겠습니까?',
    confirmText: '재사용'
  });

  if (!choice) return;

  store.setState({
    currentGeneration: {
      ...store.get('currentGeneration'),
      topic: item.title || '',
      keywords: item.keywords || [],
      style: item.style || 'casual',
      provider: item.provider || 'anthropic',
      model: item.model
    }
  });

  router.navigate('home');
  toast.success('설정이 복원되었습니다');
}

/**
 * 아이템 삭제 핸들러
 */
async function handleDeleteItem(id) {
  const confirmed = await modal.confirm({
    title: '항목 삭제',
    message: '이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    confirmText: '삭제',
    danger: true
  });

  if (!confirmed) return;

  deleteHistoryItem(id);
  toast.success('항목이 삭제되었습니다');
  renderHistoryPage();
}

/**
 * 전체 삭제 핸들러
 */
async function handleClearAllHistory() {
  const confirmed = await modal.confirm({
    title: '전체 삭제',
    message: '모든 히스토리를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
    confirmText: '전체 삭제',
    danger: true
  });

  if (!confirmed) return;

  clearHistory();
  toast.success('히스토리가 삭제되었습니다');
  renderHistoryPage();
}
