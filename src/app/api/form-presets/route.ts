import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withApiHandler, apiOk, apiCreated, ApiError } from '@/lib/api';

interface PresetRow {
  id: string;
  name: string;
  type: string;
  style: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function toPreset(r: PresetRow) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    style: r.style,
    data: r.data,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** GET: 프리셋 목록 조회 (optional ?style=xxx&type=xxx 필터) */
export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const style = searchParams.get('style');
  const type = searchParams.get('type');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (style) {
    params.push(style);
    conditions.push(`style = $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await query<PresetRow>(
    `SELECT id, name, type, style, data, created_at, updated_at
     FROM form_presets ${where}
     ORDER BY updated_at DESC`,
    params,
  );

  return apiOk(rows.map(toPreset));
}, { tag: 'FormPresets' });

/** POST: 새 프리셋 생성 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { name, type, style, data } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ApiError('프리셋 이름을 입력해주세요.', 400);
  }
  if (!type || !['template', 'full'].includes(type)) {
    throw new ApiError('type은 template 또는 full이어야 합니다.', 400);
  }
  if (!style || typeof style !== 'string' || style.trim().length === 0) {
    throw new ApiError('스타일을 입력해주세요.', 400);
  }
  if (!data || typeof data !== 'object') {
    throw new ApiError('data 필드가 필요합니다.', 400);
  }

  const row = await queryOne<PresetRow>(
    `INSERT INTO form_presets (name, type, style, data)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, type, style, data, created_at, updated_at`,
    [name.trim(), type, style.trim(), JSON.stringify(data)],
  );

  return apiCreated(toPreset(row!));
}, { tag: 'FormPresets' });

/** DELETE: 프리셋 삭제 */
export const DELETE = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { id } = body;

  if (!id) {
    throw new ApiError('id가 필요합니다.', 400);
  }

  await query('DELETE FROM form_presets WHERE id = $1', [id]);
  return apiOk({ success: true });
}, { tag: 'FormPresets' });

