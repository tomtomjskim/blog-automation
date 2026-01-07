/**
 * Blog Automation - UI Components
 * 재사용 가능한 UI 컴포넌트
 */

/**
 * 드롭다운 컴포넌트
 */
class Dropdown {
  constructor(trigger, options = {}) {
    this.trigger = trigger;
    this.options = options;
    this.menu = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    document.addEventListener('click', () => {
      if (this.isOpen) this.close();
    });
  }

  open() {
    if (this.isOpen) return;

    const { items, onSelect, align = 'left' } = this.options;

    this.menu = document.createElement('div');
    this.menu.className = `dropdown-menu dropdown-${align}`;
    this.menu.innerHTML = items.map((item, index) => {
      if (item.divider) {
        return '<div class="dropdown-divider"></div>';
      }
      return `
        <button class="dropdown-item ${item.danger ? 'danger' : ''}" data-index="${index}">
          ${item.icon ? `<span class="dropdown-item-icon">${item.icon}</span>` : ''}
          <span>${item.label}</span>
        </button>
      `;
    }).join('');

    this.menu.querySelectorAll('.dropdown-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(btn.dataset.index);
        const item = items[index];
        if (item && !item.divider) {
          onSelect?.(item, index);
          item.onClick?.();
        }
        this.close();
      });
    });

    this.trigger.parentElement.appendChild(this.menu);
    this.isOpen = true;

    // 위치 조정
    requestAnimationFrame(() => {
      const rect = this.trigger.getBoundingClientRect();
      const menuRect = this.menu.getBoundingClientRect();

      if (rect.bottom + menuRect.height > window.innerHeight) {
        this.menu.style.bottom = '100%';
        this.menu.style.top = 'auto';
      }
    });
  }

  close() {
    if (!this.isOpen || !this.menu) return;
    this.menu.remove();
    this.menu = null;
    this.isOpen = false;
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }
}

/**
 * 태그 입력 컴포넌트
 */
class TagInput {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      placeholder: '태그 입력 후 Enter',
      maxTags: 10,
      onChange: null,
      ...options
    };
    this.tags = options.initialTags || [];

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="tag-input-wrapper">
        <div class="tag-input-tags"></div>
        <input type="text" class="tag-input-field" placeholder="${this.options.placeholder}">
      </div>
    `;

    this.tagsContainer = this.container.querySelector('.tag-input-tags');
    this.input = this.container.querySelector('.tag-input-field');

    this.renderTags();
  }

  renderTags() {
    this.tagsContainer.innerHTML = this.tags.map((tag, index) => `
      <span class="tag tag-removable">
        ${tag}
        <button class="tag-remove" data-index="${index}">✕</button>
      </span>
    `).join('');

    this.tagsContainer.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.removeTag(index);
      });
    });
  }

  bindEvents() {
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        this.addTag(this.input.value);
      } else if (e.key === 'Backspace' && !this.input.value && this.tags.length > 0) {
        this.removeTag(this.tags.length - 1);
      }
    });

    this.input.addEventListener('blur', () => {
      if (this.input.value) {
        this.addTag(this.input.value);
      }
    });
  }

  addTag(value) {
    const tag = value.trim().replace(',', '');
    if (!tag || this.tags.includes(tag) || this.tags.length >= this.options.maxTags) {
      this.input.value = '';
      return;
    }

    this.tags.push(tag);
    this.input.value = '';
    this.renderTags();
    this.options.onChange?.(this.tags);
  }

  removeTag(index) {
    this.tags.splice(index, 1);
    this.renderTags();
    this.options.onChange?.(this.tags);
  }

  getTags() {
    return [...this.tags];
  }

  setTags(tags) {
    this.tags = [...tags];
    this.renderTags();
  }

  clear() {
    this.tags = [];
    this.input.value = '';
    this.renderTags();
  }
}

/**
 * 탭 컴포넌트
 */
class Tabs {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      tabs: [],
      defaultTab: 0,
      onChange: null,
      ...options
    };
    this.activeIndex = this.options.defaultTab;

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    const { tabs } = this.options;

    this.container.innerHTML = `
      <div class="tabs">
        ${tabs.map((tab, index) => `
          <button class="tab ${index === this.activeIndex ? 'active' : ''}" data-index="${index}">
            ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
            <span>${tab.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="tab-content"></div>
    `;

    this.tabsEl = this.container.querySelector('.tabs');
    this.contentEl = this.container.querySelector('.tab-content');

    this.renderContent();
  }

  renderContent() {
    const tab = this.options.tabs[this.activeIndex];
    if (tab?.content) {
      if (typeof tab.content === 'function') {
        const result = tab.content();
        if (typeof result === 'string') {
          this.contentEl.innerHTML = result;
        } else if (result instanceof HTMLElement) {
          this.contentEl.innerHTML = '';
          this.contentEl.appendChild(result);
        }
      } else {
        this.contentEl.innerHTML = tab.content;
      }
    }
  }

  bindEvents() {
    this.tabsEl.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.setActive(index);
      });
    });
  }

  setActive(index) {
    if (index === this.activeIndex) return;

    this.activeIndex = index;

    this.tabsEl.querySelectorAll('.tab').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    this.renderContent();
    this.options.onChange?.(index, this.options.tabs[index]);
  }

  getActive() {
    return this.activeIndex;
  }
}

