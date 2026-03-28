import { describe, it, expect } from 'vitest';
import { ApiError, Errors } from '@/lib/api/errors';

describe('ApiError', () => {
  it('message, status, code를 올바르게 저장', () => {
    const err = new ApiError('오류 메시지', 422, 'UNPROCESSABLE');
    expect(err.message).toBe('오류 메시지');
    expect(err.status).toBe(422);
    expect(err.code).toBe('UNPROCESSABLE');
  });

  it('status 기본값은 400', () => {
    const err = new ApiError('기본 오류');
    expect(err.status).toBe(400);
  });

  it('code는 선택 사항, 미전달 시 undefined', () => {
    const err = new ApiError('오류', 400);
    expect(err.code).toBeUndefined();
  });

  it('Error를 상속하므로 instanceof Error가 참', () => {
    const err = new ApiError('오류');
    expect(err instanceof Error).toBe(true);
    expect(err instanceof ApiError).toBe(true);
  });

  it('name이 "ApiError"', () => {
    const err = new ApiError('오류');
    expect(err.name).toBe('ApiError');
  });

  it('stack trace가 존재', () => {
    const err = new ApiError('오류');
    expect(err.stack).toBeTruthy();
  });
});

describe('Errors.notFound', () => {
  it('기본 메시지로 404 ApiError 생성', () => {
    const err = Errors.notFound();
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBeTruthy();
  });

  it('커스텀 메시지 전달 가능', () => {
    const err = Errors.notFound('게시글을 찾을 수 없습니다.');
    expect(err.message).toBe('게시글을 찾을 수 없습니다.');
    expect(err.status).toBe(404);
  });

  it('ApiError 인스턴스 반환', () => {
    expect(Errors.notFound() instanceof ApiError).toBe(true);
  });
});

describe('Errors.badRequest', () => {
  it('400 ApiError 생성', () => {
    const err = Errors.badRequest('잘못된 요청 파라미터');
    expect(err.status).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('잘못된 요청 파라미터');
  });

  it('ApiError 인스턴스 반환', () => {
    expect(Errors.badRequest('오류') instanceof ApiError).toBe(true);
  });
});

describe('Errors.tooManyRequests', () => {
  it('429 ApiError 생성', () => {
    const err = Errors.tooManyRequests('요청 한도 초과');
    expect(err.status).toBe(429);
    expect(err.code).toBe('TOO_MANY_REQUESTS');
    expect(err.message).toBe('요청 한도 초과');
  });
});

describe('Errors.serverError', () => {
  it('기본 메시지로 500 ApiError 생성', () => {
    const err = Errors.serverError();
    expect(err.status).toBe(500);
    expect(err.code).toBe('SERVER_ERROR');
    expect(err.message).toBeTruthy();
  });

  it('커스텀 메시지 전달 가능', () => {
    const err = Errors.serverError('DB 연결 오류');
    expect(err.message).toBe('DB 연결 오류');
  });
});
