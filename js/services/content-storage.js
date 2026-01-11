/**
 * Blog Automation - Content Storage Service
 * 콘텐츠 저장/불러오기/버전 관리
 */

const STORAGE_KEY = 'blog_auto_contents';
const MAX_VERSIONS = 5;
const AUTO_SAVE_DEBOUNCE = 3000;

class ContentStorage {
  constructor() {
    this.data = this.load();
    this.autoSaveTimers = new Map();
  }

  /**
   * 콘텐츠 저장
   * @param {object} content - 저장할 콘텐츠
   * @param {object} options - 저장 옵션
   * @returns {object} 저장된 콘텐츠
   */
  save(content, options = {}) {
    const {
      type = 'draft',  // 'draft', 'edited', 'scheduled', 'published'
      autoSave = false,
      tags = []
    } = options;

    const id = content.id || this.generateId();
    const now = new Date().toISOString();

    // 기존 콘텐츠 찾기
    const existingIndex = this.data.items.findIndex(item => item.id === id);
    const existing = existingIndex >= 0 ? this.data.items[existingIndex] : null;

    // 버전 관리
    let versions = existing?.versions || [];
    if (existing && !autoSave) {
      // 자동 저장이 아닐 때만 버전 저장
      versions = [
        {
          version: versions.length + 1,
          content: existing.content,
          savedAt: existing.metadata.updatedAt
        },
        ...versions
      ].slice(0, MAX_VERSIONS);
    }

    const savedContent = {
      id,
      type,

      // 원본 생성 정보
      generation: content.generation || {
        topic: content.topic || '',
        keywords: content.keywords || [],
        style: content.style || 'casual',
        length: content.length || 'medium',
        provider: content.provider || 'anthropic',
        model: content.model || null,
        generatedAt: content.generatedAt || now
      },

      // 현재 콘텐츠
      content: {
        title: content.title || content.generation?.topic || '',
        body: content.body || content.content || '',
        images: content.images || [],
        seoScore: content.seoScore || null
      },

      // 메타데이터
      metadata: {
        createdAt: existing?.metadata?.createdAt || now,
        updatedAt: now,
        autoSavedAt: autoSave ? now : (existing?.metadata?.autoSavedAt || null),
        tags: [...new Set([...(existing?.metadata?.tags || []), ...tags])]
      },

      // 발행 정보
      publishing: content.publishing || existing?.publishing || {
        platform: null,
        scheduledAt: null,
        publishedAt: null,
        postUrl: null
      },

      // 버전 이력
      versions
    };

    if (existingIndex >= 0) {
      this.data.items[existingIndex] = savedContent;
    } else {
      this.data.items.unshift(savedContent);
    }

    this.persist();
    return savedContent;
  }

  /**
   * 자동 저장 (디바운스)
   * @param {object} content - 저장할 콘텐츠
   */
  autoSave(content) {
    const id = content.id || 'new';

    // 기존 타이머 취소
    if (this.autoSaveTimers.has(id)) {
      clearTimeout(this.autoSaveTimers.get(id));
    }

    // 새 타이머 설정
    const timer = setTimeout(() => {
      this.save(content, { autoSave: true });
      this.autoSaveTimers.delete(id);
    }, AUTO_SAVE_DEBOUNCE);

    this.autoSaveTimers.set(id, timer);
  }

  /**
   * 콘텐츠 불러오기
   * @param {string} id - 콘텐츠 ID
   * @returns {object|null} 콘텐츠
   */
  get(id) {
    return this.data.items.find(item => item.id === id) || null;
  }

