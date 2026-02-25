import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { analyzeStyle } from '@/lib/style-analyzer';

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
export async function GET() {
  const rows = await query<ProfileRow>(
    'SELECT id, name, description, profile, sample_count, created_at, updated_at FROM style_profiles ORDER BY updated_at DESC',
  );
  return NextResponse.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    profile: r.profile,
    sampleCount: r.sample_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  })));
}

/** POST: 새 프로필 생성 (샘플 글로부터 스타일 분석) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description = '', samples } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '프로필 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return NextResponse.json({ error: '분석할 글 샘플을 1개 이상 입력해주세요.' }, { status: 400 });
    }

    if (samples.length > 5) {
      return NextResponse.json({ error: '샘플은 최대 5개까지 입력할 수 있습니다.' }, { status: 400 });
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

    return NextResponse.json({
      id: row!.id,
      name: row!.name,
      description: row!.description,
      profile: row!.profile,
      sampleCount: row!.sample_count,
      createdAt: row!.created_at,
    }, { status: 201 });
  } catch (err) {
    console.error('[StyleProfile] Error:', err);
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE: 프로필 삭제 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id 파라미터가 필요합니다.' }, { status: 400 });
  }

  await query('DELETE FROM style_profiles WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
