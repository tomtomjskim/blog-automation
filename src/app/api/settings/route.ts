import { NextRequest, NextResponse } from 'next/server';
import { isKlingConfigured } from '@/lib/kling';
import { isNaverConfigured, saveNaverConfig, getNaverConfig } from '@/lib/naver-xmlrpc';

/** GET: 현재 설정 상태 확인 */
export async function GET() {
  const naverConfig = await getNaverConfig().catch(() => null);

  return NextResponse.json({
    kling: {
      configured: isKlingConfigured(),
      model: process.env.KLING_MODEL || 'kling-v2-1',
    },
    naver: {
      configured: await isNaverConfigured().catch(() => false),
      blogId: naverConfig?.blogId || null,
    },
  });
}

/** PATCH: 설정 저장 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { naverBlogId, naverApiPassword } = body;

    if (naverBlogId && naverApiPassword) {
      await saveNaverConfig({ blogId: naverBlogId, password: naverApiPassword });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '저장할 설정이 없습니다.' }, { status: 400 });
  } catch (err) {
    console.error('[Settings] PATCH error:', err);
    return NextResponse.json({ error: '설정 저장 실패' }, { status: 500 });
  }
}
