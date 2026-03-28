// JSON 구조화 로깅
// LOG_LEVEL 환경변수 지원 (debug, info, warn, error)
// process.stdout/stderr 분리

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
const CURRENT_LEVEL = (process.env.LOG_LEVEL ?? 'info') as keyof typeof LOG_LEVELS;

export const logger = {
  debug: (msg: string, ...args: unknown[]) => log('debug', msg, args),
  info:  (msg: string, ...args: unknown[]) => log('info',  msg, args),
  warn:  (msg: string, ...args: unknown[]) => log('warn',  msg, args),
  error: (msg: string, ...args: unknown[]) => log('error', msg, args),
};

function log(level: keyof typeof LOG_LEVELS, msg: string, args: unknown[]) {
  if (LOG_LEVELS[level] < LOG_LEVELS[CURRENT_LEVEL]) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...(args.length ? { data: args } : {}),
  });
  (level === 'error' || level === 'warn')
    ? process.stderr.write(line + '\n')
    : process.stdout.write(line + '\n');
}
