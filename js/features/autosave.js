/**
 * Blog Automation - Auto Save Feature
 * 자동 저장 기능
 */

import { store, saveDraft } from '../state.js';
import { storage } from '../core/storage.js';
import { eventBus, EVENT_TYPES } from '../core/events.js';
import { toast } from '../ui/toast.js';

class AutoSave {
  constructor() {
    this.enabled = true;
    this.interval = 30000; // 30초
    this.timer = null;
    this.lastSavedData = null;
    this.isDirty = false;
  }

  /**
   * 자동 저장 시작
   */
  start() {
    if (this.timer) return;

    const settings = store.get('settings');
    if (settings?.autosave === false) {
      this.enabled = false;
      return;
    }

    this.enabled = true;
    this.timer = setInterval(() => this.save(), this.interval);

    // 페이지 이탈 시 저장
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // 입력 변경 감지
    document.addEventListener('input', this.handleInput.bind(this));

    console.log('AutoSave started');
  }

  /**
   * 자동 저장 중지
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    document.removeEventListener('input', this.handleInput);
    console.log('AutoSave stopped');
  }

  /**
   * 입력 핸들러
   */
  handleInput(e) {
    // 현재 페이지가 홈이고, 관련 입력 필드인 경우만
    const currentPage = store.get('currentPage');
    if (currentPage !== 'home') return;

    const relevantFields = ['topic', 'keywords', 'additional-info', 'reference-url'];
    if (relevantFields.some(field => e.target.id?.includes(field))) {
      this.isDirty = true;
    }
  }

  /**
   * 페이지 이탈 핸들러
   */
  handleBeforeUnload(e) {
    if (this.isDirty) {
      this.save(true);
    }
  }

  /**
   * 저장 실행
   */
  save(force = false) {
    if (!this.enabled && !force) return;
    if (!this.isDirty && !force) return;

    const currentPage = store.get('currentPage');
    if (currentPage !== 'home') return;

    const currentGen = store.get('currentGeneration');

    // 저장할 내용이 있는지 확인
    if (!currentGen.topic && !currentGen.additionalInfo) return;

    // 이전 저장과 동일한지 확인
    const dataHash = JSON.stringify({
      topic: currentGen.topic,
      keywords: currentGen.keywords,
      style: currentGen.style,
      length: currentGen.length,
      additionalInfo: currentGen.additionalInfo,
      referenceUrl: currentGen.referenceUrl
    });

    if (dataHash === this.lastSavedData) return;

    try {
      // 임시 저장 데이터에 저장
      const autosaveData = {
        ...currentGen,
        autosavedAt: new Date().toISOString()
      };

      localStorage.setItem('blog_auto_autosave', JSON.stringify(autosaveData));

      this.lastSavedData = dataHash;
      this.isDirty = false;

      eventBus.emit(EVENT_TYPES.AUTOSAVE_COMPLETE, autosaveData);

      // UI 피드백 (조용하게)
      this.showSaveIndicator();
    } catch (error) {
      console.error('AutoSave error:', error);
    }
  }

  /**
   * 자동 저장 데이터 불러오기
   */
  load() {
    try {
      const data = localStorage.getItem('blog_auto_autosave');
      if (!data) return null;

      const parsed = JSON.parse(data);

      // 24시간 이상 지난 데이터는 무시
      const savedTime = new Date(parsed.autosavedAt);
      const hoursSinceLastSave = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastSave > 24) {
        this.clear();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('AutoSave load error:', error);
      return null;
    }
  }

  /**
   * 자동 저장 데이터 삭제
   */
  clear() {
    localStorage.removeItem('blog_auto_autosave');
    this.lastSavedData = null;
    this.isDirty = false;
  }

  /**
   * 저장 인디케이터 표시
   */
  showSaveIndicator() {
    let indicator = document.getElementById('autosave-indicator');

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'autosave-indicator';
      indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 8px 12px;
        background: var(--bg-secondary);
        border-radius: 8px;
        font-size: 12px;
        color: var(--text-tertiary);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 100;
      `;
      document.body.appendChild(indicator);
    }

    indicator.textContent = '자동 저장됨';
    indicator.style.opacity = '1';

    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }

  /**
   * 설정 업데이트
   */
  updateSettings(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }
}

// 싱글톤 인스턴스
const autoSave = new AutoSave();

export { autoSave, AutoSave };
