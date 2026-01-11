/**
 * Blog Automation - Series Manager
 * 시리즈(연재물) 관리
 */

const STORAGE_KEY = 'blog_auto_series';

class SeriesManager {
  constructor() {
    this.data = this.load();
  }

  /**
   * 시리즈 생성
   * @param {object} config - 시리즈 설정
   * @returns {object} 생성된 시리즈
   */
  create(config) {
    const {
      name,
      description = '',
      theme = '',
      targetCount = 5,
      schedule = null,  // { frequency: 'weekly', day: 1 }
      template = null,
      tags = []
    } = config;

    if (!name) {
      throw new Error('시리즈 이름은 필수입니다');
    }

    const series = {
      id: this.generateId(),
      name,
      description,
      theme,
      targetCount,
      schedule,
      template,
      tags,
      status: 'active',  // 'active', 'paused', 'completed', 'archived'
      episodes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalViews: 0,
        totalLikes: 0,
        avgReadTime: 0
      }
    };

    this.data.series.push(series);
    this.persist();

    return series;
  }

  /**
   * 시리즈 조회
   * @param {string} id - 시리즈 ID
   * @returns {object|null} 시리즈
   */
  get(id) {
    return this.data.series.find(s => s.id === id) || null;
  }

  /**
   * 시리즈 목록 조회
   * @param {object} filters - 필터 옵션
   * @returns {array} 시리즈 목록
   */
  list(filters = {}) {
    const { status = null, search = '' } = filters;

    let series = [...this.data.series];

    if (status) {
      series = series.filter(s => s.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      series = series.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      );
    }

    return series.sort((a, b) =>
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }

  /**
   * 시리즈 업데이트
   * @param {string} id - 시리즈 ID
   * @param {object} updates - 업데이트 내용
   * @returns {object|null} 업데이트된 시리즈
   */
  update(id, updates) {
    const series = this.get(id);
    if (!series) return null;

    const allowedFields = [
      'name', 'description', 'theme', 'targetCount',
      'schedule', 'template', 'tags', 'status'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        series[field] = updates[field];
      }
    });

    series.updatedAt = new Date().toISOString();

    // 자동 완료 체크
    if (series.episodes.length >= series.targetCount && series.status === 'active') {
      series.status = 'completed';
    }

    this.persist();
    return series;
  }

  /**
   * 시리즈 삭제
   * @param {string} id - 시리즈 ID
   * @returns {boolean} 삭제 성공 여부
   */
  delete(id) {
    const index = this.data.series.findIndex(s => s.id === id);
    if (index < 0) return false;

    this.data.series.splice(index, 1);
    this.persist();
    return true;
  }

  /**
   * 에피소드 추가
   * @param {string} seriesId - 시리즈 ID
   * @param {object} episode - 에피소드 정보
   * @returns {object|null} 추가된 에피소드
   */
  addEpisode(seriesId, episode) {
    const series = this.get(seriesId);
    if (!series) return null;

    const newEpisode = {
      id: this.generateId('ep'),
      number: series.episodes.length + 1,
      title: episode.title || `${series.name} #${series.episodes.length + 1}`,
      contentId: episode.contentId || null,  // ContentStorage ID 참조
      summary: episode.summary || '',
      status: episode.status || 'draft',  // 'draft', 'scheduled', 'published'
      publishedAt: episode.publishedAt || null,
      postUrl: episode.postUrl || null,
      createdAt: new Date().toISOString(),
      stats: {
        views: 0,
        likes: 0,
        comments: 0
      }
    };

    series.episodes.push(newEpisode);
    series.updatedAt = new Date().toISOString();

    // 자동 완료 체크
    if (series.episodes.length >= series.targetCount && series.status === 'active') {
      series.status = 'completed';
    }

    this.persist();
    return newEpisode;
  }

  /**
   * 에피소드 업데이트
   * @param {string} seriesId - 시리즈 ID
   * @param {string} episodeId - 에피소드 ID
   * @param {object} updates - 업데이트 내용
   * @returns {object|null} 업데이트된 에피소드
   */
  updateEpisode(seriesId, episodeId, updates) {
    const series = this.get(seriesId);
    if (!series) return null;

    const episode = series.episodes.find(e => e.id === episodeId);
    if (!episode) return null;

    const allowedFields = [
      'title', 'contentId', 'summary', 'status',
      'publishedAt', 'postUrl', 'stats'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        episode[field] = updates[field];
      }
    });

    series.updatedAt = new Date().toISOString();
    this.persist();
    return episode;
  }

  /**
   * 에피소드 삭제
   * @param {string} seriesId - 시리즈 ID
   * @param {string} episodeId - 에피소드 ID
   * @returns {boolean} 삭제 성공 여부
   */
  deleteEpisode(seriesId, episodeId) {
    const series = this.get(seriesId);
    if (!series) return false;

    const index = series.episodes.findIndex(e => e.id === episodeId);
    if (index < 0) return false;

    series.episodes.splice(index, 1);

    // 에피소드 번호 재정렬
    series.episodes.forEach((ep, idx) => {
      ep.number = idx + 1;
    });

    series.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  /**
   * 에피소드 순서 변경
   * @param {string} seriesId - 시리즈 ID
   * @param {string} episodeId - 에피소드 ID
   * @param {number} newPosition - 새 위치 (0-based)
   * @returns {boolean} 성공 여부
   */
  reorderEpisode(seriesId, episodeId, newPosition) {
    const series = this.get(seriesId);
    if (!series) return false;

    const currentIndex = series.episodes.findIndex(e => e.id === episodeId);
    if (currentIndex < 0) return false;

    const [episode] = series.episodes.splice(currentIndex, 1);
    series.episodes.splice(newPosition, 0, episode);

    // 에피소드 번호 재정렬
    series.episodes.forEach((ep, idx) => {
      ep.number = idx + 1;
    });

    series.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  /**
   * 다음 에피소드 제안
   * @param {string} seriesId - 시리즈 ID
   * @returns {object|null} 제안 정보
   */
  suggestNextEpisode(seriesId) {
    const series = this.get(seriesId);
    if (!series) return null;

    const nextNumber = series.episodes.length + 1;
    const remaining = series.targetCount - series.episodes.length;

    // 스케줄 기반 다음 발행일 계산
    let suggestedDate = null;
    if (series.schedule) {
      const lastEpisode = series.episodes[series.episodes.length - 1];
      const lastDate = lastEpisode?.publishedAt
        ? new Date(lastEpisode.publishedAt)
        : new Date();

      suggestedDate = this.calculateNextPublishDate(lastDate, series.schedule);
    }

    // 템플릿 기반 제목 생성
    let suggestedTitle = `${series.name} #${nextNumber}`;
    if (series.template?.titlePattern) {
      suggestedTitle = series.template.titlePattern
        .replace('{name}', series.name)
        .replace('{number}', nextNumber)
        .replace('{theme}', series.theme);
    }

    return {
      number: nextNumber,
      title: suggestedTitle,
      theme: series.theme,
      suggestedDate,
      remainingCount: remaining,
      isLastEpisode: remaining === 1,
      template: series.template
    };
  }

  /**
   * 다음 발행일 계산
   * @param {Date} lastDate - 마지막 발행일
   * @param {object} schedule - 스케줄 설정
   * @returns {Date} 다음 발행일
   */
  calculateNextPublishDate(lastDate, schedule) {
    const next = new Date(lastDate);

    switch (schedule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;

      case 'weekly':
        next.setDate(next.getDate() + 7);
        if (schedule.day !== undefined) {
          // 특정 요일로 조정
          const currentDay = next.getDay();
          const targetDay = schedule.day;
          const diff = (targetDay - currentDay + 7) % 7 || 7;
          next.setDate(next.getDate() + diff);
        }
        break;

      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;

      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        if (schedule.day !== undefined) {
          next.setDate(Math.min(schedule.day, this.getDaysInMonth(next)));
        }
        break;

      default:
        next.setDate(next.getDate() + 7);
    }

    // 시간 설정
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':');
      next.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }

    return next;
  }

  /**
   * 월의 일수 계산
   */
  getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * 시리즈 통계 업데이트
   * @param {string} seriesId - 시리즈 ID
   */
  updateStats(seriesId) {
    const series = this.get(seriesId);
    if (!series || series.episodes.length === 0) return;

    series.stats = {
      totalViews: series.episodes.reduce((sum, ep) => sum + (ep.stats?.views || 0), 0),
      totalLikes: series.episodes.reduce((sum, ep) => sum + (ep.stats?.likes || 0), 0),
      avgReadTime: 0,  // 추후 계산
      completionRate: (series.episodes.length / series.targetCount) * 100,
      publishedCount: series.episodes.filter(ep => ep.status === 'published').length
    };

    this.persist();
  }

  /**
   * 시리즈 복제
   * @param {string} id - 원본 시리즈 ID
   * @returns {object|null} 복제된 시리즈
   */
  duplicate(id) {
    const original = this.get(id);
    if (!original) return null;

    const duplicate = {
      ...JSON.parse(JSON.stringify(original)),
      id: this.generateId(),
      name: `${original.name} (복사본)`,
      status: 'active',
      episodes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalViews: 0,
        totalLikes: 0,
        avgReadTime: 0
      }
    };

    this.data.series.push(duplicate);
    this.persist();
    return duplicate;
  }

  /**
   * 시리즈 내보내기
   * @param {string} id - 시리즈 ID
   * @returns {string} JSON 문자열
   */
  export(id) {
    const series = this.get(id);
    if (!series) return null;

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      series
    }, null, 2);
  }

  /**
   * 시리즈 가져오기
   * @param {string} jsonData - JSON 문자열
   * @returns {object} 가져온 시리즈
   */
  import(jsonData) {
    try {
      const parsed = JSON.parse(jsonData);
      const seriesData = parsed.series || parsed;

      const imported = {
        ...seriesData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.data.series.push(imported);
      this.persist();
      return { success: true, series: imported };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 전체 통계
   * @returns {object} 통계 정보
   */
  getOverallStats() {
    const allSeries = this.data.series;
    const allEpisodes = allSeries.flatMap(s => s.episodes);

    return {
      totalSeries: allSeries.length,
      activeSeries: allSeries.filter(s => s.status === 'active').length,
      completedSeries: allSeries.filter(s => s.status === 'completed').length,
      totalEpisodes: allEpisodes.length,
      publishedEpisodes: allEpisodes.filter(e => e.status === 'published').length,
      totalViews: allEpisodes.reduce((sum, e) => sum + (e.stats?.views || 0), 0),
      avgCompletionRate: allSeries.length > 0
        ? allSeries.reduce((sum, s) =>
            sum + (s.episodes.length / s.targetCount), 0) / allSeries.length * 100
        : 0
    };
  }

  /**
   * ID 생성
   */
  generateId(prefix = 'series') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      console.error('[SeriesManager] Load failed:', error);
    }
    return { series: [], version: 1 };
  }

  /**
   * 로컬 스토리지에 저장
   */
  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('[SeriesManager] Persist failed:', error);
    }
  }
}

// 싱글톤 인스턴스
const seriesManager = new SeriesManager();

export { seriesManager, SeriesManager };