  /**
   * 콘텐츠 목록 조회
   * @param {object} filters - 필터 옵션
   * @returns {array} 콘텐츠 목록
   */
  list(filters = {}) {
    const {
      type = null,
      tags = [],
      search = '',
      dateRange = null,
      limit = 50,
      offset = 0
    } = filters;

    let items = [...this.data.items];

    // 타입 필터
    if (type) {
      items = items.filter(item => item.type === type);
    }

    // 태그 필터
    if (tags.length > 0) {
      items = items.filter(item =>
        tags.some(tag => item.metadata.tags.includes(tag))
      );
    }

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item =>
        item.content.title.toLowerCase().includes(searchLower) ||
        item.content.body.toLowerCase().includes(searchLower) ||
        item.generation.topic.toLowerCase().includes(searchLower)
      );
    }

    // 날짜 필터
    if (dateRange) {
      const { start, end } = dateRange;
      items = items.filter(item => {
        const date = new Date(item.metadata.updatedAt);
        return (!start || date >= new Date(start)) &&
               (!end || date <= new Date(end));
      });
    }

    // 정렬 (최신순)
    items.sort((a, b) =>
      new Date(b.metadata.updatedAt) - new Date(a.metadata.updatedAt)
    );

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      hasMore: offset + limit < items.length
    };
  }

  /**
   * 콘텐츠 삭제
   * @param {string} id - 콘텐츠 ID
   * @returns {boolean} 삭제 성공 여부
   */
  delete(id) {
    const index = this.data.items.findIndex(item => item.id === id);
    if (index < 0) return false;

    this.data.items.splice(index, 1);
    this.persist();
    return true;
  }

  /**
   * 다중 삭제
   * @param {array} ids - 콘텐츠 ID 배열
   * @returns {number} 삭제된 개수
   */
  deleteMany(ids) {
    const initialLength = this.data.items.length;
    this.data.items = this.data.items.filter(item => !ids.includes(item.id));
    this.persist();
    return initialLength - this.data.items.length;
  }

  /**
   * 타입 변경
   * @param {string} id - 콘텐츠 ID
   * @param {string} newType - 새 타입
   */
  updateType(id, newType) {
    const content = this.get(id);
    if (!content) return null;

    content.type = newType;
    content.metadata.updatedAt = new Date().toISOString();
    this.persist();
    return content;
  }

  /**
   * 버전 목록 조회
   * @param {string} id - 콘텐츠 ID
   * @returns {array} 버전 목록
   */
  getVersions(id) {
    const content = this.get(id);
    return content?.versions || [];
  }

  /**
   * 특정 버전 복원
   * @param {string} id - 콘텐츠 ID
   * @param {number} version - 버전 번호
   * @returns {object|null} 복원된 콘텐츠
   */
  restoreVersion(id, version) {
    const content = this.get(id);
    if (!content) return null;

    const versionData = content.versions.find(v => v.version === version);
    if (!versionData) return null;

    // 현재 상태를 버전에 추가
    content.versions.unshift({
      version: content.versions.length + 1,
      content: content.content,
      savedAt: content.metadata.updatedAt
    });
    content.versions = content.versions.slice(0, MAX_VERSIONS);

    // 선택한 버전으로 복원
    content.content = versionData.content;
    content.metadata.updatedAt = new Date().toISOString();

    this.persist();
    return content;
  }

  /**
   * 콘텐츠 복제
   * @param {string} id - 원본 콘텐츠 ID
   * @returns {object|null} 복제된 콘텐츠
   */
  duplicate(id) {
    const original = this.get(id);
    if (!original) return null;

    const duplicate = {
      ...JSON.parse(JSON.stringify(original)),
      id: this.generateId(),
      type: 'draft',
      metadata: {
        ...original.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        autoSavedAt: null
      },
      publishing: {
        platform: null,
        scheduledAt: null,
        publishedAt: null,
        postUrl: null
      },
      versions: []
    };

    duplicate.content.title = `${original.content.title} (복사본)`;

    this.data.items.unshift(duplicate);
    this.persist();
    return duplicate;
  }

  /**
   * 데이터 내보내기
   * @param {array} ids - 내보낼 콘텐츠 ID 배열 (null이면 전체)
   * @param {string} format - 'json' 또는 'markdown'
   * @returns {string} 내보내기 데이터
   */
  export(ids = null, format = 'json') {
    const items = ids
      ? this.data.items.filter(item => ids.includes(item.id))
      : this.data.items;

    if (format === 'markdown') {
      return items.map(item => {
        return `# ${item.content.title}\n\n` +
          `> 작성일: ${new Date(item.metadata.createdAt).toLocaleDateString('ko-KR')}\n` +
          `> 태그: ${item.metadata.tags.join(', ')}\n\n` +
          `${item.content.body}`;
      }).join('\n\n---\n\n');
    }

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      count: items.length,
      items
    }, null, 2);
  }

  /**
   * 데이터 가져오기
   * @param {string} data - 가져올 데이터 (JSON)
   * @param {object} options - 가져오기 옵션
   * @returns {object} 가져오기 결과
   */
  import(data, options = {}) {
    const { overwrite = false, tags = [] } = options;

    try {
      const parsed = JSON.parse(data);
      const items = parsed.items || (Array.isArray(parsed) ? parsed : [parsed]);

      let imported = 0;
      let skipped = 0;

      items.forEach(item => {
        const existing = this.data.items.find(i => i.id === item.id);

        if (existing && !overwrite) {
          skipped++;
          return;
        }

        if (existing) {
          const index = this.data.items.indexOf(existing);
          this.data.items[index] = {
            ...item,
            metadata: {
              ...item.metadata,
              tags: [...new Set([...item.metadata.tags, ...tags])]
            }
          };
        } else {
          this.data.items.unshift({
            ...item,
            id: item.id || this.generateId(),
            metadata: {
              ...item.metadata,
              tags: [...new Set([...(item.metadata?.tags || []), ...tags])]
            }
          });
        }

        imported++;
      });

      this.persist();
      return { success: true, imported, skipped };
    } catch (error) {
      console.error('[ContentStorage] Import failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 통계 조회
   * @returns {object} 통계 정보
   */
  getStats() {
    const items = this.data.items;

    return {
      total: items.length,
      byType: {
        draft: items.filter(i => i.type === 'draft').length,
        edited: items.filter(i => i.type === 'edited').length,
        scheduled: items.filter(i => i.type === 'scheduled').length,
        published: items.filter(i => i.type === 'published').length
      },
      recentActivity: items
        .slice(0, 5)
        .map(i => ({
          id: i.id,
          title: i.content.title,
          type: i.type,
          updatedAt: i.metadata.updatedAt
        })),
      totalTags: [...new Set(items.flatMap(i => i.metadata.tags))].length
    };
  }

  /**
   * 모든 태그 조회
   * @returns {array} 태그 목록
   */
  getAllTags() {
    const tagCount = {};

    this.data.items.forEach(item => {
      item.metadata.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 전체 삭제
   */
  clear() {
    this.data = { items: [], version: 1 };
    this.persist();
  }

  /**
   * ID 생성
   */
  generateId() {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 로컬 스토리지에서 로드
   */
  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[ContentStorage] Load failed:', error);
    }
    return { items: [], version: 1 };
  }

  /**
   * 로컬 스토리지에 저장
   */
  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('[ContentStorage] Persist failed:', error);
      // 용량 초과 시 오래된 항목 정리
      if (error.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch {
          console.error('[ContentStorage] Persist failed after cleanup');
        }
      }
    }
  }

  /**
   * 오래된 항목 정리
   */
  cleanup() {
    // 발행된 항목은 유지, 오래된 초안부터 삭제
    const drafts = this.data.items
      .filter(i => i.type === 'draft')
      .sort((a, b) => new Date(a.metadata.updatedAt) - new Date(b.metadata.updatedAt));

    // 가장 오래된 초안 10개 삭제
    const toDelete = drafts.slice(0, 10).map(d => d.id);
    this.data.items = this.data.items.filter(item => !toDelete.includes(item.id));
  }
}

// 싱글톤 인스턴스
const contentStorage = new ContentStorage();

export { contentStorage, ContentStorage };
