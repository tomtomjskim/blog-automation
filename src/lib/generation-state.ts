import { query, queryOne } from './db';

export type GenerationStatus = 'running' | 'completed' | 'failed';

export interface GenerationProgress {
  status: GenerationStatus;
  progress: string;
  error?: string;
}

export async function setProgress(
  id: string,
  status: GenerationStatus,
  progress: string,
  error?: string
): Promise<void> {
  await query(
    `UPDATE blog_auto.generations
     SET status = $2, progress_message = $3, error = COALESCE($4, error)
     WHERE id = $1`,
    [id, status, progress, error ?? null]
  );
}

export async function getProgress(id: string): Promise<GenerationProgress | null> {
  const row = await queryOne<{
    status: GenerationStatus;
    progress_message: string | null;
    error: string | null;
  }>(
    'SELECT status, progress_message, error FROM blog_auto.generations WHERE id = $1',
    [id]
  );
  if (!row) return null;
  return {
    status: row.status as GenerationStatus,
    progress: row.progress_message ?? '',
    error: row.error ?? undefined,
  };
}

export async function getRunningCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM blog_auto.generations WHERE status = 'running'"
  );
  return parseInt(row?.count ?? '0');
}
