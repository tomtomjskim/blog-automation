export async function register() {
  // 서버 사이드에서만 스케줄러 시작
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('@/lib/scheduler');
    startScheduler();
  }
}
