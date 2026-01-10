/**
 * Blog Automation - Template Manager
 * 블로그 글 템플릿 저장 및 관리
 */

class TemplateManager {
  static STORAGE_KEY = 'blog_auto_templates';
  static PRESET_STATS_KEY = 'blog_auto_templates_preset_stats';
  static MAX_TEMPLATES = 30;

  static PRESET_TEMPLATES = [
    {
      id: 'travel-review',
      name: '여행 후기',
      emoji: '✈️',
      description: '여행지 방문 후기 작성용',
      category: 'travel',
      isPreset: true,
      settings: {
        style: 'casual',
        length: 'medium',
        provider: 'anthropic'
      },
      variables: {
        location: { label: '여행지', placeholder: '제주도' },
        duration: { label: '기간', placeholder: '3박 4일' }
      },
      promptTemplate: `{{location}} {{duration}} 여행 후기를 작성해주세요.
방문한 장소, 맛집, 카페를 소개하고 개인적인 감상을 담아주세요.
여행 팁과 추천 일정도 포함해주세요.`,
      keywordsTemplate: ['{{location}}', '여행', '맛집', '카페', '추천']
    },
    {
      id: 'product-review',
      name: 'IT 제품 리뷰',
      emoji: '💻',
      description: '전자제품/IT 제품 리뷰용',
      category: 'tech',
      isPreset: true,
      settings: {
        style: 'review',
        length: 'long',
        provider: 'anthropic'
      },
      variables: {
        productName: { label: '제품명', placeholder: '맥북 프로 M3' },
        useCase: { label: '사용 환경', placeholder: '개발 업무' }
      },
      promptTemplate: `{{productName}} 사용 후기를 작성해주세요.
주 사용 환경: {{useCase}}

다음 내용을 포함해주세요:
- 제품 스펙 및 외관
- 실제 사용 경험
- 장점과 단점
- 추천 대상`,
      keywordsTemplate: ['{{productName}}', '리뷰', '후기', '추천']
    },
    {
      id: 'restaurant-review',
      name: '맛집 리뷰',
      emoji: '🍽️',
      description: '음식점/카페 방문 후기용',
      category: 'food',
      isPreset: true,
      settings: {
        style: 'casual',
        length: 'medium',
        provider: 'anthropic'
      },
      variables: {
        restaurantName: { label: '상호명', placeholder: '진짜 맛있는 집' },
        location: { label: '위치', placeholder: '서울 강남' },
        menu: { label: '추천 메뉴', placeholder: '삼겹살' }
      },
      promptTemplate: `{{location}}에 위치한 "{{restaurantName}}" 방문 후기를 작성해주세요.
추천 메뉴: {{menu}}

다음 내용을 포함해주세요:
- 위치 및 접근성
- 분위기 및 인테리어
- 메뉴 및 맛 평가
- 가격대
- 재방문 의사`,
      keywordsTemplate: ['{{restaurantName}}', '{{location}}', '맛집', '추천']
    },
    {
      id: 'daily-life',
      name: '일상 글',
      emoji: '📝',
      description: '일상적인 이야기 공유용',
      category: 'lifestyle',
      isPreset: true,
      settings: {
        style: 'casual',
        length: 'short',
        provider: 'anthropic'
      },
      variables: {
        topic: { label: '주제', placeholder: '오늘 있었던 일' }
      },
      promptTemplate: `{{topic}}에 대해 친근하고 편안한 일상 블로그 글을 작성해주세요.
개인적인 감상과 경험을 자연스럽게 풀어주세요.`,
      keywordsTemplate: ['일상', '{{topic}}', '블로그']
    },
    {
      id: 'how-to-guide',
      name: '방법/가이드',
      emoji: '📚',
      description: '튜토리얼, 사용법 설명용',
      category: 'tech',
      isPreset: true,
      settings: {
        style: 'informative',
        length: 'long',
        provider: 'anthropic'
      },
      variables: {
        subject: { label: '주제', placeholder: 'Python 설치 방법' },
        targetAudience: { label: '대상', placeholder: '초보자' }
      },
      promptTemplate: `{{subject}}에 대한 상세 가이드를 작성해주세요.
대상: {{targetAudience}}

다음을 포함해주세요:
- 단계별 설명
- 스크린샷 위치 표시 ({{IMAGE}})
- 주의사항 및 팁
- FAQ`,
      keywordsTemplate: ['{{subject}}', '가이드', '방법', '튜토리얼']
    }
  ];

  constructor() {
    this.templates = this.load();
  }

