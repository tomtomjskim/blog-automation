/**
 * Blog Automation - Schedule Page
 * 예약 포스팅 관리 페이지
 */

import { store } from '../state.js';
import { postScheduler } from '../services/scheduler.js';
import { notificationService } from '../services/notification.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';

/**
 * 예약 페이지 렌더링
 */
export function renderSchedulePage() {
  const app = document.getElementById('app');
  const stats = postScheduler.getStats();
  const scheduled = postScheduler.getAll();
  const { naverBlog } = store.getState();

  app.innerHTML = `
    <div class="schedule-page">
      <div class="container container-md">
        <!-- 헤더 -->
        <div class="page-header">
          <div class="page-header-content">
            <h1 class="page-title">예약 포스팅</h1>
            <p class="page-description">글을 원하는 시간에 자동으로 발행합니다</p>
          </div>
        </div>

        <!-- 경고 배너 -->
        <div class="warning-banner">
          <span class="warning-icon">⚠️</span>
          <div class="warning-content">
            <strong>브라우저 기반 예약</strong>
            <p>예약 포스팅은 이 탭이 열려있을 때만 동작합니다. 브라우저를 닫으면 예약이 실행되지 않습니다.</p>
          </div>
        </div>

        <!-- 알림 권한 요청 -->
        ${renderNotificationPermission()}

        <!-- 예약 현황 -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${stats.scheduled}</span>
            <span class="stat-label">대기 중</span>
          </div>
          <div class="stat-card stat-success">
            <span class="stat-value">${stats.completed}</span>
            <span class="stat-label">완료</span>
          </div>
          <div class="stat-card stat-error">
            <span class="stat-value">${stats.failed}</span>
            <span class="stat-label">실패</span>
          </div>
        </div>

        <!-- 다음 예약 정보 -->
        ${renderNextSchedule()}

        <!-- 예약 목록 -->
        <div class="card mt-4">
          <div class="card-header flex justify-between items-center">
            <h2 class="card-title">예약 목록</h2>
            ${stats.completed + stats.failed + stats.cancelled > 0 ? `
              <button class="btn btn-ghost btn-sm" id="btn-clear-completed">
                완료 항목 정리
              </button>
            ` : ''}
          </div>
          <div class="card-body">
            ${scheduled.length > 0 ? `
              <div class="scheduled-list">
                ${scheduled
                  .sort((a, b) => {
                    // 상태 우선순위: scheduled > posting > failed > completed > cancelled
                    const priority = { scheduled: 0, posting: 1, failed: 2, completed: 3, cancelled: 4 };
                    if (priority[a.status] !== priority[b.status]) {
                      return priority[a.status] - priority[b.status];
                    }
                    return new Date(a.scheduledAt) - new Date(b.scheduledAt);
                  })
                  .map(post => renderScheduledItem(post))
                  .join('')}
              </div>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3 class="empty-state-title">예약된 포스팅이 없습니다</h3>
                <p class="empty-state-desc">결과 페이지에서 "예약하기"를 클릭해 예약을 추가하세요</p>
                <button class="btn btn-primary mt-4" onclick="window.location.hash='home'">
                  글 생성하기
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- 네이버 연동 상태 -->
        ${!naverBlog.connected ? `
          <div class="card mt-4">
            <div class="card-body">
              <div class="empty-state-inline">
                <span class="icon">📝</span>
                <div>
                  <strong>네이버 블로그 연동 필요</strong>
                  <p>예약 포스팅을 사용하려면 먼저 네이버 블로그를 연동해주세요</p>
                </div>
                <button class="btn btn-secondary" onclick="window.location.hash='settings'">
                  설정으로 이동
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // 이벤트 바인딩
  bindScheduleEvents();
}

/**
 * 알림 권한 렌더링
 */
function renderNotificationPermission() {
  const status = notificationService.getPermissionStatus();

  if (!status.supported) {
    return '';
  }

  if (status.enabled) {
    return `
      <div class="notification-status enabled">
        <span class="icon">🔔</span>
        <span>알림이 활성화되어 있습니다</span>
      </div>
    `;
  }

  if (status.permission === 'denied') {
    return `
      <div class="notification-status denied">
        <span class="icon">🔕</span>
        <span>알림이 차단되었습니다. 브라우저 설정에서 허용해주세요.</span>
      </div>
    `;
  }

  return `
    <div class="notification-status prompt">
      <span class="icon">🔔</span>
      <span>예약 완료 알림을 받으시겠습니까?</span>
      <button class="btn btn-sm btn-primary" id="btn-enable-notification">
        알림 허용
      </button>
    </div>
  `;
}

/**
 * 다음 예약 렌더링
 */
function renderNextSchedule() {
  const next = postScheduler.getNext();

  if (!next) return '';

  const scheduledTime = new Date(next.scheduledAt);
  const now = new Date();
  const diffMs = scheduledTime - now;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  let timeRemaining = '';
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    timeRemaining = `${days}일 후`;
  } else if (diffHours >= 1) {
    timeRemaining = `${diffHours}시간 ${diffMinutes % 60}분 후`;
  } else if (diffMinutes > 0) {
    timeRemaining = `${diffMinutes}분 후`;
  } else {
    timeRemaining = '곧 실행';
  }

  return `
    <div class="next-schedule-card">
      <div class="next-schedule-header">
        <span class="next-label">다음 예약</span>
        <span class="next-time">${timeRemaining}</span>
      </div>
      <div class="next-schedule-body">
        <h3 class="next-title">${escapeHtml(next.title)}</h3>
        <p class="next-datetime">
          📅 ${formatDateTime(scheduledTime)}
        </p>
      </div>
    </div>
  `;
}

/**
 * 예약 항목 렌더링
 */
function renderScheduledItem(post) {
  const statusConfig = {
    scheduled: { icon: '⏰', label: '예약됨', class: 'status-scheduled' },
    posting: { icon: '🔄', label: '포스팅 중', class: 'status-posting' },
    completed: { icon: '✅', label: '완료', class: 'status-completed' },
    failed: { icon: '❌', label: '실패', class: 'status-failed' },
    cancelled: { icon: '🚫', label: '취소됨', class: 'status-cancelled' }
  };

  const status = statusConfig[post.status] || statusConfig.scheduled;
  const scheduledDate = new Date(post.scheduledAt);

  return `
    <div class="scheduled-item ${status.class}" data-id="${post.id}">
      <div class="item-status">
        <span class="status-icon">${status.icon}</span>
        <span class="status-label">${status.label}</span>
      </div>

      <div class="item-content">
        <h3 class="item-title">${escapeHtml(post.title)}</h3>
        <div class="item-meta">
          <span class="scheduled-time">
            📅 ${formatDateTime(scheduledDate)}
          </span>
          ${post.retryCount > 0 ? `<span class="retry-count">재시도 ${post.retryCount}회</span>` : ''}
        </div>
        ${post.error ? `<p class="error-message">${escapeHtml(post.error)}</p>` : ''}
        ${post.postUrl ? `<a href="${post.postUrl}" target="_blank" class="post-link">글 보기 →</a>` : ''}
      </div>

      <div class="item-actions">
        ${post.status === 'scheduled' ? `
          <button class="btn btn-sm btn-primary btn-execute-now" data-id="${post.id}">지금 실행</button>
          <button class="btn btn-sm btn-secondary btn-edit-schedule" data-id="${post.id}">수정</button>
          <button class="btn btn-sm btn-ghost btn-cancel-schedule" data-id="${post.id}">취소</button>
        ` : ''}
        ${post.status === 'failed' ? `
          <button class="btn btn-sm btn-primary btn-retry-schedule" data-id="${post.id}">재시도</button>
        ` : ''}
        ${['completed', 'failed', 'cancelled'].includes(post.status) ? `
          <button class="btn btn-sm btn-ghost btn-delete-schedule" data-id="${post.id}">삭제</button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * 이벤트 바인딩
 */
function bindScheduleEvents() {
  // 알림 권한 요청
  document.getElementById('btn-enable-notification')?.addEventListener('click', async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      toast.success('알림이 활성화되었습니다');
    } else {
      toast.warning('알림 권한이 거부되었습니다');
    }
    renderSchedulePage();
  });

  // 완료 항목 정리
  document.getElementById('btn-clear-completed')?.addEventListener('click', async () => {
    const confirmed = await modal.confirm({
      title: '완료 항목 정리',
      message: '완료, 실패, 취소된 항목을 모두 삭제하시겠습니까?',
      confirmText: '정리'
    });

    if (confirmed) {
      postScheduler.clearCompleted();
      toast.success('완료 항목이 정리되었습니다');
      renderSchedulePage();
    }
  });

  // 지금 실행
  document.querySelectorAll('.btn-execute-now').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const confirmed = await modal.confirm({
        title: '지금 실행',
        message: '이 포스팅을 지금 바로 실행하시겠습니까?',
        confirmText: '실행'
      });

      if (confirmed) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>';

        try {
          await postScheduler.executeNow(id);
        } catch (error) {
          toast.error(error.message);
        }

        renderSchedulePage();
      }
    });
  });

  // 취소
  document.querySelectorAll('.btn-cancel-schedule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const confirmed = await modal.confirm({
        title: '예약 취소',
        message: '이 예약을 취소하시겠습니까?',
        confirmText: '취소',
        danger: true
      });

      if (confirmed) {
        try {
          postScheduler.cancel(id);
          renderSchedulePage();
        } catch (error) {
          toast.error(error.message);
        }
      }
    });
  });

  // 수정
  document.querySelectorAll('.btn-edit-schedule').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      showEditScheduleModal(id);
    });
  });

  // 재시도
  document.querySelectorAll('.btn-retry-schedule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const post = postScheduler.get(id);

      if (!post) return;

      try {
        // 상태를 scheduled로 변경하고 5분 후 재시도
        postScheduler.update(id, {
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          retryCount: 0,
          error: null
        });

        toast.success('5분 후 재시도합니다');
        renderSchedulePage();
      } catch (error) {
        toast.error(error.message);
      }
    });
  });

  // 삭제
  document.querySelectorAll('.btn-delete-schedule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;

      try {
        postScheduler.delete(id);
        toast.success('삭제되었습니다');
        renderSchedulePage();
      } catch (error) {
        toast.error(error.message);
      }
    });
  });
}

/**
 * 예약 수정 모달
 */
function showEditScheduleModal(id) {
  const post = postScheduler.get(id);
  if (!post) return;

  const scheduledDate = new Date(post.scheduledAt);
  const dateStr = scheduledDate.toISOString().split('T')[0];
  const timeStr = scheduledDate.toTimeString().slice(0, 5);

  const modalEl = document.createElement('div');
  modalEl.className = 'modal schedule-edit-modal';
  modalEl.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">예약 수정</h2>
        <button type="button" class="btn-close" id="close-edit-modal">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="input-label">예약 날짜</label>
          <input type="date" id="edit-schedule-date" class="input" value="${dateStr}" min="${getMinDate()}">
        </div>

        <div class="form-group mt-4">
          <label class="input-label">예약 시간</label>
          <input type="time" id="edit-schedule-time" class="input" value="${timeStr}">
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-edit-modal">취소</button>
        <button class="btn btn-primary" id="save-edit-modal">저장</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);
  requestAnimationFrame(() => modalEl.classList.add('open'));

  // 이벤트
  const closeModal = () => {
    modalEl.classList.remove('open');
    setTimeout(() => modalEl.remove(), 200);
  };

  modalEl.querySelector('#close-edit-modal').addEventListener('click', closeModal);
  modalEl.querySelector('#cancel-edit-modal').addEventListener('click', closeModal);
  modalEl.querySelector('.modal-backdrop').addEventListener('click', closeModal);

  modalEl.querySelector('#save-edit-modal').addEventListener('click', () => {
    const date = modalEl.querySelector('#edit-schedule-date').value;
    const time = modalEl.querySelector('#edit-schedule-time').value;

    if (!date || !time) {
      toast.warning('날짜와 시간을 모두 입력해주세요');
      return;
    }

    const newScheduledAt = new Date(`${date}T${time}`);

    try {
      postScheduler.update(id, { scheduledAt: newScheduledAt.toISOString() });
      toast.success('예약이 수정되었습니다');
      closeModal();
      renderSchedulePage();
    } catch (error) {
      toast.error(error.message);
    }
  });
}

/**
 * 예약 모달 표시 (결과 페이지에서 호출)
 */
export function showScheduleModal(postData, naverCategories = []) {
  const modalEl = document.createElement('div');
  modalEl.className = 'modal schedule-modal';
  modalEl.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">예약 포스팅 설정</h2>
        <button type="button" class="btn-close" id="close-schedule-modal">&times;</button>
      </div>

      <div class="modal-body">
        <div class="preview-card">
          <h3>${escapeHtml(postData.title)}</h3>
          <p class="preview-excerpt">${getExcerpt(postData.content, 100)}</p>
        </div>

        <div class="form-group mt-4">
          <label class="input-label">예약 날짜</label>
          <input type="date" id="schedule-date" class="input" min="${getMinDate()}" value="${getDefaultDate()}">
        </div>

        <div class="form-group mt-4">
          <label class="input-label">예약 시간</label>
          <input type="time" id="schedule-time" class="input" value="09:00">
        </div>

        ${naverCategories.length > 0 ? `
          <div class="form-group mt-4">
            <label class="input-label">카테고리</label>
            <select id="schedule-category" class="input select">
              <option value="">선택 안함</option>
              ${naverCategories.map(cat => `
                <option value="${cat.categoryId}">${cat.categoryName}</option>
              `).join('')}
            </select>
          </div>
        ` : ''}

        <div class="form-group mt-4">
          <label class="input-label">공개 범위</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" name="schedule-visibility" class="radio-input" value="public" checked>
              <span class="radio-label">전체 공개</span>
            </label>
            <label class="radio-item">
              <input type="radio" name="schedule-visibility" class="radio-input" value="neighbor">
              <span class="radio-label">이웃 공개</span>
            </label>
            <label class="radio-item">
              <input type="radio" name="schedule-visibility" class="radio-input" value="private">
              <span class="radio-label">비공개</span>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-schedule-modal">취소</button>
        <button class="btn btn-primary" id="confirm-schedule-modal">예약하기</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);
  requestAnimationFrame(() => modalEl.classList.add('open'));

  // 이벤트
  const closeModal = () => {
    modalEl.classList.remove('open');
    setTimeout(() => modalEl.remove(), 200);
  };

  modalEl.querySelector('#close-schedule-modal').addEventListener('click', closeModal);
  modalEl.querySelector('#cancel-schedule-modal').addEventListener('click', closeModal);
  modalEl.querySelector('.modal-backdrop').addEventListener('click', closeModal);

  modalEl.querySelector('#confirm-schedule-modal').addEventListener('click', () => {
    const date = modalEl.querySelector('#schedule-date').value;
    const time = modalEl.querySelector('#schedule-time').value;
    const categoryNo = modalEl.querySelector('#schedule-category')?.value || '';
    const visibility = modalEl.querySelector('input[name="schedule-visibility"]:checked')?.value || 'public';

    if (!date || !time) {
      toast.warning('날짜와 시간을 모두 입력해주세요');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);

    try {
      postScheduler.schedule({
        ...postData,
        categoryNo,
        visibility
      }, scheduledAt);

      closeModal();
    } catch (error) {
      toast.error(error.message);
    }
  });
}

// 유틸리티 함수
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

function getMinDate() {
  return new Date().toISOString().split('T')[0];
}

function getDefaultDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function getExcerpt(text, maxLength) {
  const stripped = text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();

  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength) + '...';
}
