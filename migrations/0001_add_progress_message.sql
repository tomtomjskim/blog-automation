-- Migration: 0001_add_progress_message
-- Date: 2026-03-28
-- Description: generations 테이블에 progress_message 컬럼 추가 및 running 상태 인덱스 생성
--
-- Rollback:
--   DROP INDEX IF EXISTS blog_auto.idx_generations_status;
--   ALTER TABLE blog_auto.generations DROP COLUMN IF EXISTS progress_message;

-- progress_message 컬럼 추가 (생성 진행 상태 메시지)
ALTER TABLE blog_auto.generations
  ADD COLUMN IF NOT EXISTS progress_message TEXT;

-- running 상태 인덱스 (getRunningCount 최적화)
CREATE INDEX IF NOT EXISTS idx_generations_status
  ON blog_auto.generations(status)
  WHERE status = 'running';
