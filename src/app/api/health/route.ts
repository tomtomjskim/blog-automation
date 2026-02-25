import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/db';
import { execSync } from 'child_process';

export async function GET() {
  const checks: Record<string, boolean> = {};

  // DB 연결 확인
  checks.database = await healthCheck();

  // Claude CLI 바이너리 존재 확인
  try {
    execSync('which claude', { timeout: 5000 });
    checks.claudeCli = true;
  } catch {
    checks.claudeCli = false;
  }

  const healthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks },
    { status: healthy ? 200 : 503 },
  );
}