  /**
   * 사용자 템플릿 로드
   */
  load() {
    try {
      return JSON.parse(localStorage.getItem(TemplateManager.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * 사용자 템플릿 저장
   */
  persist(templates) {
    localStorage.setItem(TemplateManager.STORAGE_KEY, JSON.stringify(templates));
    this.templates = templates;
  }

  /**
   * 프리셋 통계 로드
   */
  loadPresetStats() {
    try {
      return JSON.parse(localStorage.getItem(TemplateManager.PRESET_STATS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  /**
   * 프리셋 통계 저장
   */
  persistPresetStats(stats) {
    localStorage.setItem(TemplateManager.PRESET_STATS_KEY, JSON.stringify(stats));
  }

  /**
   * 템플릿 저장 (새로 만들기)
   */
  save(template) {
    if (this.templates.length >= TemplateManager.MAX_TEMPLATES) {
      throw new Error(`최대 ${TemplateManager.MAX_TEMPLATES}개까지 저장할 수 있습니다`);
    }

    const newTemplate = {
      id: template.id || `template_${Date.now()}`,
      name: template.name,
      emoji: template.emoji || '📝',
      description: template.description || '',
      category: template.category || 'custom',
      isPreset: false,
      settings: {
        style: template.settings?.style || 'casual',
        length: template.settings?.length || 'medium',
        provider: template.settings?.provider || 'anthropic'
      },
      variables: template.variables || {},
      promptTemplate: template.promptTemplate || '',
      keywordsTemplate: template.keywordsTemplate || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    this.templates.push(newTemplate);
    this.persist(this.templates);

    return newTemplate;
  }

  /**
   * 템플릿 업데이트
   */
  update(id, updates) {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('템플릿을 찾을 수 없습니다');
    }

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.persist(this.templates);
    return this.templates[index];
  }

  /**
   * 템플릿 삭제
   */
  delete(id) {
    const template = this.get(id);
    if (!template) {
      throw new Error('템플릿을 찾을 수 없습니다');
    }
    if (template.isPreset) {
      throw new Error('기본 템플릿은 삭제할 수 없습니다');
    }

    this.templates = this.templates.filter(t => t.id !== id);
    this.persist(this.templates);
  }

  /**
   * 단일 템플릿 조회
   */
  get(id) {
    return this.getAll().find(t => t.id === id);
  }

  /**
   * 전체 목록 (프리셋 + 사용자, 통계 포함)
   */
  getAll() {
    const presetStats = this.loadPresetStats();

    const presets = TemplateManager.PRESET_TEMPLATES.map(t => ({
      ...t,
      usageCount: presetStats[t.id]?.usageCount || 0,
      lastUsedAt: presetStats[t.id]?.lastUsedAt || null
    }));

    return [...presets, ...this.templates];
  }

  /**
   * 카테고리별 조회
   */
  getByCategory(category) {
    if (category === 'recent') {
      return this.getRecentlyUsed();
    }
    if (category === 'custom') {
      return this.templates;
    }
    return this.getAll().filter(t => t.category === category);
  }

  /**
   * 최근 사용순 조회
   */
  getRecentlyUsed(limit = 5) {
    return this.getAll()
      .filter(t => t.usageCount > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  /**
   * 사용 횟수 증가
   */
  incrementUsage(id) {
    // 사용자 템플릿
    const userTemplate = this.templates.find(t => t.id === id);
    if (userTemplate) {
      userTemplate.usageCount = (userTemplate.usageCount || 0) + 1;
      userTemplate.lastUsedAt = new Date().toISOString();
      this.persist(this.templates);
      return;
    }

    // 프리셋 템플릿
    const presetTemplate = TemplateManager.PRESET_TEMPLATES.find(t => t.id === id);
    if (presetTemplate) {
      const stats = this.loadPresetStats();
      if (!stats[id]) {
        stats[id] = { usageCount: 0, lastUsedAt: null };
      }
      stats[id].usageCount++;
      stats[id].lastUsedAt = new Date().toISOString();
      this.persistPresetStats(stats);
    }
  }

  /**
   * 템플릿 적용 (변수 치환)
   */
  apply(templateId, variables = {}) {
    const template = this.get(templateId);
    if (!template) {
      throw new Error('템플릿을 찾을 수 없습니다');
    }

    const replaceVariables = (text) => {
      if (!text) return text;
      return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        if (variables[varName] !== undefined) {
          return variables[varName];
        }
        if (varName === 'date') {
          return new Date().toLocaleDateString('ko-KR');
        }
        return match;
      });
    };

    const result = {
      topic: replaceVariables(template.promptTemplate),
      keywords: template.keywordsTemplate.map(kw => replaceVariables(kw)),
      style: template.settings.style,
      length: template.settings.length,
      provider: template.settings.provider,
      templateId: template.id,
      templateName: template.name
    };

    this.incrementUsage(templateId);

    return result;
  }

  /**
   * 현재 설정에서 템플릿 생성
   */
  createFromCurrent(name, currentSettings) {
    return this.save({
      name,
      emoji: '💾',
      description: '현재 설정에서 생성됨',
      settings: {
        style: currentSettings.style,
        length: currentSettings.length,
        provider: currentSettings.provider
      },
      promptTemplate: currentSettings.topic,
      keywordsTemplate: currentSettings.keywords || []
    });
  }

  /**
   * 카테고리 목록
   */
  static getCategories() {
    return [
      { id: 'recent', name: '최근 사용', icon: '🕐' },
      { id: 'travel', name: '여행', icon: '✈️' },
      { id: 'food', name: '맛집', icon: '🍽️' },
      { id: 'tech', name: 'IT/테크', icon: '💻' },
      { id: 'lifestyle', name: '일상', icon: '🌿' },
      { id: 'custom', name: '내 템플릿', icon: '📝' }
    ];
  }
}

// 싱글톤 인스턴스
const templateManager = new TemplateManager();

export { templateManager, TemplateManager };
