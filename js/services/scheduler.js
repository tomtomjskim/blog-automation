/**
 * Blog Automation - Post Scheduler Service
 * 예약 포스팅 관리
 */

import { notificationService } from './notification.js';
import { naverBlogService } from './naver-blog.js';

const STORAGE_KEY = 'blog_auto_scheduled';
const CHECK_INTERVAL = 30000; // 30초
const MAX_SCHEDULED = 10;
const MAX_RETRY = 3;

class PostScheduler {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.listeners = new Map();
  }

  /**
   * 스케줄러 시작
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[Scheduler] Started');

    // 즉시 1회 실행
    this.check();

    // 주기적 체크
    this.intervalId = setInterval(() => {
      this.check();
    }, CHECK_INTERVAL);

    // 페이지 가시성 변경 시 즉시 체크
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * 스케줄러 중지
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    console.log('[Scheduler] Stopped');
  }

  /**
   * 가시성 변경 핸들러
   */
  handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.isRunning) {
      this.check();
    }
  };

  /**
   * 예약 추가
   * @param {object} postData - 포스트 데이터
   * @param {string|Date} scheduledAt - 예약 시간
   * @returns {object} 생성된 예약
   */
  schedule(postData, scheduledAt) {
    const scheduled = this.getAll();

    // 최대 개수 확인
    const activeCount = scheduled.filter(p => p.status === 'scheduled').length;
    if (activeCount >= MAX_SCHEDULED) {
      throw new Error(`최대 ${MAX_SCHEDULED}개까지만 예약할 수 있습니다.`);
    }

    // 과거 시간 확인
    const targetTime = new Date(scheduledAt);
    if (targetTime <= new Date()) {
      throw new Error('예약 시간은 현재 시간 이후여야 합니다.');
    }

    const newPost = {
      id: `scheduled_${Date.now()}_${this.generateId()}`,
      status: 'scheduled',

      // 콘텐츠
      title: postData.title,
      content: postData.content,
      keywords: postData.keywords || [],

      // 네이버 블로그 설정
      naverSettings: {
        categoryNo: postData.categoryNo || '',
        visibility: postData.visibility || 'public',
        isPublic: postData.visibility !== 'private'
      },

      // 스케줄 정보
      scheduledAt: targetTime.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      // 메타데이터
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // 실행 결과
      executedAt: null,
      result: null,
      error: null,
      postUrl: null,
      retryCount: 0
    };

    scheduled.push(newPost);
    this.save(scheduled);

    notificationService.success(
      '예약 완료',
      `${this.formatDateTime(targetTime)}에 포스팅 예정`
    );

    this.emit('scheduled', newPost);
    return newPost;
  }

  /**
   * 예약된 포스트 확인 및 실행
   */
  async check() {
    const scheduled = this.getAll();
    const now = new Date();

    for (const post of scheduled) {
      if (post.status !== 'scheduled') continue;

      const targetTime = new Date(post.scheduledAt);
      if (targetTime <= now) {
        await this.execute(post);
      }
    }
  }

  /**
   * 포스트 실행
   */
  async execute(post) {
    console.log(`[Scheduler] Executing: ${post.id} - ${post.title}`);

    this.updateStatus(post.id, 'posting');
    this.emit('executing', post);

    try {
      const result = await naverBlogService.postArticle({
        title: post.title,
        content: post.content,
        categoryId: post.naverSettings?.categoryNo,
        tags: post.keywords,
        isPublic: post.naverSettings?.isPublic ?? true
      });

      this.updateStatus(post.id, 'completed', {
        executedAt: new Date().toISOString(),
        result: result,
        postUrl: result.url
      });

      notificationService.success(
        '포스팅 완료',
        `"${post.title}" 발행 완료`,
        { url: result.url, label: '확인하기' }
      );

      this.emit('completed', { post, result });

    } catch (error) {
      console.error(`[Scheduler] Failed: ${post.id}`, error);

      const updatedPost = this.get(post.id);
      const retryCount = (updatedPost?.retryCount || 0) + 1;

      // 재시도 로직
      if (retryCount < MAX_RETRY) {
        this.updateStatus(post.id, 'scheduled', {
          retryCount,
          lastError: error.message,
          // 5분 후 재시도
          scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });

        notificationService.warning(
          '포스팅 실패 - 재시도 예정',
          `${retryCount}/${MAX_RETRY} 재시도 (5분 후)`
        );
      } else {
        this.updateStatus(post.id, 'failed', {
          executedAt: new Date().toISOString(),
          error: error.message
        });

        notificationService.error(
          '포스팅 실패',
          `"${post.title}" 발행 실패: ${error.message}`
        );
      }

      this.emit('failed', { post, error });
    }
  }

  /**
   * 예약 취소
   */
  cancel(id) {
    const post = this.get(id);
    if (!post) throw new Error('예약을 찾을 수 없습니다.');
    if (post.status !== 'scheduled') {
      throw new Error('취소할 수 없는 상태입니다.');
    }

    this.updateStatus(id, 'cancelled');

    notificationService.info(
      '예약 취소',
      `"${post.title}" 예약이 취소되었습니다.`
    );

    this.emit('cancelled', post);
  }

  /**
   * 즉시 실행
   */
  async executeNow(id) {
    const post = this.get(id);
    if (!post) throw new Error('예약을 찾을 수 없습니다.');
    if (post.status !== 'scheduled') {
      throw new Error('실행할 수 없는 상태입니다.');
    }

    await this.execute(post);
  }

  /**
   * 예약 수정
   */
  update(id, updates) {
    const post = this.get(id);
    if (!post) throw new Error('예약을 찾을 수 없습니다.');
    if (post.status !== 'scheduled') {
      throw new Error('수정할 수 없는 상태입니다.');
    }

    const scheduled = this.getAll();
    const index = scheduled.findIndex(p => p.id === id);

    if (index >= 0) {
      // 시간 변경 시 검증
      if (updates.scheduledAt) {
        const targetTime = new Date(updates.scheduledAt);
        if (targetTime <= new Date()) {
          throw new Error('예약 시간은 현재 시간 이후여야 합니다.');
        }
        updates.scheduledAt = targetTime.toISOString();
      }

      scheduled[index] = {
        ...scheduled[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save(scheduled);

      this.emit('updated', scheduled[index]);
      return scheduled[index];
    }

    throw new Error('예약 수정에 실패했습니다.');
  }

  /**
   * 예약 삭제
   */
  delete(id) {
    const post = this.get(id);
    if (!post) throw new Error('예약을 찾을 수 없습니다.');

    // 진행 중인 포스팅은 삭제 불가
    if (post.status === 'posting') {
      throw new Error('포스팅 중인 예약은 삭제할 수 없습니다.');
    }

    const scheduled = this.getAll().filter(p => p.id !== id);
    this.save(scheduled);

    this.emit('deleted', post);
  }

  /**
   * 완료/실패/취소 항목 정리
   */
  clearCompleted() {
    const scheduled = this.getAll().filter(p =>
      !['completed', 'failed', 'cancelled'].includes(p.status)
    );
    this.save(scheduled);
    this.emit('cleared');
  }

  // Storage 헬퍼 메서드
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  get(id) {
    return this.getAll().find(p => p.id === id);
  }

  save(scheduled) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduled));
  }

  updateStatus(id, status, additionalData = {}) {
    const scheduled = this.getAll();
    const index = scheduled.findIndex(p => p.id === id);

    if (index >= 0) {
      scheduled[index] = {
        ...scheduled[index],
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData
      };
      this.save(scheduled);
    }
  }

  // 통계
  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      scheduled: all.filter(p => p.status === 'scheduled').length,
      posting: all.filter(p => p.status === 'posting').length,
      completed: all.filter(p => p.status === 'completed').length,
      failed: all.filter(p => p.status === 'failed').length,
      cancelled: all.filter(p => p.status === 'cancelled').length
    };
  }

  // 다음 예약 정보
  getNext() {
    const scheduled = this.getAll()
      .filter(p => p.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    return scheduled[0] || null;
  }

  // 유틸리티
  generateId() {
    return Math.random().toString(36).substring(2, 11);
  }

  formatDateTime(date) {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // 이벤트 시스템
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Scheduler] Event handler error:`, error);
        }
      });
    }
  }
}

// 싱글톤 인스턴스
const postScheduler = new PostScheduler();

export { postScheduler, PostScheduler };
