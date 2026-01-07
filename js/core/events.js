/**
 * Blog Automation - Events Module
 * Pub/Sub 이벤트 버스
 */

class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
  }

  /**
   * 이벤트 구독
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);

    // 구독 해제 함수 반환
    return () => this.off(event, callback);
  }

  /**
   * 한번만 실행되는 이벤트 구독
   */
  once(event, callback) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set());
    }
    this.onceEvents.get(event).add(callback);

    return () => this.onceEvents.get(event)?.delete(callback);
  }

  /**
   * 이벤트 구독 해제
   */
  off(event, callback) {
    if (callback) {
      this.events.get(event)?.delete(callback);
      this.onceEvents.get(event)?.delete(callback);
    } else {
      this.events.delete(event);
      this.onceEvents.delete(event);
    }
  }

  /**
   * 이벤트 발생
   */
  emit(event, data) {
    // 일반 구독자 실행
    this.events.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event handler error for "${event}":`, error);
      }
    });

    // 일회성 구독자 실행 후 삭제
    this.onceEvents.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Once event handler error for "${event}":`, error);
      }
    });
    this.onceEvents.delete(event);

    // 와일드카드 구독자 (* 이벤트)
    this.events.get('*')?.forEach(callback => {
      try {
        callback({ event, data });
      } catch (error) {
        console.error('Wildcard event handler error:', error);
      }
    });
  }

  /**
   * 모든 이벤트 구독 해제
   */
  clear() {
    this.events.clear();
    this.onceEvents.clear();
  }

  /**
   * 이벤트 구독자 수 반환
   */
  listenerCount(event) {
    return (this.events.get(event)?.size || 0) +
           (this.onceEvents.get(event)?.size || 0);
  }
}

// 미리 정의된 이벤트 타입
const EVENT_TYPES = {
  // App Events
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',

  // Auth Events
  AUTH_UNLOCK: 'auth:unlock',
  AUTH_LOCK: 'auth:lock',

  // Generation Events
  GENERATE_START: 'generate:start',
  GENERATE_PROGRESS: 'generate:progress',
  GENERATE_COMPLETE: 'generate:complete',
  GENERATE_ERROR: 'generate:error',
  GENERATE_STREAM: 'generate:stream',

  // Image Events
  IMAGE_START: 'image:start',
  IMAGE_COMPLETE: 'image:complete',
  IMAGE_ERROR: 'image:error',

  // Naver Blog Events
  NAVER_POST_START: 'naver:post:start',
  NAVER_POST_COMPLETE: 'naver:post:complete',
  NAVER_POST_ERROR: 'naver:post:error',

  // UI Events
  TOAST_SHOW: 'toast:show',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  THEME_CHANGE: 'theme:change',

  // Storage Events
  DRAFT_SAVED: 'draft:saved',
  HISTORY_UPDATED: 'history:updated',
  SETTINGS_UPDATED: 'settings:updated',

  // Route Events
  ROUTE_CHANGE: 'route:change'
};

// 싱글톤 인스턴스
const eventBus = new EventBus();

export { eventBus, EventBus, EVENT_TYPES };
