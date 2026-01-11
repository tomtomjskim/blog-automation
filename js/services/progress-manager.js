/**
 * Blog Automation - Progress Manager
 * 작업 진행상황 모니터링 및 관리
 */

import { eventBus, EVENT_TYPES } from '../core/events.js';

class ProgressManager {
  constructor() {
    this.tasks = new Map();
    this.listeners = new Set();
    this.history = [];
    this.maxHistory = 50;
  }

  /**
   * 작업 시작
   * @param {string} taskId - 작업 ID
   * @param {object} config - 작업 설정
   * @returns {object} 작업 정보
   */
  startTask(taskId, config = {}) {
    const {
      type = 'generation',  // 'generation', 'batch', 'image', 'schedule', 'upload'
      title = '',
      total = 1,
      steps = [],
      metadata = {}
    } = config;

    const task = {
      id: taskId,
      type,
      title,
      status: 'running',
      progress: 0,
      total,
      current: 0,
      startedAt: Date.now(),
      estimatedTime: null,
      steps: steps.map((step, index) => ({
        id: index,
        name: step,
        status: 'pending'
      })),
      currentStep: 0,
      errors: [],
      warnings: [],
      metadata,
      result: null
    };

    this.tasks.set(taskId, task);
    this.notify('start', task);
    eventBus.emit(EVENT_TYPES.TASK_STARTED, { taskId, task });

    return task;
  }

  /**
   * 진행률 업데이트
   * @param {string} taskId - 작업 ID
   * @param {object} update - 업데이트 내용
   */
  updateProgress(taskId, update = {}) {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const { current, message, data } = update;

    if (current !== undefined) {
      task.current = current;
      task.progress = task.total > 0 ? (current / task.total) * 100 : 0;

      // 예상 시간 계산
      if (current > 0) {
        const elapsed = Date.now() - task.startedAt;
        const avgPerItem = elapsed / current;
        task.estimatedTime = Math.round(avgPerItem * (task.total - current));
      }
    }

    if (message) {
      task.message = message;
    }

    if (data) {
      task.metadata = { ...task.metadata, ...data };
    }

    this.notify('progress', task);
    return task;
  }

  /**
   * 단계 시작
   * @param {string} taskId - 작업 ID
   * @param {number|string} stepIndex - 단계 인덱스 또는 이름
   */
  startStep(taskId, stepIndex) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    let index = stepIndex;
    if (typeof stepIndex === 'string') {
      index = task.steps.findIndex(s => s.name === stepIndex);
    }

