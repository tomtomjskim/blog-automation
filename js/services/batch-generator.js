/**
 * Blog Automation - Batch Generator Service
 * 대량 글 생성 관리
 */

import { blogGenerator } from './blog-generator.js';
import { llmService } from './llm-service.js';

const DELAY_BETWEEN_ITEMS = 2000; // Rate limit 방지
const MAX_ITEMS = 50;
const STORAGE_KEY = 'blog_auto_batch';

class BatchGenerator extends EventTarget {
  constructor() {
    super();
    this.currentJob = null;
    this.isPaused = false;
    this.isRunning = false;
  }

  /**
   * 새 배치 작업 생성
   * @param {object[]} items - 작업 항목 배열
   * @param {object} globalSettings - 전역 설정
   * @returns {object} 생성된 작업
   */
  createJob(items, globalSettings = {}) {
    if (items.length === 0) {
      throw new Error('항목이 필요합니다.');
    }

    if (items.length > MAX_ITEMS) {
      throw new Error(`최대 ${MAX_ITEMS}개까지 추가할 수 있습니다.`);
    }

    const job = {
      id: `batch_${Date.now()}`,
      status: 'idle',
      createdAt: new Date().toISOString(),
      globalSettings: {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        style: 'casual',
        length: 'medium',
        temperature: 0.7,
        ...globalSettings
      },
      items: items.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        order: index + 1,
        status: 'pending',
        input: {
          topic: item.topic || '',
          keywords: Array.isArray(item.keywords) ? item.keywords : [],
          additionalInfo: item.additionalInfo || ''
        },
        settings: item.settings || null,
        output: null,
        error: null,
        usage: null,
        startedAt: null,
        completedAt: null
      })),
      progress: {
        total: items.length,
        completed: 0,
        failed: 0,
        skipped: 0
      },
      cost: {
        estimated: this.estimateCost(items, globalSettings),
        actual: 0
      }
    };

    this.currentJob = job;
    this.saveJob();
    this.emit('created', job);
    return job;
  }

  /**
   * 배치 처리 시작
   */
  async start() {
    if (!this.currentJob) {
      throw new Error('처리할 작업이 없습니다.');
    }

    if (this.isRunning) {
      throw new Error('이미 처리 중입니다.');
    }

    this.currentJob.status = 'processing';
    this.isRunning = true;
    this.isPaused = false;
    this.saveJob();
    this.emit('started', this.currentJob);

    const pendingItems = this.currentJob.items.filter(
      item => item.status === 'pending' || item.status === 'failed'
    );

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];

      if (this.isPaused) {
        this.currentJob.status = 'paused';
        this.isRunning = false;
        this.saveJob();
        this.emit('paused', this.currentJob);
        return;
      }

      await this.processItem(item);

      // Rate limit 방지 딜레이
      if (i < pendingItems.length - 1 && !this.isPaused) {
        await this.delay(DELAY_BETWEEN_ITEMS);
      }
    }

    this.currentJob.status = 'completed';
    this.isRunning = false;
    this.saveJob();
    this.emit('completed', this.currentJob);
  }

  /**
   * 일시 정지
   */
  pause() {
    if (this.isRunning) {
      this.isPaused = true;
      this.emit('pausing', this.currentJob);
    }
  }

  /**
   * 재개
   */
  resume() {
    if (this.currentJob?.status === 'paused') {
      this.start();
    }
  }

  /**
   * 중지 및 초기화
   */
  stop() {
    this.isPaused = true;
    this.isRunning = false;

    if (this.currentJob) {
      this.currentJob.status = 'stopped';
      // 처리 중인 항목을 pending으로 되돌림
      this.currentJob.items.forEach(item => {
        if (item.status === 'processing') {
          item.status = 'pending';
        }
      });
      this.saveJob();
    }
    this.emit('stopped', this.currentJob);
  }

  /**
   * 작업 초기화
   */
  reset() {
    this.stop();
    this.currentJob = null;
    localStorage.removeItem(STORAGE_KEY);
    this.emit('reset');
  }

  /**
   * 개별 항목 처리
   */
  async processItem(item) {
    item.status = 'processing';
    item.startedAt = new Date().toISOString();
    this.saveJob();
    this.emit('itemStart', { job: this.currentJob, item });

    try {
      const settings = item.settings || this.currentJob.globalSettings;

      // 스트리밍 없이 생성
      const result = await blogGenerator.generate({
        topic: item.input.topic,
        keywords: item.input.keywords,
        additionalInfo: item.input.additionalInfo,
        style: settings.style,
        length: settings.length,
        provider: settings.provider,
        model: settings.model,
        temperature: settings.temperature
      });

      item.status = 'completed';
      item.completedAt = new Date().toISOString();
      item.output = {
        title: result.title,
        content: result.content,
        charCount: result.charCount
      };
      item.usage = result.usage;

      this.currentJob.progress.completed++;
      this.currentJob.cost.actual += result.cost?.total || 0;

      this.saveJob();
      this.emit('itemComplete', { job: this.currentJob, item, result });

    } catch (error) {
      console.error(`[BatchGenerator] Item failed:`, error);

      item.status = 'failed';
      item.completedAt = new Date().toISOString();
      item.error = error.message;

      this.currentJob.progress.failed++;

      this.saveJob();
      this.emit('itemError', { job: this.currentJob, item, error });
    }
  }

  /**
   * 항목 추가
   */
  addItem(item) {
    if (!this.currentJob) {
      throw new Error('먼저 작업을 생성해주세요.');
    }

    if (this.currentJob.items.length >= MAX_ITEMS) {
      throw new Error(`최대 ${MAX_ITEMS}개까지 추가할 수 있습니다.`);
    }

    const newItem = {
      id: `item_${Date.now()}_${this.currentJob.items.length}`,
      order: this.currentJob.items.length + 1,
      status: 'pending',
      input: {
        topic: item.topic || '',
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        additionalInfo: item.additionalInfo || ''
      },
      settings: item.settings || null,
      output: null,
      error: null,
      usage: null,
      startedAt: null,
      completedAt: null
    };

    this.currentJob.items.push(newItem);
    this.currentJob.progress.total++;
    this.currentJob.cost.estimated = this.estimateCost(
      this.currentJob.items,
      this.currentJob.globalSettings
    );

    this.saveJob();
    this.emit('itemAdded', { job: this.currentJob, item: newItem });

    return newItem;
  }

  /**
   * 항목 제거
   */
  removeItem(itemId) {
    if (!this.currentJob) return;

    const index = this.currentJob.items.findIndex(i => i.id === itemId);
    if (index === -1) return;

    const item = this.currentJob.items[index];
    if (item.status === 'processing') {
      throw new Error('처리 중인 항목은 제거할 수 없습니다.');
    }

    this.currentJob.items.splice(index, 1);
    this.currentJob.progress.total = this.currentJob.items.length;
    this.currentJob.cost.estimated = this.estimateCost(
      this.currentJob.items,
      this.currentJob.globalSettings
    );

    // 순서 재정렬
    this.currentJob.items.forEach((item, i) => {
      item.order = i + 1;
    });

    this.saveJob();
    this.emit('itemRemoved', { job: this.currentJob, itemId });
  }

  /**
   * 설정 업데이트
   */
  updateSettings(settings) {
    if (!this.currentJob) return;

    this.currentJob.globalSettings = {
      ...this.currentJob.globalSettings,
      ...settings
    };

    this.currentJob.cost.estimated = this.estimateCost(
      this.currentJob.items,
      this.currentJob.globalSettings
    );

    this.saveJob();
    this.emit('settingsUpdated', this.currentJob);
  }

  /**
   * 비용 예측
   */
  estimateCost(items, settings) {
    const costs = llmService.getModelCosts(settings?.provider, settings?.model);
    if (!costs) return 0;

    // 평균 토큰 수 기준 예측
    const avgInputTokens = 500;
    let avgOutputTokens = 1500;

    switch (settings?.length) {
      case 'short': avgOutputTokens = 700; break;
      case 'long': avgOutputTokens = 2500; break;
    }

    const costPerItem = (avgInputTokens * costs.input / 1_000_000) +
                        (avgOutputTokens * costs.output / 1_000_000);

    return items.length * costPerItem;
  }

  /**
   * 예상 소요 시간 (분)
   */
  estimateTime(itemCount) {
    // 항목당 평균 30초 + 딜레이 2초
    const avgTimePerItem = 32;
    return Math.ceil((itemCount * avgTimePerItem) / 60);
  }

  /**
   * CSV 파싱
   */
  parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV 파일에 데이터가 없습니다.');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // 필수 헤더 확인
    const topicIndex = headers.findIndex(h => h === 'topic' || h === '주제');
    if (topicIndex === -1) {
      throw new Error('topic(주제) 열이 필요합니다.');
    }

    const keywordsIndex = headers.findIndex(h => h === 'keywords' || h === '키워드');
    const additionalIndex = headers.findIndex(h => h === 'additionalinfo' || h === '추가정보');

    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (!values[topicIndex]?.trim()) continue;

      items.push({
        topic: values[topicIndex].trim(),
        keywords: keywordsIndex >= 0 && values[keywordsIndex]
          ? values[keywordsIndex].split('|').map(k => k.trim()).filter(Boolean)
          : [],
        additionalInfo: additionalIndex >= 0 ? values[additionalIndex]?.trim() || '' : ''
      });
    }

    if (items.length === 0) {
      throw new Error('파싱된 항목이 없습니다.');
    }

    return items;
  }

  /**
   * CSV 라인 파싱 (RFC 4180)
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * 결과 내보내기 (JSON)
   */
  exportJSON() {
    if (!this.currentJob) return null;

    const completedItems = this.currentJob.items.filter(i => i.status === 'completed');

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalItems: completedItems.length,
      items: completedItems.map(item => ({
        topic: item.input.topic,
        title: item.output?.title,
        content: item.output?.content,
        keywords: item.input.keywords
      }))
    }, null, 2);
  }

  /**
   * 결과 내보내기 (Markdown)
   */
  exportMarkdown() {
    if (!this.currentJob) return null;

    const completedItems = this.currentJob.items.filter(i => i.status === 'completed');

    let md = `# 대량 생성 결과\n\n`;
    md += `생성일: ${new Date().toLocaleDateString('ko-KR')}\n`;
    md += `총 ${completedItems.length}개 글\n\n---\n\n`;

    completedItems.forEach((item, index) => {
      md += `## ${index + 1}. ${item.output?.title || item.input.topic}\n\n`;
      md += `${item.output?.content || ''}\n\n`;
      md += `---\n\n`;
    });

    return md;
  }

  /**
   * 저장된 작업 로드
   */
  loadJob() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.currentJob = JSON.parse(saved);
        return this.currentJob;
      }
    } catch (error) {
      console.error('[BatchGenerator] Load failed:', error);
    }
    return null;
  }

  /**
   * 작업 저장
   */
  saveJob() {
    if (this.currentJob) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentJob));
    }
  }

  /**
   * 현재 작업 반환
   */
  getJob() {
    return this.currentJob;
  }

  /**
   * 진행률
   */
  getProgress() {
    if (!this.currentJob) return 0;
    const { total, completed, failed, skipped } = this.currentJob.progress;
    return total > 0 ? Math.round(((completed + failed + skipped) / total) * 100) : 0;
  }

  // 이벤트 헬퍼
  emit(eventName, detail = null) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  on(eventName, callback) {
    this.addEventListener(eventName, (e) => callback(e.detail));
  }

  off(eventName, callback) {
    this.removeEventListener(eventName, callback);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 싱글톤 인스턴스
const batchGenerator = new BatchGenerator();

export { batchGenerator, BatchGenerator, MAX_ITEMS };
