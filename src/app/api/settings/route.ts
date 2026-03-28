import { NextRequest } from 'next/server';
import { isKlingConfigured } from '@/lib/kling';
import { isNaverConfigured, saveNaverConfig, getNaverConfig } from '@/lib/naver-xmlrpc';
import { withApiHandler, apiOk, ApiError } from '@/lib/api';

/** GET: 현재 설정 상태 확인 */
export const GET = withApiHandler(async () => {
  const naverConfig = await getNaverConfig().catch(() => null);

  return apiOk({
    kling: {
      configured: isKlingConfigured(),
      model: process.env.KLING_MODEL || 'kling-v2-1',
    },
    naver: {
      configured: await isNaverConfigured().catch(() => false),
      blogId: naverConfig?.blogId || null,
    },
  });
}, { tag: 'Settings' });

/** PATCH: 설정 저장 */
export const PATCH = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { naverBlogId, naverApiPassword } = body;

  if (naverBlogId && naverApiPassword) {
    await saveNaverConfig({ blogId: naverBlogId, password: naverApiPassword });
    return apiOk({ success: true });
  }

  throw new ApiError('저장할 설정이 없습니다.', 400);
}, { tag: 'Settings' });
