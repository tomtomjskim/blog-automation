export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number = 400,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const Errors = {
  notFound: (msg = '리소스를 찾을 수 없습니다.') => new ApiError(msg, 404, 'NOT_FOUND'),
  badRequest: (msg: string) => new ApiError(msg, 400, 'BAD_REQUEST'),
  tooManyRequests: (msg: string) => new ApiError(msg, 429, 'TOO_MANY_REQUESTS'),
  serverError: (msg = '서버 오류가 발생했습니다.') => new ApiError(msg, 500, 'SERVER_ERROR'),
};
