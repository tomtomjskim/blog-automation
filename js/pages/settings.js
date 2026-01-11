/**
 * Blog Automation - Settings Page
 * API 키 및 앱 설정 관리
 */

import { store, setApiKeys, updateSettings, applyTheme, setNaverBlogConnection } from '../state.js';
import { secureStorage } from '../core/crypto.js';
import { storage } from '../core/storage.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';
import { llmService } from '../services/llm-service.js';
import { naverBlogService } from '../services/naver-blog.js';
import { Tabs } from '../ui/components.js';

let currentTab = 'api';

/**
 * 설정 페이지 렌더링
 */
export function renderSettingsPage() {
  const app = document.getElementById('app');
  const { settings, apiKeys, naverBlog, unlocked } = store.getState();

  app.innerHTML = `
    <div class="settings-page">
      <div class="container container-md">
        <!-- 헤더 -->
        <div class="page-header">
          <div class="page-header-content">
            <h1 class="page-title">⚙️ 설정</h1>
            <p class="page-description">API 키와 앱 환경을 설정하세요</p>
          </div>
        </div>

        <!-- 잠금 상태 확인 -->
        ${!unlocked ? renderLockScreen() : renderSettingsTabs(settings, apiKeys, naverBlog)}
      </div>
    </div>
  `;

  // 이벤트 바인딩
  bindSettingsEvents();
}

/**
 * 잠금 화면 렌더링
 */
