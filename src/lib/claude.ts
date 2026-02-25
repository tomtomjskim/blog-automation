import { spawn, ChildProcess } from 'child_process';

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

/** 블로그 생성용 래퍼 — system prompt를 XML 태그로 삽입 */
export async function runClaudeForBlog(
  systemPrompt: string,
  userPrompt: string,
  options?: ClaudeOptions,
): Promise<ClaudeResult> {
  const fullPrompt = `<system>\n${systemPrompt}\n</system>\n\n${userPrompt}`;
  return runClaude(fullPrompt, options);
}
