/**
 * Blog Automation - Landing Page
 * 서비스 소개 및 랜딩 페이지
 */

import { router } from '../core/router.js';
import { store } from '../state.js';

/**
 * 랜딩 페이지 렌더링
 */
export function renderLandingPage() {
  const app = document.getElementById('app');
  const { apiKeys } = store.getState();
  const hasApiKey = Object.values(apiKeys).some(key => key);

  app.innerHTML = `
    <div class="landing-page">
      <!-- Hero Section -->
      <section class="landing-hero">
        <div class="hero-content">
          <div class="hero-badge">AI-Powered</div>
          <h1 class="hero-title">Blog Automation</h1>
          <p class="hero-subtitle">AI 기반 블로그 글 자동 생성 서비스</p>
          <p class="hero-desc">주제만 입력하면 고품질 블로그 글이 완성됩니다</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" id="cta-write">
              ✏️ 새 글 작성하기
            </button>
            ${!hasApiKey ? `
              <button class="btn btn-secondary btn-lg" id="cta-settings">
                ⚙️ API 키 설정
              </button>
            ` : ''}
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="landing-section">
        <h2 class="section-title">주요 기능</h2>
        <div class="features-grid">
          <div class="feature-card" data-route="write">
            <span class="feature-icon">✏️</span>
            <h3 class="feature-title">글 작성</h3>
            <p class="feature-desc">주제만 입력하면<br>완성된 글이 생성됩니다</p>
          </div>
          <div class="feature-card" data-route="batch">
            <span class="feature-icon">📦</span>
            <h3 class="feature-title">대량 생성</h3>
            <p class="feature-desc">여러 글을<br>한 번에 생성합니다</p>
          </div>
          <div class="feature-card" data-route="schedule">
            <span class="feature-icon">📅</span>
            <h3 class="feature-title">예약 포스팅</h3>
            <p class="feature-desc">원하는 시간에<br>자동으로 발행합니다</p>
          </div>
          <div class="feature-card" data-route="image">
            <span class="feature-icon">🖼️</span>
            <h3 class="feature-title">이미지 생성</h3>
            <p class="feature-desc">AI로 썸네일<br>이미지를 생성합니다</p>
          </div>
        </div>
      </section>

      <!-- LLM Providers -->
      <section class="landing-section">
        <h2 class="section-title">지원 LLM</h2>
        <div class="providers-grid">
          <div class="provider-badge">
            <span class="provider-icon">🤖</span>
            <span>Claude</span>
          </div>
          <div class="provider-badge">
            <span class="provider-icon">🧠</span>
            <span>GPT-4</span>
          </div>
          <div class="provider-badge">
            <span class="provider-icon">💎</span>
            <span>Gemini</span>
          </div>
          <div class="provider-badge">
            <span class="provider-icon">⚡</span>
            <span>Groq</span>
          </div>
        </div>
      </section>

      <!-- Quick Start -->
      <section class="landing-section">
        <h2 class="section-title">빠른 시작</h2>
        <div class="quickstart-steps">
          <div class="step-item">
            <span class="step-number">1</span>
            <div class="step-content">
              <h4>API 키 등록</h4>
              <p>설정에서 사용할 LLM의 API 키를 등록하세요</p>
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">2</span>
            <div class="step-content">
              <h4>주제 입력</h4>
              <p>블로그 글 주제와 키워드를 입력하세요</p>
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">3</span>
            <div class="step-content">
              <h4>글 생성</h4>
              <p>생성 버튼을 누르면 AI가 글을 작성합니다</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Ad Space (Placeholder) -->
      <section class="landing-section ad-section">
        <div class="ad-placeholder">
          <span class="ad-label">광고 영역</span>
        </div>
      </section>

      <!-- Support Section -->
      <section class="landing-section support-section">
        <div class="support-card">
          <span class="support-icon">💝</span>
          <h3>후원하기</h3>
          <p>이 프로젝트가 도움이 되셨다면 후원으로 응원해주세요</p>
          <div class="support-buttons">
            <a href="https://buymeacoffee.com" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
              ☕ Buy me a coffee
            </a>
            <a href="https://github.com/sponsors" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
              💜 GitHub Sponsors
            </a>
          </div>
        </div>

        <div class="support-card">
          <span class="support-icon">📧</span>
          <h3>문의</h3>
          <p>버그 리포트, 기능 제안, 협업 문의</p>
          <div class="contact-links">
            <a href="mailto:contact@example.com" class="contact-link">
              contact@example.com
            </a>
            <a href="https://github.com" target="_blank" rel="noopener" class="contact-link">
              GitHub Issues
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-content">
          <span class="footer-version">v1.0.0</span>
          <span class="footer-divider">|</span>
          <span class="footer-credit">Made with ❤️</span>
        </div>
        <div class="footer-links">
          <button class="btn btn-ghost btn-sm" id="show-shortcuts">⌨️ 단축키</button>
        </div>
      </footer>
    </div>
  `;

  // 스타일 추가
  addLandingStyles();

  // 이벤트 바인딩
  bindLandingEvents();
}

