import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

interface StyleRow {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  system_prompt: string;
  fields: Record<string, unknown>[];
  created_at: string;
}

function toStyle(r: StyleRow) {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    description: r.description,
    systemPrompt: r.system_prompt,
    fields: r.fields,
    createdAt: r.created_at,
  };
}

/** GET: 커스텀 스타일 전체 조회 */
export async function GET() {
  const rows = await query<StyleRow>(
    'SELECT id, name, icon, description, system_prompt, fields, created_at FROM custom_styles ORDER BY created_at DESC',
  );
  return NextResponse.json(rows.map(toStyle));
}

/** POST: 새 커스텀 스타일 생성 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon = '📝', description, system_prompt, fields } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '스타일 이름을 입력해주세요.' }, { status: 400 });
    }
    if (!system_prompt || typeof system_prompt !== 'string' || system_prompt.trim().length === 0) {
      return NextResponse.json({ error: 'system_prompt를 입력해주세요.' }, { status: 400 });
    }
    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'fields 배열이 필요합니다.' }, { status: 400 });
    }

    const row = await queryOne<StyleRow>(
      `INSERT INTO custom_styles (name, icon, description, system_prompt, fields)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, icon, description, system_prompt, fields, created_at`,
      [name.trim(), icon, description ?? null, system_prompt.trim(), JSON.stringify(fields)],
    );

    return NextResponse.json(toStyle(row!), { status: 201 });
  } catch (err) {
    console.error('[CustomStyles] POST Error:', err);
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PUT: 커스텀 스타일 수정 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, icon, description, system_prompt, fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: '유효한 이름을 입력해주세요.' }, { status: 400 });
      }
      params.push(name.trim());
      setClauses.push(`name = $${params.length}`);
    }
    if (icon !== undefined) {
      params.push(icon);
      setClauses.push(`icon = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      setClauses.push(`description = $${params.length}`);
    }
    if (system_prompt !== undefined) {
      if (typeof system_prompt !== 'string' || system_prompt.trim().length === 0) {
        return NextResponse.json({ error: '유효한 system_prompt를 입력해주세요.' }, { status: 400 });
      }
      params.push(system_prompt.trim());
      setClauses.push(`system_prompt = $${params.length}`);
    }
    if (fields !== undefined) {
      if (!Array.isArray(fields)) {
        return NextResponse.json({ error: 'fields는 배열이어야 합니다.' }, { status: 400 });
      }
      params.push(JSON.stringify(fields));
      setClauses.push(`fields = $${params.length}`);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: '수정할 필드가 없습니다.' }, { status: 400 });
    }

    params.push(id);
    const row = await queryOne<StyleRow>(
      `UPDATE custom_styles
       SET ${setClauses.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, name, icon, description, system_prompt, fields, created_at`,
      params,
    );

    if (!row) {
      return NextResponse.json({ error: '스타일을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(toStyle(row));
  } catch (err) {
    console.error('[CustomStyles] PUT Error:', err);
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE: 커스텀 스타일 삭제 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    await query('DELETE FROM custom_styles WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[CustomStyles] DELETE Error:', err);
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
