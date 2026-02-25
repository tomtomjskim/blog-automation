'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GenerationRecord, GenerationStatus } from '@/lib/types';

interface PollState {
  status: GenerationStatus | 'idle';
  progress: string;
  data: GenerationRecord | null;
  error: string | null;
}

export function useGenerate(id: string | null) {
  const [state, setState] = useState<PollState>({
    status: 'idle',
    progress: '',
    data: null,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    setState({ status: 'running', progress: '생성을 시작합니다...', data: null, error: null });

    const poll = async () => {
      try {
        const res = await fetch(`/api/generate/${id}`);
        const json = await res.json();

        if (json.status === 'running') {
          setState(prev => ({
            ...prev,
            status: 'running',
            progress: json.progress || '생성 중...',
          }));
        } else if (json.status === 'completed') {
          setState({ status: 'completed', progress: '완료!', data: json, error: null });
          stopPolling();
        } else if (json.status === 'failed') {
          setState({ status: 'failed', progress: '', data: null, error: json.error || '생성에 실패했습니다.' });
          stopPolling();
        }
      } catch {
        setState(prev => ({ ...prev, error: '서버 연결 오류' }));
        stopPolling();
      }
    };

    // 즉시 1회 + 2초 간격 폴링
    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => stopPolling();
  }, [id, stopPolling]);

  return state;
}
