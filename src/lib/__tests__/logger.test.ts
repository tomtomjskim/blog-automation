import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.info 호출 시 에러 없이 실행', () => {
    expect(() => logger.info('테스트 메시지')).not.toThrow();
  });

  it('logger.debug 호출 시 에러 없이 실행', () => {
    expect(() => logger.debug('디버그 메시지')).not.toThrow();
  });

  it('logger.warn 호출 시 에러 없이 실행', () => {
    expect(() => logger.warn('경고 메시지')).not.toThrow();
  });

  it('logger.error 호출 시 에러 없이 실행', () => {
    expect(() => logger.error('에러 메시지')).not.toThrow();
  });

  it('logger.info는 stdout에 기록', () => {
    logger.info('info 테스트');
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('logger.error는 stderr에 기록', () => {
    logger.error('에러 발생');
    expect(stderrSpy).toHaveBeenCalled();
  });

  it('logger.warn은 stderr에 기록', () => {
    logger.warn('경고 발생');
    expect(stderrSpy).toHaveBeenCalled();
  });

  it('로그 출력이 JSON 형식', () => {
    logger.info('JSON 형식 테스트');
    const call = stdoutSpy.mock.calls[0][0] as string;
    expect(() => JSON.parse(call)).not.toThrow();
    const parsed = JSON.parse(call);
    expect(parsed).toHaveProperty('level', 'info');
    expect(parsed).toHaveProperty('msg', 'JSON 형식 테스트');
    expect(parsed).toHaveProperty('ts');
  });

  it('추가 인자는 data 필드에 포함', () => {
    logger.info('추가 인자 테스트', { key: 'value' });
    const call = stdoutSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(call);
    expect(parsed).toHaveProperty('data');
  });

  it('추가 인자 없으면 data 필드 없음', () => {
    logger.info('단순 메시지');
    const call = stdoutSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(call);
    expect(parsed).not.toHaveProperty('data');
  });
});
