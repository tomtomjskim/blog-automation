import { query, queryOne } from './db';
import { getRunningCount } from './generation-store';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

/** 스케줄러 시작 (5분 간격 폴링) */
export function startScheduler() {
  if (schedulerInterval) return;

  console.log('[Scheduler] Started - checking every 5 minutes');
  schedulerInterval = setInterval(checkAndRunScheduled, 5 * 60 * 1000);

  // 시작 즉시 1회 실행
  setTimeout(checkAndRunScheduled, 10000);
}

/** 스케줄러 정지 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Stopped');
  }
}

/** 스턱 generation 정리 (30분 이상 running 상태인 레코드를 failed로 변경) */
async function cleanupStuckGenerations() {
  const stuck = await query<{ id: string }>(
    `UPDATE generations
     SET status = 'failed',
         error  = 'Timeout: generation stuck for over 30 minutes'
     WHERE status = 'running'
       AND created_at < NOW() - INTERVAL '30 minutes'
     RETURNING id`,
  );

  if (stuck.length > 0) {
    console.log(`[scheduler] Cleaned up ${stuck.length} stuck generation(s)`);
  }
}

/** 예약된 글 확인 & 실행 */
async function checkAndRunScheduled() {
  if (isRunning) return;
  isRunning = true;

  try {
    // 스턱 generation 정리
    await cleanupStuckGenerations();

    // 동시 생성 체크
    if (getRunningCount() >= 1) {
      return;
    }

    // due된 예약 조회
    const scheduled = await queryOne<{
      id: string;
      topic: string;
      keywords: string[];
      style: string;
      length: string;
      persona: string | null;
      tone: string | null;
      auto_publish: boolean;
    }>(
      `SELECT id, topic, keywords, style, length, persona, tone, auto_publish
       FROM scheduled_posts
       WHERE status = 'pending'
         AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC
       LIMIT 1`,
    );

    if (!scheduled) return;

    console.log(`[Scheduler] Running scheduled post: ${scheduled.id} - ${scheduled.topic}`);

    // 상태를 running으로 변경
    await query(
      `UPDATE scheduled_posts SET status = 'running' WHERE id = $1`,
      [scheduled.id],
    );

    // 생성 API를 내부 호출하여 글 생성
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: scheduled.topic,
          keywords: scheduled.keywords,
          style: scheduled.style,
          length: scheduled.length,
          mode: 'quality',
          persona: scheduled.persona,
          tone: scheduled.tone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await query(
          `UPDATE scheduled_posts SET status = 'completed', generation_id = $2 WHERE id = $1`,
          [scheduled.id, data.id],
        );
        console.log(`[Scheduler] Completed: ${scheduled.id} → generation ${data.id}`);
      } else {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        await query(
          `UPDATE scheduled_posts SET status = 'failed' WHERE id = $1`,
          [scheduled.id],
        );
        console.error(`[Scheduler] Failed: ${scheduled.id}`, errData);
      }
    } catch (err) {
      await query(
        `UPDATE scheduled_posts SET status = 'failed' WHERE id = $1`,
        [scheduled.id],
      );
      console.error(`[Scheduler] Error for ${scheduled.id}:`, err);
    }
  } catch (err) {
    console.error('[Scheduler] Check error:', err);
  } finally {
    isRunning = false;
  }
}
