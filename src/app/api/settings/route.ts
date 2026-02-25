import { NextResponse } from 'next/server';
import { isKlingConfigured } from '@/lib/kling';

/** GET: 현재 설정 상태 확인 (API 키 보유 여부 등) */
export async function GET() {
  return NextResponse.json({
    kling: {
      configured: isKlingConfigured(),
      model: process.env.KLING_MODEL || 'kling-v2-1',
    },
  });
}