function renderLockScreen() {
  const hasExistingPassword = secureStorage.hasStoredData();

  // 첫 사용자 온보딩 화면
  if (!hasExistingPassword) {
    return `
      <div class="card">
        <div class="card-body">
          <div class="lock-screen onboarding">
            <div class="lock-icon">🔐</div>
            <h2 class="lock-title">API 키 보호하기</h2>
            <p class="lock-desc">
              마스터 비밀번호를 설정하면 API 키가 암호화되어<br>
              안전하게 보관됩니다.
            </p>

            <div class="onboarding-benefits mt-4">
              <div class="benefit-item">
                <span class="benefit-icon">🔒</span>
                <span class="benefit-text">AES-256 암호화로 안전하게 저장</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🛡️</span>
                <span class="benefit-text">브라우저 종료 후에도 암호화 유지</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">⚡</span>
                <span class="benefit-text">한 번 설정으로 모든 API 키 보호</span>
              </div>
            </div>

            <form id="setup-password-form" class="mt-6">
              <div class="input-group">
                <label class="input-label">새 비밀번호</label>
                <input type="password" class="input" id="new-password"
                  placeholder="비밀번호 입력 (최소 4자)" autocomplete="new-password" minlength="4">
              </div>
              <div class="input-group mt-3">
                <label class="input-label">비밀번호 확인</label>
                <input type="password" class="input" id="confirm-password"
                  placeholder="비밀번호 다시 입력" autocomplete="new-password">
              </div>
              <button type="submit" class="btn btn-primary btn-lg w-full mt-4">
                🔐 비밀번호 설정하기
              </button>
            </form>

            <button type="button" class="btn btn-ghost w-full mt-2" id="skip-security">
              나중에 설정하기
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 기존 사용자 잠금 해제 화면
  return `
    <div class="card">
      <div class="card-body">
        <div class="lock-screen">
          <div class="lock-icon">🔒</div>
          <h2 class="lock-title">보안 잠금</h2>
          <p class="lock-desc">API 키를 확인하려면 비밀번호를 입력하세요</p>
          <form id="unlock-form" class="mt-6">
            <div class="input-group">
              <input type="password" class="input" id="unlock-password"
                placeholder="비밀번호 입력" autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary btn-lg w-full mt-4">
              잠금 해제
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

/**
 * 설정 탭 렌더링
 */
function renderSettingsTabs(settings, apiKeys, naverBlog) {
  return `
    <div class="settings-tabs">
      <div class="tabs mb-4">
        <button class="tab ${currentTab === 'api' ? 'active' : ''}" data-tab="api">
          🔑 API 키
        </button>
        <button class="tab ${currentTab === 'naver' ? 'active' : ''}" data-tab="naver">
          📝 네이버 블로그
        </button>
        <button class="tab ${currentTab === 'general' ? 'active' : ''}" data-tab="general">
          ⚙️ 일반 설정
        </button>
        <button class="tab ${currentTab === 'data' ? 'active' : ''}" data-tab="data">
          💾 데이터 관리
        </button>
      </div>

      <div class="tab-content">
        ${currentTab === 'api' ? renderApiKeysTab(apiKeys) : ''}
        ${currentTab === 'naver' ? renderNaverTab(naverBlog) : ''}
        ${currentTab === 'general' ? renderGeneralTab(settings) : ''}
        ${currentTab === 'data' ? renderDataTab() : ''}
      </div>
    </div>
  `;
}

/**
 * API 키 탭 렌더링
 */
function renderApiKeysTab(apiKeys) {
  const providers = [
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      icon: '🤖',
      desc: 'Claude 모델 사용 (추천)',
      link: 'https://console.anthropic.com/settings/keys'
    },
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🧠',
      desc: 'GPT 모델 및 DALL-E 이미지 생성',
      link: 'https://platform.openai.com/api-keys'
    },
    {
      id: 'google',
      name: 'Google (Gemini)',
      icon: '💎',
      desc: 'Gemini 모델 사용',
      link: 'https://makersuite.google.com/app/apikey'
    },
    {
      id: 'groq',
      name: 'Groq',
      icon: '⚡',
      desc: '빠른 추론 속도 (무료)',
      link: 'https://console.groq.com/keys'
    },
    {
      id: 'stability',
      name: 'Stability AI',
      icon: '🎨',
      desc: 'Stable Diffusion 이미지 생성',
      link: 'https://platform.stability.ai/account/keys'
    }
  ];

  // 검색 API 설정
  const searchApis = [
    {
      id: 'serperApiKey',
      name: 'Serper',
      icon: '🔍',
      desc: 'Google 검색 API (팩트체크, 최신 정보 수집)',
      link: 'https://serper.dev/',
      limits: '무료: 2,500 쿼리/월'
    },
    {
      id: 'tavilyApiKey',
      name: 'Tavily',
      icon: '🌐',
      desc: 'AI 검색 API (요약 기능 포함)',
      link: 'https://tavily.com/',
      limits: '무료: 1,000 쿼리/월'
    }
  ];

  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">API 키 관리</h2>
        <p class="card-desc">각 서비스의 API 키를 입력하세요. 키는 암호화되어 저장됩니다.</p>
      </div>
      <div class="card-body">
        <form id="api-keys-form">
          <!-- LLM API 키 섹션 -->
          <h3 class="section-title">AI 모델 API</h3>
          ${providers.map(provider => `
            <div class="api-key-item">
              <div class="api-key-header">
                <span class="api-key-icon">${provider.icon}</span>
                <div class="api-key-info">
                  <span class="api-key-name">${provider.name}</span>
                  <span class="api-key-desc">${provider.desc}</span>
                </div>
                <span class="api-key-status ${apiKeys[provider.id] ? 'connected' : ''}">
                  ${apiKeys[provider.id] ? '✓ 연결됨' : '미설정'}
                </span>
              </div>
              <div class="api-key-input-wrapper">
                <input type="password"
                  class="input api-key-input"
                  id="api-${provider.id}"
                  placeholder="${apiKeys[provider.id] ? '••••••••••••••••' : 'API 키 입력'}"
                  data-provider="${provider.id}">
                <button type="button" class="btn btn-ghost btn-sm toggle-visibility" data-target="api-${provider.id}">
                  👁
                </button>
                <a href="${provider.link}" target="_blank" class="btn btn-ghost btn-sm" title="API 키 발급">
                  🔗
                </a>
              </div>
            </div>
          `).join('')}

          <!-- 검색 API 키 섹션 -->
          <div class="search-api-section">
            <div class="search-api-header">
              <h4>검색 API</h4>
              <span class="search-api-badge">팩트체크</span>
            </div>
            <p class="card-desc mb-4">최신 정보 수집 및 팩트체크 기능을 사용하려면 검색 API를 설정하세요.</p>

            <div class="search-api-cards">
              ${searchApis.map(api => `
                <div class="search-api-card">
                  <div class="search-api-card-header">
                    <span class="search-api-name">${api.icon} ${api.name}</span>
                    <span class="search-api-status ${apiKeys[api.id] ? 'active' : 'inactive'}">
                      ${apiKeys[api.id] ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div class="search-api-desc">${api.desc}</div>
                  <div class="search-api-limits">${api.limits}</div>
                  <div class="api-key-input-wrapper">
                    <input type="password"
                      class="input api-key-input"
                      id="api-${api.id}"
                      placeholder="${apiKeys[api.id] ? '••••••••••••••••' : 'API 키 입력'}"
                      data-provider="${api.id}">
                    <button type="button" class="btn btn-ghost btn-sm toggle-visibility" data-target="api-${api.id}">
                      👁
                    </button>
                    <a href="${api.link}" target="_blank" class="btn btn-ghost btn-sm" title="API 키 발급">
                      🔗
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="form-actions mt-6">
            <button type="button" class="btn btn-secondary" id="test-api-keys">
              연결 테스트
            </button>
            <button type="submit" class="btn btn-primary">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * 네이버 블로그 탭 렌더링
 */
function renderNaverTab(naverBlog) {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">네이버 블로그 연동</h2>
        <p class="card-desc">블로그에 글을 자동으로 포스팅하려면 연동을 설정하세요.</p>
      </div>
      <div class="card-body">
        ${naverBlog.connected ? `
          <div class="naver-connected">
            <div class="connected-info">
              <span class="connected-icon">✅</span>
              <div>
                <strong>${naverBlog.userId}</strong>
                <span>연결됨</span>
              </div>
            </div>
            <button class="btn btn-secondary" id="disconnect-naver">
              연동 해제
            </button>
          </div>

          <div class="naver-categories mt-6">
            <h3 class="section-title">블로그 카테고리</h3>
            ${naverBlog.categories?.length > 0 ? `
              <div class="category-list">
                ${naverBlog.categories.map(cat => `
                  <span class="tag">${cat.categoryName}</span>
                `).join('')}
              </div>
            ` : `
              <p class="text-muted">카테고리를 불러오는 중...</p>
            `}
            <button class="btn btn-ghost btn-sm mt-2" id="refresh-categories">
              🔄 새로고침
            </button>
          </div>
        ` : `
          <form id="naver-connect-form">
            <div class="input-group">
              <label class="input-label">네이버 아이디</label>
              <input type="text" class="input" id="naver-user-id" placeholder="블로그 아이디">
              <span class="input-hint">blog.naver.com/[아이디]</span>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">API 비밀번호</label>
              <input type="password" class="input" id="naver-api-password"
                placeholder="Open API 비밀번호">
              <span class="input-hint">
                <a href="https://admin.blog.naver.com/openapi" target="_blank">
                  Open API 비밀번호 발급받기 →
                </a>
              </span>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-full mt-6">
              연동하기
            </button>
          </form>

          <div class="naver-guide mt-6">
            <h3 class="section-title">연동 방법</h3>
            <ol class="guide-steps">
              <li>네이버 블로그 관리에서 Open API 설정 페이지로 이동</li>
              <li>API 비밀번호 발급 (비밀번호는 한 번만 표시됨)</li>
              <li>발급받은 비밀번호를 위에 입력</li>
            </ol>
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * 일반 설정 탭 렌더링
 */
function renderGeneralTab(settings) {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">일반 설정</h2>
      </div>
      <div class="card-body">
        <!-- 테마 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">테마</span>
            <span class="setting-desc">앱의 색상 테마를 선택합니다</span>
          </div>
          <select class="input select setting-control" id="setting-theme">
            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>라이트</option>
            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>다크</option>
            <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>시스템</option>
          </select>
        </div>

        <!-- 기본 제공자 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">기본 AI 제공자</span>
            <span class="setting-desc">글 생성 시 기본으로 사용할 AI</span>
          </div>
          <select class="input select setting-control" id="setting-provider">
            <option value="anthropic" ${settings.defaults?.provider === 'anthropic' ? 'selected' : ''}>Claude (Anthropic)</option>
            <option value="openai" ${settings.defaults?.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
            <option value="google" ${settings.defaults?.provider === 'google' ? 'selected' : ''}>Gemini (Google)</option>
            <option value="groq" ${settings.defaults?.provider === 'groq' ? 'selected' : ''}>Groq</option>
          </select>
        </div>

        <!-- 기본 스타일 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">기본 글 스타일</span>
            <span class="setting-desc">글 생성 시 기본 문체</span>
          </div>
          <select class="input select setting-control" id="setting-style">
            <option value="casual" ${settings.defaults?.style === 'casual' ? 'selected' : ''}>친근한</option>
            <option value="professional" ${settings.defaults?.style === 'professional' ? 'selected' : ''}>전문적</option>
            <option value="humorous" ${settings.defaults?.style === 'humorous' ? 'selected' : ''}>유머러스</option>
            <option value="storytelling" ${settings.defaults?.style === 'storytelling' ? 'selected' : ''}>스토리텔링</option>
          </select>
        </div>

        <!-- 기본 길이 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">기본 글 길이</span>
            <span class="setting-desc">글 생성 시 기본 분량</span>
          </div>
          <select class="input select setting-control" id="setting-length">
            <option value="short" ${settings.defaults?.length === 'short' ? 'selected' : ''}>짧게 (~500자)</option>
            <option value="medium" ${settings.defaults?.length === 'medium' ? 'selected' : ''}>보통 (~1000자)</option>
            <option value="long" ${settings.defaults?.length === 'long' ? 'selected' : ''}>길게 (~2000자)</option>
          </select>
        </div>

        <!-- 자동 저장 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">자동 저장</span>
            <span class="setting-desc">작성 중인 내용을 자동으로 저장합니다</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="setting-autosave" ${settings.autosave !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 스트리밍 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">실시간 출력</span>
            <span class="setting-desc">글 생성 시 실시간으로 내용을 표시합니다</span>
          </div>
          <label class="toggle">
            <input type="checkbox" id="setting-streaming" ${settings.streaming !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="form-actions mt-6">
          <button class="btn btn-primary" id="save-general-settings">
            설정 저장
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 데이터 관리 탭 렌더링
 */
function renderDataTab() {
  const usage = storage.getUsage();
  const history = storage.getHistory();
  const drafts = storage.getDrafts();

  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">데이터 관리</h2>
      </div>
      <div class="card-body">
        <!-- 사용량 통계 -->
        <div class="data-stats">
          <div class="stat-item">
            <span class="stat-value">${history.items?.length || 0}</span>
            <span class="stat-label">생성된 글</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${drafts.items?.length || 0}</span>
            <span class="stat-label">임시저장</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${usage.totalTokens?.toLocaleString() || 0}</span>
            <span class="stat-label">총 토큰</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">$${usage.totalCost?.toFixed(4) || '0.0000'}</span>
            <span class="stat-label">총 비용</span>
          </div>
        </div>

        <!-- 데이터 관리 버튼 -->
        <div class="data-actions mt-6">
          <div class="action-item">
            <div class="action-info">
              <span class="action-label">데이터 내보내기</span>
              <span class="action-desc">모든 데이터를 JSON 파일로 저장</span>
            </div>
            <button class="btn btn-secondary" id="export-data">
              📤 내보내기
            </button>
          </div>

          <div class="action-item">
            <div class="action-info">
              <span class="action-label">데이터 가져오기</span>
              <span class="action-desc">JSON 파일에서 데이터 복원</span>
            </div>
            <button class="btn btn-secondary" id="import-data">
              📥 가져오기
            </button>
            <input type="file" id="import-file" accept=".json" style="display:none">
          </div>

          <div class="action-item danger">
            <div class="action-info">
              <span class="action-label">히스토리 삭제</span>
              <span class="action-desc">생성된 모든 글 기록을 삭제</span>
            </div>
            <button class="btn btn-danger" id="clear-history">
              🗑 삭제
            </button>
          </div>

          <div class="action-item danger">
            <div class="action-info">
              <span class="action-label">모든 데이터 삭제</span>
              <span class="action-desc">API 키, 히스토리, 설정 모두 삭제</span>
            </div>
            <button class="btn btn-danger" id="clear-all-data">
              ⚠️ 전체 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 이벤트 바인딩
 */
function bindSettingsEvents() {
  // 탭 전환
  document.querySelectorAll('.tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab;
      renderSettingsPage();
    });
  });

  // 잠금 해제
  document.getElementById('unlock-form')?.addEventListener('submit', handleUnlock);

  // 새 비밀번호 설정 (온보딩)
  document.getElementById('setup-password-form')?.addEventListener('submit', handleSetupPassword);

  // 보안 설정 스킵
  document.getElementById('skip-security')?.addEventListener('click', handleSkipSecurity);

  // API 키 저장
  document.getElementById('api-keys-form')?.addEventListener('submit', handleSaveApiKeys);

  // API 키 테스트
  document.getElementById('test-api-keys')?.addEventListener('click', handleTestApiKeys);

  // 비밀번호 표시 토글
  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  // 네이버 연동
  document.getElementById('naver-connect-form')?.addEventListener('submit', handleNaverConnect);
  document.getElementById('disconnect-naver')?.addEventListener('click', handleNaverDisconnect);
  document.getElementById('refresh-categories')?.addEventListener('click', handleRefreshCategories);

  // 일반 설정 저장
  document.getElementById('save-general-settings')?.addEventListener('click', handleSaveGeneralSettings);

  // 데이터 관리
  document.getElementById('export-data')?.addEventListener('click', handleExportData);
  document.getElementById('import-data')?.addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file')?.addEventListener('change', handleImportData);
  document.getElementById('clear-history')?.addEventListener('click', handleClearHistory);
  document.getElementById('clear-all-data')?.addEventListener('click', handleClearAllData);
}

/**
 * 잠금 해제 핸들러
 */
async function handleUnlock(e) {
  e.preventDefault();

  const password = document.getElementById('unlock-password').value;
  if (!password) {
    toast.error('비밀번호를 입력하세요');
    return;
  }

  try {
    // 저장된 암호화 데이터 확인
    const encryptedData = localStorage.getItem('blog_auto_keys');

    if (encryptedData) {
      // 기존 데이터 복호화 시도
      const keys = await secureStorage.decrypt(JSON.parse(encryptedData), password);
      setApiKeys(keys);
    } else {
      // 새 비밀번호 설정
      storage.updateSetting('passwordHash', await hashPassword(password));
    }

    store.setState({ unlocked: true });
    toast.success('잠금이 해제되었습니다');
    renderSettingsPage();
  } catch (error) {
    toast.error('비밀번호가 올바르지 않습니다');
  }
}

/**
 * 새 비밀번호 설정 핸들러 (온보딩)
 */
async function handleSetupPassword(e) {
  e.preventDefault();

  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!newPassword || !confirmPassword) {
    toast.error('비밀번호를 입력하세요');
    return;
  }

  if (newPassword.length < 4) {
    toast.error('비밀번호는 최소 4자 이상이어야 합니다');
    return;
  }

  if (newPassword !== confirmPassword) {
    toast.error('비밀번호가 일치하지 않습니다');
    return;
  }

  try {
    // 빈 API 키로 초기화 및 암호화
    const emptyKeys = {};
    await secureStorage.saveSecure(emptyKeys, newPassword);

    store.setState({ unlocked: true });
    toast.success('비밀번호가 설정되었습니다! 이제 API 키를 안전하게 저장할 수 있습니다.');
    renderSettingsPage();
  } catch (error) {
    toast.error('비밀번호 설정에 실패했습니다');
    console.error('Setup password error:', error);
  }
}

/**
 * 보안 설정 스킵 핸들러
 */
function handleSkipSecurity() {
  store.setState({ unlocked: true });
  toast.info('보안 설정을 건너뛰었습니다. 나중에 설정에서 활성화할 수 있습니다.');
  renderSettingsPage();
}

/**
 * 비밀번호 해시
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * API 키 저장 핸들러
 */
async function handleSaveApiKeys(e) {
  e.preventDefault();

  const keys = {};
  document.querySelectorAll('.api-key-input').forEach(input => {
    const value = input.value.trim();
    if (value && !value.startsWith('•')) {
      keys[input.dataset.provider] = value;
    }
  });

  if (Object.keys(keys).length === 0) {
    toast.info('변경된 키가 없습니다');
    return;
  }

  try {
    const currentKeys = store.get('apiKeys');
    const newKeys = { ...currentKeys, ...keys };

    // 암호화하여 저장
    const password = await modal.prompt({
      title: '비밀번호 확인',
      message: 'API 키를 암호화하기 위한 비밀번호를 입력하세요',
      placeholder: '비밀번호'
    });

    if (!password) return;

    const encrypted = await secureStorage.encrypt(newKeys, password);
    localStorage.setItem('blog_auto_keys', JSON.stringify(encrypted));

    setApiKeys(newKeys);
    toast.success('API 키가 저장되었습니다');
    renderSettingsPage();
  } catch (error) {
    toast.error('저장에 실패했습니다');
    console.error('Save API keys error:', error);
  }
}

/**
 * API 키 테스트 핸들러
 */
async function handleTestApiKeys() {
  const apiKeys = store.get('apiKeys');
  const results = [];

  toast.info('연결 테스트 중...');

  for (const [provider, key] of Object.entries(apiKeys)) {
    if (!key) continue;

    try {
      const isValid = await llmService.testConnection(provider, key);
      results.push({ provider, success: isValid });
    } catch (error) {
      results.push({ provider, success: false, error: error.message });
    }
  }

  if (results.length === 0) {
    toast.warning('테스트할 API 키가 없습니다');
    return;
  }

  const successCount = results.filter(r => r.success).length;
  const message = results.map(r =>
    `${r.provider}: ${r.success ? '✅ 성공' : '❌ 실패'}`
  ).join('\n');

  await modal.alert({
    title: '연결 테스트 결과',
    message: `${successCount}/${results.length} 연결 성공\n\n${message}`
  });
}

/**
 * 네이버 연동 핸들러
 */
async function handleNaverConnect(e) {
  e.preventDefault();

  const userId = document.getElementById('naver-user-id').value.trim();
  const apiPassword = document.getElementById('naver-api-password').value.trim();

  if (!userId || !apiPassword) {
    toast.error('아이디와 비밀번호를 모두 입력하세요');
    return;
  }

  try {
    toast.info('연동 중...');

    await naverBlogService.connect(userId, apiPassword);
    const categories = await naverBlogService.getCategories();

    setNaverBlogConnection({
      userId,
      apiPassword,
      connected: true,
      categories
    });

    toast.success('네이버 블로그 연동 완료!');
    renderSettingsPage();
  } catch (error) {
    toast.error(error.message || '연동에 실패했습니다');
  }
}

/**
 * 네이버 연동 해제 핸들러
 */
async function handleNaverDisconnect() {
  const confirmed = await modal.confirm({
    title: '연동 해제',
    message: '네이버 블로그 연동을 해제하시겠습니까?',
    confirmText: '해제',
    danger: true
  });

  if (!confirmed) return;

  setNaverBlogConnection({
    userId: null,
    apiPassword: null,
    connected: false,
    categories: []
  });

  toast.success('연동이 해제되었습니다');
  renderSettingsPage();
}

/**
 * 카테고리 새로고침 핸들러
 */
async function handleRefreshCategories() {
  try {
    const categories = await naverBlogService.getCategories();
    setNaverBlogConnection({ categories });
    toast.success('카테고리를 새로고침했습니다');
    renderSettingsPage();
  } catch (error) {
    toast.error('카테고리 로드 실패');
  }
}

/**
 * 일반 설정 저장 핸들러
 */
function handleSaveGeneralSettings() {
  const theme = document.getElementById('setting-theme').value;
  const provider = document.getElementById('setting-provider').value;
  const style = document.getElementById('setting-style').value;
  const length = document.getElementById('setting-length').value;
  const autosave = document.getElementById('setting-autosave').checked;
  const streaming = document.getElementById('setting-streaming').checked;

  applyTheme(theme);

  updateSettings({
    theme,
    autosave,
    streaming,
    defaults: { provider, style, length }
  });

  toast.success('설정이 저장되었습니다');
}

/**
 * 데이터 내보내기 핸들러
 */
function handleExportData() {
  const data = {
    settings: storage.getSettings(),
    history: storage.getHistory(),
    drafts: storage.getDrafts(),
    templates: storage.getTemplates(),
    usage: storage.getUsage(),
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `blog-automation-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
  toast.success('데이터를 내보냈습니다');
}

/**
 * 데이터 가져오기 핸들러
 */
async function handleImportData(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const confirmed = await modal.confirm({
      title: '데이터 가져오기',
      message: '기존 데이터가 덮어씌워집니다. 계속하시겠습니까?',
      confirmText: '가져오기'
    });

    if (!confirmed) return;

    if (data.settings) storage.saveSettings(data.settings);
    if (data.history?.items) {
      data.history.items.forEach(item => storage.addToHistory(item));
    }
    if (data.drafts?.items) {
      data.drafts.items.forEach(item => storage.saveDraft(item));
    }
    if (data.templates?.items) {
      data.templates.items.forEach(item => storage.saveTemplate(item));
    }

    toast.success('데이터를 가져왔습니다');
    window.location.reload();
  } catch (error) {
    toast.error('파일을 읽을 수 없습니다');
  }
}

/**
 * 히스토리 삭제 핸들러
 */
async function handleClearHistory() {
  const confirmed = await modal.confirm({
    title: '히스토리 삭제',
    message: '생성된 모든 글 기록이 삭제됩니다. 계속하시겠습니까?',
    confirmText: '삭제',
    danger: true
  });

  if (!confirmed) return;

  storage.clearHistory();
  store.setState({ history: [] });
  toast.success('히스토리가 삭제되었습니다');
  renderSettingsPage();
}

/**
 * 전체 데이터 삭제 핸들러
 */
async function handleClearAllData() {
  const confirmed = await modal.confirm({
    title: '전체 데이터 삭제',
    message: 'API 키, 히스토리, 설정 등 모든 데이터가 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.',
    confirmText: '모두 삭제',
    danger: true
  });

  if (!confirmed) return;

  const finalConfirm = await modal.prompt({
    title: '최종 확인',
    message: '정말 삭제하려면 "삭제"를 입력하세요',
    placeholder: '삭제'
  });

  if (finalConfirm !== '삭제') {
    toast.info('삭제가 취소되었습니다');
    return;
  }

  localStorage.clear();
  toast.success('모든 데이터가 삭제되었습니다');
  window.location.reload();
}
