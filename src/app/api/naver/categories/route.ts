import { NextResponse } from 'next/server';
import { getNaverConfig, getNaverCategories } from '@/lib/naver-xmlrpc';

export async function GET() {
  try {
    const config = await getNaverConfig();
    if (!config) {
      return NextResponse.json({ error: '네이버 설정이 필요합니다.' }, { status: 400 });
    }
    const categories = await getNaverCategories(config);
    return NextResponse.json(categories);
  } catch (err) {
    const message = err instanceof Error ? err.message : '카테고리 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