/**
 * 이벤트 바인딩
 */
function bindLandingEvents() {
  // CTA 버튼
  document.getElementById('cta-write')?.addEventListener('click', () => {
    router.navigate('write');
  });

  document.getElementById('cta-settings')?.addEventListener('click', () => {
    router.navigate('settings');
  });

  // 기능 카드 클릭
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
      const route = card.dataset.route;
      if (route) router.navigate(route);
    });
  });

  // 단축키 보기
  document.getElementById('show-shortcuts')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('show-quick-actions'));
  });
}

/**
 * 랜딩 페이지 스타일
 */
function addLandingStyles() {
  if (document.getElementById('landing-styles')) return;

  const style = document.createElement('style');
  style.id = 'landing-styles';
  style.textContent = `
    .landing-page {
      min-height: 100vh;
      background: var(--bg-primary);
    }

    /* Hero Section */
    .landing-hero {
      text-align: center;
      padding: var(--space-12) var(--space-6);
      background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg-secondary) 100%);
      border-bottom: 1px solid var(--border-light);
    }

    .hero-content {
      max-width: 600px;
      margin: 0 auto;
    }

    .hero-badge {
      display: inline-block;
      padding: var(--space-1) var(--space-3);
      background: var(--primary);
      color: white;
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
      border-radius: var(--radius-full);
      margin-bottom: var(--space-4);
    }

    .hero-title {
      font-size: var(--text-4xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
      letter-spacing: -0.02em;
    }

    .hero-subtitle {
      font-size: var(--text-lg);
      color: var(--primary);
      font-weight: var(--font-medium);
      margin: 0 0 var(--space-2);
    }

    .hero-desc {
      font-size: var(--text-base);
      color: var(--text-secondary);
      margin: 0 0 var(--space-6);
    }

    .hero-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Sections */
    .landing-section {
      padding: var(--space-10) var(--space-6);
      max-width: 800px;
      margin: 0 auto;
    }

    .section-title {
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      text-align: center;
      margin: 0 0 var(--space-6);
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }

    .feature-card {
      padding: var(--space-5);
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-xl);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .feature-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
      font-size: 32px;
      display: block;
      margin-bottom: var(--space-3);
    }

    .feature-title {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
    }

    .feature-desc {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      margin: 0;
      line-height: 1.5;
    }

    /* Providers */
    .providers-grid {
      display: flex;
      justify-content: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .provider-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }

    .provider-icon {
      font-size: 16px;
    }

    /* Quick Start */
    .quickstart-steps {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
    }

    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: var(--primary);
      color: white;
      font-weight: var(--font-bold);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .step-content h4 {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-1);
    }

    .step-content p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Ad Section */
    .ad-section {
      padding: var(--space-6);
    }

    .ad-placeholder {
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
      border: 2px dashed var(--border-default);
      border-radius: var(--radius-lg);
    }

    .ad-label {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    /* Support Section */
    .support-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }

    .support-card {
      padding: var(--space-5);
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-xl);
      text-align: center;
    }

    .support-icon {
      font-size: 28px;
      display: block;
      margin-bottom: var(--space-3);
    }

    .support-card h3 {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
    }

    .support-card p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0 0 var(--space-4);
    }

    .support-buttons {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
      flex-wrap: wrap;
    }

    .contact-links {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .contact-link {
      font-size: var(--text-sm);
      color: var(--primary);
      text-decoration: none;
    }

    .contact-link:hover {
      text-decoration: underline;
    }

    /* Footer */
    .landing-footer {
      padding: var(--space-6);
      text-align: center;
      border-top: 1px solid var(--border-light);
      background: var(--bg-secondary);
    }

    .footer-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
      color: var(--text-tertiary);
      font-size: var(--text-sm);
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: var(--space-2);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .hero-title {
        font-size: var(--text-2xl);
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .support-section {
        grid-template-columns: 1fr;
      }

      .hero-actions {
        flex-direction: column;
      }

      .hero-actions .btn {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}
