import { spawn, ChildProcess } from 'child_process';
import { readFile } from 'fs/promises';

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  costUsd: number;
}

export interface ClaudeResult {
  output: string;
  stderr: string;
  exitCode: number;
  durationSec: number;
  usage: ClaudeUsage;
}

export interface ClaudeOptions {
  maxTurns?: number;
  timeout?: number;
}

const ZERO_USAGE: ClaudeUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationTokens: 0,
  cacheReadTokens: 0,
  costUsd: 0,
};

export async function runClaude(prompt: string, options?: ClaudeOptions): Promise<ClaudeResult> {
  const start = Date.now();
  const maxTurns = options?.maxTurns ?? 1;
  const timeout = options?.timeout ?? 180000; // 블로그 생성: 3분
  console.log(`[Claude] Starting CLI, prompt length=${prompt.length}, maxTurns=${maxTurns}`);

  const args = ['-p', prompt, '--output-format', 'json', '--max-turns', String(maxTurns)];

  return new Promise((resolve, reject) => {
    const proc: ChildProcess = spawn('claude', args, {
      timeout,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    proc.stdout!.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr!.on('data', (d: Buffer) => { stderr += d.toString(); });

    proc.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      const duration = Math.round((Date.now() - start) / 1000);
      console.log(`[Claude] Finished: exitCode=${code}, signal=${signal}, stdout=${stdout.length}ch, stderr=${stderr.length}ch, duration=${duration}s`);
      if (stderr) console.log(`[Claude] stderr: ${stderr.slice(0, 500)}`);

      let output = stdout;
      let usage: ClaudeUsage = { ...ZERO_USAGE };

      try {
        const json = JSON.parse(stdout);
        if (json.result !== undefined && json.result !== null) {
          output = typeof json.result === 'string' ? json.result : JSON.stringify(json.result);
        } else if (json.type === 'result') {
          console.log(`[Claude] Result subtype: ${json.subtype || 'unknown'}, num_turns: ${json.num_turns || '?'}`);
          output = '';
        }
        if (json.usage) {
          usage.inputTokens = json.usage.input_tokens ?? 0;
          usage.outputTokens = json.usage.output_tokens ?? 0;
          usage.cacheCreationTokens = json.usage.cache_creation_input_tokens ?? 0;
          usage.cacheReadTokens = json.usage.cache_read_input_tokens ?? 0;
        }
        if (typeof json.total_cost_usd === 'number') {
          usage.costUsd = json.total_cost_usd;
        }
        console.log(`[Claude] Usage: in=${usage.inputTokens}, out=${usage.outputTokens}, cost=$${usage.costUsd.toFixed(6)}`);
      } catch {
        console.log('[Claude] JSON parse failed, using raw stdout as output');
      }

      resolve({ output, stderr, exitCode: code ?? 1, durationSec: duration, usage });
    });

    proc.on('error', (err) => {
      if (settled) return;
      settled = true;
      console.error(`[Claude] Process error:`, err.message);
      reject(err);
    });
  });
}

/** 이미지 비전 분석용 래퍼 — stream-json으로 base64 이미지 전송 */
export async function runClaudeWithImages(
  prompt: string,
  imagePaths: string[],
  options?: ClaudeOptions,
): Promise<ClaudeResult> {
  const start = Date.now();
  const timeout = options?.timeout ?? 180000;
  console.log(`[Claude] Starting vision CLI, images=${imagePaths.length}, prompt length=${prompt.length}`);

  const args = [
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--verbose',
    '--max-turns', String(options?.maxTurns ?? 1),
  ];

  // content blocks 구성: 이미지들 + 텍스트
  const contentBlocks: Array<Record<string, unknown>> = [];

  for (const imgPath of imagePaths) {
    const buf = await readFile(imgPath);
    const base64 = buf.toString('base64');
    const ext = imgPath.split('.').pop()?.toLowerCase();
    const mediaType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    });
  }

  contentBlocks.push({ type: 'text', text: prompt });

  const stdinMessage = JSON.stringify({
    type: 'user',
    message: {
      role: 'user',
      content: contentBlocks,
    },
  });

  return new Promise((resolve, reject) => {
    const proc: ChildProcess = spawn('claude', args, {
      timeout,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    proc.stdout!.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr!.on('data', (d: Buffer) => { stderr += d.toString(); });

    // stdin으로 메시지 전송 후 닫기
    proc.stdin!.write(stdinMessage + '\n');
    proc.stdin!.end();

    proc.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      const duration = Math.round((Date.now() - start) / 1000);
      console.log(`[Claude] Vision finished: exitCode=${code}, signal=${signal}, stdout=${stdout.length}ch, duration=${duration}s`);

      let output = '';
      let usage: ClaudeUsage = { ...ZERO_USAGE };

      // stream-json 출력: 줄 단위 JSON, type="result" 찾기
      try {
        const lines = stdout.split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.type === 'result') {
              output = json.result || '';
              if (json.usage) {
                usage.inputTokens = json.usage.input_tokens ?? 0;
                usage.outputTokens = json.usage.output_tokens ?? 0;
                usage.cacheCreationTokens = json.usage.cache_creation_input_tokens ?? 0;
                usage.cacheReadTokens = json.usage.cache_read_input_tokens ?? 0;
              }
              if (typeof json.total_cost_usd === 'number') {
                usage.costUsd = json.total_cost_usd;
              }
            }
          } catch {
            // 개별 라인 파싱 실패는 무시
          }
        }
      } catch {
        console.log('[Claude] Vision: stream-json parse failed, using raw stdout');
        output = stdout;
      }

      console.log(`[Claude] Vision usage: in=${usage.inputTokens}, out=${usage.outputTokens}, cost=$${usage.costUsd.toFixed(6)}`);
      resolve({ output, stderr, exitCode: code ?? 1, durationSec: duration, usage });
    });

    proc.on('error', (err) => {
      if (settled) return;
      settled = true;
      console.error(`[Claude] Vision process error:`, err.message);
      reject(err);
    });
  });
}

/** 블로그 생성용 래퍼 — system prompt를 XML 태그로 삽입 */
export async function runClaudeForBlog(
  systemPrompt: string,
  userPrompt: string,
  options?: ClaudeOptions,
): Promise<ClaudeResult> {
  const fullPrompt = `<system>\n${systemPrompt}\n</system>\n\n${userPrompt}`;
  return runClaude(fullPrompt, options);
}