/**
 * 로딩 오버레이
 */
function showLoading(container, message = '로딩 중...') {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="spinner spinner-lg"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;

  if (container) {
    container.style.position = 'relative';
    container.appendChild(overlay);
  }

  return {
    update(newMessage) {
      overlay.querySelector('.loading-message').textContent = newMessage;
    },
    hide() {
      overlay.remove();
    }
  };
}

/**
 * 스켈레톤 로딩
 */
function createSkeleton(type = 'text', count = 1) {
  const items = [];

  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'text':
        items.push('<div class="skeleton" style="height: 16px; width: 100%; margin-bottom: 8px;"></div>');
        break;
      case 'title':
        items.push('<div class="skeleton" style="height: 24px; width: 60%; margin-bottom: 16px;"></div>');
        break;
      case 'card':
        items.push(`
          <div class="card">
            <div class="card-body">
              <div class="skeleton" style="height: 24px; width: 60%; margin-bottom: 12px;"></div>
              <div class="skeleton" style="height: 16px; width: 100%; margin-bottom: 8px;"></div>
              <div class="skeleton" style="height: 16px; width: 80%;"></div>
            </div>
          </div>
        `);
        break;
      case 'avatar':
        items.push('<div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>');
        break;
    }
  }

  return items.join('');
}

/**
 * 빈 상태 컴포넌트
 */
function createEmptyState(options = {}) {
  const {
    icon = '📭',
    title = '데이터가 없습니다',
    description = '',
    action = null
  } = options;

  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3 class="empty-state-title">${title}</h3>
      ${description ? `<p class="empty-state-desc">${description}</p>` : ''}
      ${action ? `<button class="btn btn-primary mt-4">${action.label}</button>` : ''}
    </div>
  `;
}

/**
 * 복사 버튼
 */
async function copyToClipboard(text, successMessage = '복사되었습니다') {
  try {
    await navigator.clipboard.writeText(text);
    // toast는 외부에서 import하여 사용
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
}

/**
 * 날짜 포맷
 */
function formatDate(date, format = 'relative') {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  if (format === 'relative') {
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
  }

  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 숫자 포맷
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

// 드롭다운 스타일 추가
const dropdownStyles = `
  .dropdown-menu {
    position: absolute;
    top: 100%;
    margin-top: 4px;
    min-width: 160px;
    background: var(--bg-primary, white);
    border: 1px solid var(--border-light, #E5E8EB);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    padding: 8px;
    z-index: var(--z-dropdown, 100);
    animation: fadeIn 0.15s ease;
  }

  .dropdown-left { left: 0; }
  .dropdown-right { right: 0; }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    color: var(--text-secondary, #333D4B);
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .dropdown-item:hover {
    background-color: var(--bg-tertiary, #F2F4F6);
  }

  .dropdown-item.danger {
    color: var(--error, #FF4545);
  }

  .dropdown-item.danger:hover {
    background-color: var(--error-light, #FFEBEB);
  }

  .dropdown-item-icon {
    font-size: 16px;
  }

  .dropdown-divider {
    height: 1px;
    background-color: var(--border-light, #E5E8EB);
    margin: 8px 0;
  }

  .tag-input-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-primary, white);
    border: 1px solid var(--border-light, #E5E8EB);
    border-radius: 12px;
    min-height: 48px;
    align-items: center;
    transition: all 0.15s ease;
  }

  .tag-input-wrapper:focus-within {
    border-color: var(--primary, #0066FF);
    box-shadow: 0 0 0 3px var(--primary-light, #E5F0FF);
  }

  .tag-input-field {
    flex: 1;
    min-width: 100px;
    border: none;
    outline: none;
    font-size: 14px;
    background: transparent;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .loading-message {
    font-size: 14px;
    color: var(--text-tertiary, #6B7684);
  }
`;

// 스타일 주입
if (typeof document !== 'undefined' && !document.getElementById('ui-components-styles')) {
  const style = document.createElement('style');
  style.id = 'ui-components-styles';
  style.textContent = dropdownStyles;
  document.head.appendChild(style);
}

export {
  Dropdown,
  TagInput,
  Tabs,
  showLoading,
  createSkeleton,
  createEmptyState,
  copyToClipboard,
  formatDate,
  formatNumber
};
