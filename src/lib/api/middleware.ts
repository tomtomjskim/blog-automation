import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { ApiError } from './errors';
import { apiError } from './response';
import { logger } from '../logger';

type RouteHandler = (req: NextRequest, ctx?: any) => Promise<NextResponse>;

export function withApiHandler(
  handler: RouteHandler,
  options?: { tag?: string }
): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      const tag = options?.tag ?? 'API';
      if (err instanceof ApiError) {
        logger.warn(`[${tag}] ${err.message}`, { status: err.status, code: err.code });
        return apiError(err.message, err.status);
      }
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      logger.error(`[${tag}] Unhandled error: ${message}`, err);
      return apiError('서버 오류가 발생했습니다.', 500);
    }
  };
}

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, body: T, ctx?: any) => Promise<NextResponse>,
  options?: { tag?: string }
): RouteHandler {
  return withApiHandler(async (req, ctx) => {
    const raw = await req.json();
    const result = schema.safeParse(raw);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return apiError(firstIssue.message, 400);
    }
    return handler(req, result.data, ctx);
  }, options);
}
