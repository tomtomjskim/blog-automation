export async function register() {
  // 서버 사이드에서만 초기화
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Stuck 상태 복구: 서버 재시작 시 running → failed 전환
    try {
      const { query } = await import('@/lib/db');
      const result = await query<{ count: string }>(
        `UPDATE blog_auto.generations SET status = 'failed', error = 'Server restarted during generation'
         WHERE status = 'running' RETURNING id`
      );
      if (result.length > 0) {
        const { logger } = await import('@/lib/logger');
        logger.info(`[Init] Recovered ${result.length} stuck generation(s)`);
      }
    } catch {
      // DB 미연결 시 무시 (헬스체크에서 감지)
    }

    // 스케줄러 시작
    const { startScheduler } = await import('@/lib/scheduler');
    startScheduler();
  }
}
