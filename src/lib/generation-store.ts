import type { GenerationStatus, GenerationProgress } from './types';

interface StoreEntry {
  status: GenerationStatus;
  progress: string;
  error?: string;
  createdAt: number;
}

const store = new Map<string, StoreEntry>();

// 5분 후 자동 정리
const TTL = 5 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (now - entry.createdAt > TTL && entry.status !== 'running') {
      store.delete(id);
    }
  }
}

// 1분마다 정리
setInterval(cleanup, 60 * 1000);

export function setProgress(id: string, status: GenerationStatus, progress: string, error?: string) {
  store.set(id, { status, progress, error, createdAt: Date.now() });
}

export function getProgress(id: string): GenerationProgress | null {
  const entry = store.get(id);
  if (!entry) return null;
  return { status: entry.status, progress: entry.progress, error: entry.error };
}

export function removeEntry(id: string) {
  store.delete(id);
}

/** 현재 실행 중인 생성 수 */
export function getRunningCount(): number {
  let count = 0;
  for (const entry of store.values()) {
    if (entry.status === 'running') count++;
  }
  return count;
}
