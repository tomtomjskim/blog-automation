/**
 * Blog Automation - Storage Module
 * localStorage 래퍼 및 데이터 관리
 */

const STORAGE_KEYS = {
  SETTINGS: 'blog_auto_settings',
  HISTORY: 'blog_auto_history',
  DRAFTS: 'blog_auto_drafts',
  TEMPLATES: 'blog_auto_templates',
  USAGE: 'blog_auto_usage'
};

const DEFAULTS = {
  settings: {
    version: 1,
    defaults: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      style: 'casual',
      length: 'medium'
    },
    theme: 'light',
    naverBlog: {
      defaultCategory: null,
      defaultPublic: true
    },
    ui: {
      showTokenUsage: true,
      showCost: true,
      autoSave: true,
      keyboardShortcuts: true
    }
  },
  history: {
    version: 1,
    items: [],
    maxItems: 50
  },
  drafts: {
    version: 1,
    items: [],
    maxItems: 10
  },
  templates: {
    version: 1,
    items: []
  },
  usage: {
    version: 1,
    total: { requests: 0, tokens: 0, cost: 0 },
    daily: {}
  }
};

class Storage {
  constructor() {
    this.cache = new Map();
  }

  /**
   * localStorage 지원 확인
   */
  isSupported() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 데이터 저장
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      this.cache.set(key, value);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  /**
   * 데이터 로드
   */
  get(key, defaultValue = null) {
    // 캐시 확인
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      const parsed = JSON.parse(item);
      this.cache.set(key, parsed);
      return parsed;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  /**
   * 데이터 삭제
   */
  remove(key) {
    localStorage.removeItem(key);
    this.cache.delete(key);
  }

  /**
   * 전체 삭제
   */
  clear() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.cache.clear();
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // ===== Settings =====
  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS, DEFAULTS.settings);
  }

  saveSettings(settings) {
    const current = this.getSettings();
    const merged = { ...current, ...settings };
    return this.set(STORAGE_KEYS.SETTINGS, merged);
  }

  updateSetting(path, value) {
    const settings = this.getSettings();
    const keys = path.split('.');
    let obj = settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    return this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // ===== History =====
  getHistory() {
    return this.get(STORAGE_KEYS.HISTORY, DEFAULTS.history);
  }

  addToHistory(item) {
    const history = this.getHistory();

    const newItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...item,
      createdAt: new Date().toISOString()
    };

    history.items.unshift(newItem);

    // 최대 개수 유지
    while (history.items.length > history.maxItems) {
      history.items.pop();
    }

    this.set(STORAGE_KEYS.HISTORY, history);
    return newItem;
  }

  getHistoryItem(id) {
    const history = this.getHistory();
    return history.items.find(item => item.id === id);
  }

  deleteHistoryItem(id) {
    const history = this.getHistory();
    history.items = history.items.filter(item => item.id !== id);
    return this.set(STORAGE_KEYS.HISTORY, history);
  }

  clearHistory() {
    return this.set(STORAGE_KEYS.HISTORY, DEFAULTS.history);
  }

  // ===== Drafts =====
  getDrafts() {
    return this.get(STORAGE_KEYS.DRAFTS, DEFAULTS.drafts);
  }

  saveDraft(draft) {
    const drafts = this.getDrafts();

    const newDraft = {
      id: draft.id || `draft_${Date.now()}`,
      ...draft,
      savedAt: new Date().toISOString()
    };

    // 기존 초안 업데이트 또는 새로 추가
    const existingIndex = drafts.items.findIndex(d => d.id === newDraft.id);
    if (existingIndex >= 0) {
      drafts.items[existingIndex] = newDraft;
    } else {
      drafts.items.unshift(newDraft);
    }

    // 최대 개수 유지
    while (drafts.items.length > drafts.maxItems) {
      drafts.items.pop();
    }

    this.set(STORAGE_KEYS.DRAFTS, drafts);
    return newDraft;
  }

  getDraft(id) {
    const drafts = this.getDrafts();
    return drafts.items.find(d => d.id === id);
  }

  deleteDraft(id) {
    const drafts = this.getDrafts();
    drafts.items = drafts.items.filter(d => d.id !== id);
    return this.set(STORAGE_KEYS.DRAFTS, drafts);
  }

  clearDrafts() {
    return this.set(STORAGE_KEYS.DRAFTS, DEFAULTS.drafts);
  }

  // ===== Templates =====
  getTemplates() {
    return this.get(STORAGE_KEYS.TEMPLATES, DEFAULTS.templates);
  }

  saveTemplate(template) {
    const templates = this.getTemplates();

    const newTemplate = {
      id: template.id || `tmpl_${Date.now()}`,
      ...template,
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = templates.items.findIndex(t => t.id === newTemplate.id);
    if (existingIndex >= 0) {
      templates.items[existingIndex] = newTemplate;
    } else {
      templates.items.unshift(newTemplate);
    }

    this.set(STORAGE_KEYS.TEMPLATES, templates);
    return newTemplate;
  }

  deleteTemplate(id) {
    const templates = this.getTemplates();
    templates.items = templates.items.filter(t => t.id !== id);
    return this.set(STORAGE_KEYS.TEMPLATES, templates);
  }

  // ===== Usage Tracking =====
  getUsage() {
    return this.get(STORAGE_KEYS.USAGE, DEFAULTS.usage);
  }

  trackUsage(event) {
    const usage = this.getUsage();
    const today = new Date().toISOString().split('T')[0];

    if (!usage.daily[today]) {
      usage.daily[today] = {
        requests: 0,
        tokens: { input: 0, output: 0 },
        cost: 0,
        byProvider: {}
      };
    }

    const dayUsage = usage.daily[today];
    dayUsage.requests++;
    dayUsage.tokens.input += event.usage?.promptTokens || 0;
    dayUsage.tokens.output += event.usage?.completionTokens || 0;
    dayUsage.cost += event.cost?.total || 0;

    // Provider별 집계
    const provider = event.provider || 'unknown';
    if (!dayUsage.byProvider[provider]) {
      dayUsage.byProvider[provider] = { requests: 0, tokens: 0, cost: 0 };
    }
    dayUsage.byProvider[provider].requests++;
    dayUsage.byProvider[provider].tokens += event.usage?.totalTokens || 0;
    dayUsage.byProvider[provider].cost += event.cost?.total || 0;

    // 전체 누적
    usage.total.requests++;
    usage.total.tokens += event.usage?.totalTokens || 0;
    usage.total.cost += event.cost?.total || 0;

    // 오래된 데이터 정리 (60일 이상)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    Object.keys(usage.daily).forEach(date => {
      if (new Date(date) < cutoffDate) {
        delete usage.daily[date];
      }
    });

    return this.set(STORAGE_KEYS.USAGE, usage);
  }

  getUsageStats(days = 7) {
    const usage = this.getUsage();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = {
      period: days,
      requests: 0,
      tokens: { input: 0, output: 0 },
      cost: 0,
      byProvider: {},
      byDay: []
    };

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = usage.daily[dateStr] || {
        requests: 0,
        tokens: { input: 0, output: 0 },
        cost: 0
      };

      stats.requests += dayData.requests;
      stats.tokens.input += dayData.tokens?.input || 0;
      stats.tokens.output += dayData.tokens?.output || 0;
      stats.cost += dayData.cost;
      stats.byDay.push({ date: dateStr, ...dayData });

      // Provider별 합산
      Object.entries(dayData.byProvider || {}).forEach(([provider, data]) => {
        if (!stats.byProvider[provider]) {
          stats.byProvider[provider] = { requests: 0, tokens: 0, cost: 0 };
        }
        stats.byProvider[provider].requests += data.requests;
        stats.byProvider[provider].tokens += data.tokens;
        stats.byProvider[provider].cost += data.cost;
      });
    }

    return stats;
  }

  // ===== Migration =====
  migrate() {
    // 버전 마이그레이션 로직
    const settings = this.get(STORAGE_KEYS.SETTINGS);
    if (settings && settings.version < DEFAULTS.settings.version) {
      // 마이그레이션 수행
      const migrated = { ...DEFAULTS.settings, ...settings, version: DEFAULTS.settings.version };
      this.set(STORAGE_KEYS.SETTINGS, migrated);
    }
  }
}

// 싱글톤 인스턴스
const storage = new Storage();

export { storage, STORAGE_KEYS, DEFAULTS };