    if (index >= 0 && index < task.steps.length) {
      // 이전 단계들 완료 처리
      for (let i = 0; i < index; i++) {
        if (task.steps[i].status !== 'error') {
          task.steps[i].status = 'done';
        }
      }

      task.steps[index].status = 'running';
      task.steps[index].startedAt = Date.now();
      task.currentStep = index;

      this.notify('step', task);
    }
  }

  /**
   * 단계 완료
   * @param {string} taskId - 작업 ID
   * @param {number|string} stepIndex - 단계 인덱스 또는 이름
   * @param {object} result - 단계 결과
   */
  completeStep(taskId, stepIndex, result = null) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    let index = stepIndex;
    if (typeof stepIndex === 'string') {
      index = task.steps.findIndex(s => s.name === stepIndex);
    }

    if (index >= 0 && index < task.steps.length) {
      task.steps[index].status = 'done';
      task.steps[index].completedAt = Date.now();
      task.steps[index].duration = task.steps[index].completedAt - (task.steps[index].startedAt || task.startedAt);
      task.steps[index].result = result;

      this.notify('step', task);
    }
  }

  /**
   * 단계 실패
   * @param {string} taskId - 작업 ID
   * @param {number|string} stepIndex - 단계 인덱스 또는 이름
   * @param {string} error - 오류 메시지
   */
  failStep(taskId, stepIndex, error) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    let index = stepIndex;
    if (typeof stepIndex === 'string') {
      index = task.steps.findIndex(s => s.name === stepIndex);
    }

    if (index >= 0 && index < task.steps.length) {
      task.steps[index].status = 'error';
      task.steps[index].error = error;

      this.notify('step', task);
    }
  }

  /**
   * 경고 추가
   * @param {string} taskId - 작업 ID
   * @param {string} warning - 경고 메시지
   */
  addWarning(taskId, warning) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.warnings.push({
      message: warning,
      timestamp: Date.now()
    });

    this.notify('warning', task);
  }

  /**
   * 오류 추가
   * @param {string} taskId - 작업 ID
   * @param {string} error - 오류 메시지
   * @param {boolean} fatal - 치명적 오류 여부
   */
  addError(taskId, error, fatal = false) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.errors.push({
      message: error,
      timestamp: Date.now(),
      fatal
    });

    if (fatal) {
      this.failTask(taskId, error);
    } else {
      this.notify('error', task);
    }
  }

  /**
   * 작업 완료
   * @param {string} taskId - 작업 ID
   * @param {object} result - 작업 결과
   */
  completeTask(taskId, result = null) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.progress = 100;
    task.completedAt = Date.now();
    task.duration = task.completedAt - task.startedAt;
    task.result = result;

    // 모든 단계 완료 처리
    task.steps.forEach(step => {
      if (step.status === 'running' || step.status === 'pending') {
        step.status = 'done';
      }
    });

    this.notify('complete', task);
    this.archiveTask(task);
    eventBus.emit(EVENT_TYPES.TASK_COMPLETED, { taskId, task, result });
  }

  /**
   * 작업 실패
   * @param {string} taskId - 작업 ID
   * @param {string} error - 오류 메시지
   */
  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.completedAt = Date.now();
    task.duration = task.completedAt - task.startedAt;
    task.error = error;

    this.notify('fail', task);
    this.archiveTask(task);
    eventBus.emit(EVENT_TYPES.TASK_FAILED, { taskId, task, error });
  }

  /**
   * 작업 일시정지
   * @param {string} taskId - 작업 ID
   */
  pauseTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'running') return;

    task.status = 'paused';
    task.pausedAt = Date.now();

    this.notify('pause', task);
    eventBus.emit(EVENT_TYPES.TASK_PAUSED, { taskId, task });
  }

  /**
   * 작업 재개
   * @param {string} taskId - 작업 ID
   */
  resumeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'paused') return;

    task.status = 'running';
    // 일시정지 시간 보정
    const pauseDuration = Date.now() - task.pausedAt;
    task.startedAt += pauseDuration;
    delete task.pausedAt;

    this.notify('resume', task);
    eventBus.emit(EVENT_TYPES.TASK_RESUMED, { taskId, task });
  }

  /**
   * 작업 취소
   * @param {string} taskId - 작업 ID
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'cancelled';
    task.completedAt = Date.now();
    task.duration = task.completedAt - task.startedAt;

    this.notify('cancel', task);
    this.archiveTask(task);
    eventBus.emit(EVENT_TYPES.TASK_CANCELLED, { taskId, task });
  }

  /**
   * 작업 조회
   * @param {string} taskId - 작업 ID
   * @returns {object|null} 작업 정보
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * 활성 작업 목록
   * @returns {array} 활성 작업 목록
   */
  getActiveTasks() {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'running' || t.status === 'paused');
  }

  /**
   * 타입별 작업 목록
   * @param {string} type - 작업 타입
   * @returns {array} 작업 목록
   */
  getTasksByType(type) {
    return Array.from(this.tasks.values())
      .filter(t => t.type === type);
  }

  /**
   * 히스토리 조회
   * @param {number} limit - 최대 개수
   * @returns {array} 히스토리 목록
   */
  getHistory(limit = 20) {
    return this.history.slice(0, limit);
  }

  /**
   * 실시간 업데이트 구독
   * @param {function} callback - 콜백 함수
   * @returns {function} 구독 해제 함수
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 리스너에게 알림
   * @param {string} event - 이벤트 타입
   * @param {object} task - 작업 정보
   */
  notify(event, task) {
    const payload = { event, task: { ...task }, timestamp: Date.now() };

    this.listeners.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error('[ProgressManager] Listener error:', error);
      }
    });
  }

  /**
   * 작업 아카이브
   * @param {object} task - 작업 정보
   */
  archiveTask(task) {
    this.history.unshift({
      ...task,
      archivedAt: Date.now()
    });

    // 히스토리 크기 제한
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    // 활성 목록에서 제거
    this.tasks.delete(task.id);
  }

  /**
   * 모든 작업 취소
   */
  cancelAll() {
    for (const taskId of this.tasks.keys()) {
      this.cancelTask(taskId);
    }
  }

  /**
   * 통계 조회
   * @returns {object} 통계 정보
   */
  getStats() {
    const active = this.getActiveTasks();
    const completed = this.history.filter(t => t.status === 'completed');
    const failed = this.history.filter(t => t.status === 'failed');

    return {
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      successRate: completed.length + failed.length > 0
        ? ((completed.length / (completed.length + failed.length)) * 100).toFixed(1)
        : 0,
      avgDuration: completed.length > 0
        ? Math.round(completed.reduce((sum, t) => sum + (t.duration || 0), 0) / completed.length)
        : 0
    };
  }

  /**
   * 진행률 UI 렌더링 헬퍼
   * @param {object} task - 작업 정보
   * @returns {string} HTML 문자열
   */
  renderProgressUI(task) {
    if (!task) return '';

    const statusIcons = {
      running: '⏳',
      paused: '⏸️',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫'
    };

    const stepIcons = {
      pending: '⏸️',
      running: '⏳',
      done: '✅',
      error: '❌'
    };

    return `
      <div class="progress-task" data-task-id="${task.id}">
        <div class="progress-header">
          <span class="progress-status">${statusIcons[task.status] || '•'}</span>
          <span class="progress-title">${task.title || task.type}</span>
          ${task.status === 'running' && task.estimatedTime ? `
            <span class="progress-eta">남은 시간: ${this.formatDuration(task.estimatedTime)}</span>
          ` : ''}
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${task.progress}%"></div>
          <span class="progress-percent">${Math.round(task.progress)}%</span>
        </div>

        ${task.total > 1 ? `
          <div class="progress-count">${task.current} / ${task.total}</div>
        ` : ''}

        ${task.steps.length > 0 ? `
          <div class="progress-steps">
            ${task.steps.map(step => `
              <div class="progress-step ${step.status}">
                <span class="step-icon">${stepIcons[step.status]}</span>
                <span class="step-name">${step.name}</span>
                ${step.duration ? `<span class="step-duration">${this.formatDuration(step.duration)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${task.message ? `
          <div class="progress-message">${task.message}</div>
        ` : ''}

        ${task.errors.length > 0 ? `
          <div class="progress-errors">
            ${task.errors.map(e => `
              <div class="progress-error">${e.message}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 시간 포맷팅
   * @param {number} ms - 밀리초
   * @returns {string} 포맷된 시간
   */
  formatDuration(ms) {
    if (ms < 1000) return '1초 미만';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    }
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    }
    return `${seconds}초`;
  }

  /**
   * ID 생성
   * @param {string} prefix - 접두사
   * @returns {string} 고유 ID
   */
  static generateId(prefix = 'task') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 싱글톤 인스턴스
const progressManager = new ProgressManager();

export { progressManager, ProgressManager };
