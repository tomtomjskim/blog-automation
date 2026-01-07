/**
 * Blog Automation - Modal UI Component
 * 모달 다이얼로그
 */

import { eventBus, EVENT_TYPES } from '../core/events.js';

class Modal {
  constructor() {
    this.overlay = null;
    this.activeModal = null;
    this.onCloseCallback = null;

    this.init();
  }

  init() {
    // 오버레이 생성
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);

    // 오버레이 클릭 시 닫기
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });

    // 스타일 추가
    this.addStyles();

    // 이벤트 구독
    eventBus.on(EVENT_TYPES.MODAL_OPEN, (data) => this.open(data));
    eventBus.on(EVENT_TYPES.MODAL_CLOSE, () => this.close());
  }

  addStyles() {
    if (document.getElementById('modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: var(--z-modal, 300);
        padding: 20px;
        animation: fadeIn 0.2s ease;
      }

      .modal-overlay.hiding {
        animation: fadeOut 0.15s ease forwards;
      }

      .modal {
        background-color: var(--bg-primary, white);
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        animation: modalSlideUp 0.3s ease;
      }

      .modal.hiding {
        animation: modalSlideDown 0.2s ease forwards;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-light, #E5E8EB);
      }

      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary, #191F28);
        margin: 0;
      }

      .modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: none;
        border: none;
        color: var(--text-tertiary, #6B7684);
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.15s ease;
        font-size: 20px;
      }

      .modal-close:hover {
        background-color: var(--bg-tertiary, #F2F4F6);
        color: var(--text-primary, #191F28);
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
        max-height: calc(90vh - 140px);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid var(--border-light, #E5E8EB);
        background-color: var(--bg-secondary, #F9FAFB);
      }

      .modal-sm { max-width: 400px; }
      .modal-lg { max-width: 700px; }
      .modal-xl { max-width: 900px; }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes modalSlideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes modalSlideDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(20px);
          opacity: 0;
        }
      }

      @media (max-width: 480px) {
        .modal-overlay {
          padding: 0;
          align-items: flex-end;
        }

        .modal {
          max-width: none;
          border-radius: 16px 16px 0 0;
          max-height: 85vh;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 모달 열기
   */
  open(options) {
    const {
      title = '',
      content = '',
      size = '',
      closable = true,
      footer = null,
      onClose = null
    } = options;

    this.onCloseCallback = onClose;

    const modal = document.createElement('div');
    modal.className = `modal ${size ? `modal-${size}` : ''}`;

    modal.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        ${closable ? '<button class="modal-close" aria-label="닫기">✕</button>' : ''}
      </div>
      <div class="modal-body">
        ${typeof content === 'string' ? content : ''}
      </div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    `;

    // content가 DOM 요소인 경우
    if (content instanceof HTMLElement) {
      modal.querySelector('.modal-body').innerHTML = '';
      modal.querySelector('.modal-body').appendChild(content);
    }

    // 닫기 버튼 이벤트
    if (closable) {
      modal.querySelector('.modal-close')?.addEventListener('click', () => {
        this.close();
      });
    }

    // 기존 모달 제거
    if (this.activeModal) {
      this.overlay.removeChild(this.activeModal);
    }

    this.overlay.appendChild(modal);
    this.overlay.style.display = 'flex';
    this.activeModal = modal;

    // 스크롤 방지
    document.body.style.overflow = 'hidden';

    return modal;
  }

  /**
   * 모달 닫기
   */
  close() {
    if (!this.activeModal) return;

    this.overlay.classList.add('hiding');
    this.activeModal.classList.add('hiding');

    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.overlay.classList.remove('hiding');
      if (this.activeModal) {
        this.activeModal.remove();
        this.activeModal = null;
      }
      document.body.style.overflow = '';

      if (this.onCloseCallback) {
        this.onCloseCallback();
        this.onCloseCallback = null;
      }
    }, 150);
  }

  /**
   * 확인 다이얼로그
   */
  confirm(options) {
    return new Promise((resolve) => {
      const {
        title = '확인',
        message = '',
        confirmText = '확인',
        cancelText = '취소',
        confirmClass = 'btn-primary',
        danger = false
      } = options;

      const content = `<p style="color: var(--text-secondary); line-height: 1.6;">${message}</p>`;

      const footer = `
        <button class="btn btn-secondary modal-cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : confirmClass} modal-confirm">${confirmText}</button>
      `;

      const modal = this.open({
        title,
        content,
        footer,
        size: 'sm',
        closable: true,
        onClose: () => resolve(false)
      });

      modal.querySelector('.modal-cancel').addEventListener('click', () => {
        this.close();
        resolve(false);
      });

      modal.querySelector('.modal-confirm').addEventListener('click', () => {
        this.close();
        resolve(true);
      });
    });
  }

  /**
   * 알림 다이얼로그
   */
  alert(options) {
    return new Promise((resolve) => {
      const {
        title = '알림',
        message = '',
        buttonText = '확인'
      } = typeof options === 'string' ? { message: options } : options;

      const content = `<p style="color: var(--text-secondary); line-height: 1.6;">${message}</p>`;

      const footer = `
        <button class="btn btn-primary modal-ok">${buttonText}</button>
      `;

      const modal = this.open({
        title,
        content,
        footer,
        size: 'sm',
        closable: true,
        onClose: () => resolve()
      });

      modal.querySelector('.modal-ok').addEventListener('click', () => {
        this.close();
        resolve();
      });
    });
  }

  /**
   * 프롬프트 다이얼로그
   */
  prompt(options) {
    return new Promise((resolve) => {
      const {
        title = '입력',
        message = '',
        placeholder = '',
        defaultValue = '',
        confirmText = '확인',
        cancelText = '취소'
      } = options;

      const content = `
        ${message ? `<p style="color: var(--text-secondary); margin-bottom: 16px;">${message}</p>` : ''}
        <input type="text" class="input modal-input" placeholder="${placeholder}" value="${defaultValue}">
      `;

      const footer = `
        <button class="btn btn-secondary modal-cancel">${cancelText}</button>
        <button class="btn btn-primary modal-confirm">${confirmText}</button>
      `;

      const modal = this.open({
        title,
        content,
        footer,
        size: 'sm',
        closable: true,
        onClose: () => resolve(null)
      });

      const input = modal.querySelector('.modal-input');
      input.focus();
      input.select();

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.close();
          resolve(input.value);
        }
      });

      modal.querySelector('.modal-cancel').addEventListener('click', () => {
        this.close();
        resolve(null);
      });

      modal.querySelector('.modal-confirm').addEventListener('click', () => {
        this.close();
        resolve(input.value);
      });
    });
  }
}

// 싱글톤 인스턴스
const modal = new Modal();

export { modal, Modal };
