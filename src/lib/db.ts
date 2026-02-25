import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 모든 쿼리에 search_path 자동 적용
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO blog_auto, public');
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO blog_auto, public');
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export { pool };
