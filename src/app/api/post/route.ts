import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getNaverConfig, publishToNaver } from '@/lib/naver-xmlrpc';
import { convertToNaverHtml } from '@/lib/markdown-to-naver';
import { parseResult } from '@/lib/seo-analyzer';
import { withApiHandler, apiOk, ApiError } from '@/lib/api';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { generationId, publishAs = 'draft', categoryId } = await req.json();

  if (!generationId) {
    throw new ApiError('generationId가 필요합니다.', 400);
  }

  // 네이버 설정 확인
  const config = await getNaverConfig();
  if (!config) {
    throw new ApiError('네이버 블로그 설정이 필요합니다. 설정 페이지에서 구성하세요.', 400);
  }

  // 생성된 글 조회
  const gen = await queryOne<{ content: string; title: string; publish_status: string }>(
    'SELECT content, title, publish_status FROM generations WHERE id = $1 AND deleted_at IS NULL',
    [generationId],
  );

  if (!gen) {
    throw new ApiError('글을 찾을 수 없습니다.', 404);
  }

  if (gen.publish_status === 'published') {
    throw new ApiError('이미 발행된 글입니다.', 400);
  }

  // 마크다운 → HTML 변환
  const parsed = parseResult(gen.content);
  const htmlContent = convertToNaverHtml(gen.content);

  // 네이버 발행
  const result = await publishToNaver(
    config,
    { title: parsed.title, content: htmlContent, categoryId },
    publishAs,
  );

  // DB 업데이트
  await query(
    `UPDATE generations SET
      naver_post_id = $2, naver_post_url = $3,
      published_at = NOW(), publish_status = $4
    WHERE id = $1`,
    [generationId, result.postId, result.postUrl, publishAs],
  );

  return apiOk({
    success: true,
    postId: result.postId,
    postUrl: result.postUrl,
    publishAs,
  });
}, { tag: 'Post' });
