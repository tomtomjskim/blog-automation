import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { analyzeStyle } from '@/lib/style-analyzer';
import { withApiHandler, apiOk, apiCreated, ApiError } from '@/lib/api';

interface ProfileRow {
  id: string;
  name: string;
  description: string | null;
  profile: string;
  sample_count: number;
  created_at: string;
  updated_at: string;
}

/** GET: 프로필 목록 조회 */
export const GET = withApiHandler(async () => {
  const rows = await query<ProfileRow>(
    'SELECT id, name, description, profile, sample_count, created_at, updated_at FROM style_profiles ORDER BY updated_at DESC',
  );
  return apiOk(rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    profile: r.profile,
    sampleCount: r.sample_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  })));
}, { tag: 'StyleProfile' });

/** POST: 새 프로필 생성 (샘플 글로부터 스타일 분석) */
export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { name, description = '', samples } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ApiError('프로필 이름을 입력해주세요.', 400);
  }

  if (!samples || !Array.isArray(samples) || samples.length === 0) {
    throw new ApiError('분석할 글 샘플을 1개 이상 입력해주세요.', 400);
  }

  if (samples.length > 5) {
    throw new ApiError('샘플은 최대 5개까지 입력할 수 있습니다.', 400);
  }

  // Claude로 스타일 분석
  const profile = await analyzeStyle(samples);

  // DB에 저장
  const row = await queryOne<ProfileRow>(
    `INSERT INTO style_profiles (name, description, profile, sample_count)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, profile, sample_count, created_at, updated_at`,
    [name.trim(), description.trim(), profile, samples.length],
  );

  return apiCreated({
    id: row!.id,
    name: row!.name,
    description: row!.description,
    profile: row!.profile,
    sampleCount: row!.sample_count,
    createdAt: row!.created_at,
  });
}, { tag: 'StyleProfile' });

/** DELETE: 프로필 삭제 */
export const DELETE = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new ApiError('id 파라미터가 필요합니다.', 400);
  }

  await query('DELETE FROM style_profiles WHERE id = $1', [id]);
  return apiOk({ success: true });
}, { tag: 'StyleProfile' });

