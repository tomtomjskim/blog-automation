/**
 * Blog Automation - Usage Tracker Service
 * API 사용량 및 비용 추적
 */

const STORAGE_KEY = 'blog_auto_usage';
const MAX_HISTORY_DAYS = 90;

class UsageTracker {
  constructor() {
    this.data = this.load();
  }

  /**
   * 사용량 기록
   * @param {object} params - 기록 파라미터
   */
  record(params) {
    const {
      type = 'generation',
      provider,
      model,
      inputTokens = 0,
      outputTokens = 0,
      cost = 0,
      success = true,
      metadata = {}
    } = params;

    const record = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      type,
      provider,
      model,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      },
      cost,
      success,
      metadata
    };

    this.data.records.push(record);
    this.data.summary.totalRequests++;
    this.data.summary.totalTokens += record.tokens.total;
    this.data.summary.totalCost += cost;

    if (success) {
      this.data.summary.successfulRequests++;
    } else {
      this.data.summary.failedRequests++;
    }

    // 모델별 통계 업데이트
    this.updateModelStats(provider, model, record);

    // 일별 통계 업데이트
    this.updateDailyStats(record);

    // 오래된 데이터 정리
    this.cleanup();

    this.save();

    return record;
  }

  /**
   * 모델별 통계 업데이트
   */
  updateModelStats(provider, model, record) {
    const key = `${provider}:${model}`;

    if (!this.data.byModel[key]) {
      this.data.byModel[key] = {
        provider,
        model,
        requests: 0,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        lastUsed: null
      };
    }

    const stats = this.data.byModel[key];
    stats.requests++;
    stats.tokens.input += record.tokens.input;
    stats.tokens.output += record.tokens.output;
    stats.tokens.total += record.tokens.total;
    stats.cost += record.cost;
    stats.lastUsed = record.timestamp;
  }

  /**
   * 일별 통계 업데이트
   */
  updateDailyStats(record) {
    const date = record.date;

    if (!this.data.byDate[date]) {
      this.data.byDate[date] = {
        date,
        requests: 0,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        byType: {}
      };
    }

    const stats = this.data.byDate[date];
    stats.requests++;
    stats.tokens.input += record.tokens.input;
    stats.tokens.output += record.tokens.output;
    stats.tokens.total += record.tokens.total;
    stats.cost += record.cost;

    // 타입별 카운트
    if (!stats.byType[record.type]) {
      stats.byType[record.type] = 0;
    }
    stats.byType[record.type]++;
  }

  /**
   * 오래된 데이터 정리
   */
  cleanup() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    // 레코드 정리
    this.data.records = this.data.records.filter(r => r.date >= cutoff);

    // 일별 통계 정리
    Object.keys(this.data.byDate).forEach(date => {
      if (date < cutoff) {
        delete this.data.byDate[date];
      }
    });
  }

  /**
   * 기간별 통계 조회
   * @param {string} period - 'today', 'week', 'month', 'all'
   */
  getStats(period = 'all') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = now.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      default:
        startDate = '2000-01-01';
    }

    const records = this.data.records.filter(r => r.date >= startDate);

    const stats = {
      period,
      startDate,
      endDate: now.toISOString().split('T')[0],
      requests: records.length,
      successRate: records.length > 0
        ? (records.filter(r => r.success).length / records.length * 100).toFixed(1)
        : 0,
      tokens: {
        input: records.reduce((sum, r) => sum + r.tokens.input, 0),
        output: records.reduce((sum, r) => sum + r.tokens.output, 0),
        total: records.reduce((sum, r) => sum + r.tokens.total, 0)
      },
      cost: records.reduce((sum, r) => sum + r.cost, 0),
      byProvider: {},
      byType: {}
    };

    // Provider별 집계
    records.forEach(r => {
      if (!stats.byProvider[r.provider]) {
        stats.byProvider[r.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      stats.byProvider[r.provider].requests++;
      stats.byProvider[r.provider].tokens += r.tokens.total;
      stats.byProvider[r.provider].cost += r.cost;
    });

    // Type별 집계
    records.forEach(r => {
      if (!stats.byType[r.type]) {
        stats.byType[r.type] = 0;
      }
      stats.byType[r.type]++;
    });

    return stats;
  }

  /**
   * 일별 차트 데이터
   * @param {number} days - 최근 N일
   */
  getDailyChartData(days = 30) {
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStats = this.data.byDate[dateStr] || {
        date: dateStr,
        requests: 0,
        tokens: { total: 0 },
        cost: 0
      };

      data.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        requests: dayStats.requests,
        tokens: dayStats.tokens.total,
        cost: dayStats.cost
      });
    }

    return data;
  }

  /**
   * 모델 사용 통계
   */
  getModelStats() {
    return Object.values(this.data.byModel)
      .sort((a, b) => b.requests - a.requests);
  }

  /**
   * 최근 사용 기록
   * @param {number} limit - 최대 개수
   */
  getRecentRecords(limit = 20) {
    return this.data.records
      .slice(-limit)
      .reverse();
  }

  /**
   * 비용 예측
   * @param {number} targetRequests - 예상 요청 수
   */
  estimateCost(targetRequests) {
    const stats = this.getStats('month');
    if (stats.requests === 0) return 0;

    const avgCostPerRequest = stats.cost / stats.requests;
    return avgCostPerRequest * targetRequests;
  }

  /**
   * 월간 예상 비용
   */
  getMonthlyProjection() {
    const stats = this.getStats('week');
    if (stats.requests === 0) return { daily: 0, weekly: 0, monthly: 0 };

    const dailyAvg = stats.cost / 7;

    return {
      daily: dailyAvg,
      weekly: dailyAvg * 7,
      monthly: dailyAvg * 30
    };
  }

  /**
   * 사용량 리포트 생성
   */
  generateReport(period = 'month') {
    const stats = this.getStats(period);
    const modelStats = this.getModelStats();
    const projection = this.getMonthlyProjection();

    return {
      generatedAt: new Date().toISOString(),
      period,
      summary: {
        totalRequests: stats.requests,
        successRate: `${stats.successRate}%`,
        totalTokens: stats.tokens.total.toLocaleString(),
        totalCost: `$${stats.cost.toFixed(4)}`
      },
      tokens: {
        input: stats.tokens.input.toLocaleString(),
        output: stats.tokens.output.toLocaleString(),
        ratio: stats.tokens.input > 0
          ? (stats.tokens.output / stats.tokens.input).toFixed(2)
          : 0
      },
      providers: stats.byProvider,
      topModels: modelStats.slice(0, 5),
      projection: {
        daily: `$${projection.daily.toFixed(4)}`,
        weekly: `$${projection.weekly.toFixed(4)}`,
        monthly: `$${projection.monthly.toFixed(4)}`
      }
    };
  }

  /**
   * 데이터 내보내기
   */
  export() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * 데이터 가져오기
   */
  import(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      if (imported.records && imported.summary) {
        this.data = imported;
        this.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[UsageTracker] Import failed:', error);
      return false;
    }
  }

  /**
   * 데이터 초기화
   */
  reset() {
    this.data = this.createEmptyData();
    this.save();
  }

  /**
   * 빈 데이터 구조 생성
   */
  createEmptyData() {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0
      },
      records: [],
      byModel: {},
      byDate: {}
    };
  }

  /**
   * 로컬 스토리지에서 로드
   */
  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // 마이그레이션이 필요한 경우 처리
        if (!data.version) {
          return this.createEmptyData();
        }
        return data;
      }
    } catch (error) {
      console.error('[UsageTracker] Load failed:', error);
    }
    return this.createEmptyData();
  }

  /**
   * 로컬 스토리지에 저장
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('[UsageTracker] Save failed:', error);
    }
  }

  /**
   * 전체 요약 반환
   */
  getSummary() {
    return { ...this.data.summary };
  }
}

// 싱글톤 인스턴스
const usageTracker = new UsageTracker();

export { usageTracker, UsageTracker };
