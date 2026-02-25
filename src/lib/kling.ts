/**
 * Kling AI Image Generation API Wrapper
 * 계정 설정 후 바로 사용 가능 (KLING_ACCESS_KEY, KLING_SECRET_KEY 환경변수)
 */

import crypto from 'crypto';

const API_BASE = 'https://api.klingai.com/v1';

// JWT 캐시
let cachedToken: string | null = null;
let tokenExpiry = 0;

/** Kling API 사용 가능 여부 */
export function isKlingConfigured(): boolean {
  return !!(process.env.KLING_ACCESS_KEY && process.env.KLING_SECRET_KEY);
}

/** JWT 토큰 생성 (HS256, 30분 만료, 5분 버퍼로 재사용) */
function generateJWT(): string {
  const now = Math.floor(Date.now() / 1000);

  // 캐시된 토큰이 아직 유효하면 재사용 (5분 버퍼)
  if (cachedToken && tokenExpiry > now + 300) {
    return cachedToken;
  }

  const ak = process.env.KLING_ACCESS_KEY!;
  const sk = process.env.KLING_SECRET_KEY!;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { iss: ak, exp: now + 1800, nbf: now - 5, iat: now };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signature = crypto
    .createHmac('sha256', sk)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  cachedToken = `${headerB64}.${payloadB64}.${signature}`;
  tokenExpiry = now + 1800;

  return cachedToken;
}

export interface KlingImageRequest {
  prompt: string;
  model?: string;          // default: 'kling-v2-1'
  negativePrompt?: string;
  aspectRatio?: string;    // default: '16:9' (블로그 대표이미지)
  count?: number;          // default: 1
}

export interface KlingImageResult {
  taskId: string;
  imageUrls: string[];
}

/** 이미지 생성 요청 → task_id 반환 */
async function createImageTask(params: KlingImageRequest): Promise<string> {
  const token = generateJWT();

  const body: Record<string, unknown> = {
    model_name: params.model || 'kling-v2-1',
    prompt: params.prompt,
    n: params.count || 1,
    aspect_ratio: params.aspectRatio || '16:9',
  };

  if (params.negativePrompt) {
    body.negative_prompt = params.negativePrompt;
  }

  const res = await fetch(`${API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kling API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`Kling API error code ${json.code}: ${json.message || 'unknown'}`);
  }

  return json.data.task_id;
}

/** task_id로 폴링하여 결과 대기 (최대 60초) */
async function pollImageResult(taskId: string, maxWaitMs = 60000): Promise<string[]> {
  const token = generateJWT();
  const start = Date.now();
  const interval = 3000; // 3초 간격

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${API_BASE}/images/generations/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Kling poll error ${res.status}`);
    }

    const json = await res.json();
    const status = json.data?.task_status;

    if (status === 'succeed') {
      const images = json.data.task_result?.images || [];
      return images.map((img: { url: string }) => img.url);
    }

    if (status === 'failed') {
      throw new Error(`Kling image generation failed: ${json.data.task_status_msg || 'unknown'}`);
    }

    // 대기 후 재시도
    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error('Kling image generation timeout (60s)');
}

/** 이미지 생성 (요청 + 폴링 통합) */
export async function generateImage(params: KlingImageRequest): Promise<KlingImageResult> {
  if (!isKlingConfigured()) {
    throw new Error('Kling API가 설정되지 않았습니다. KLING_ACCESS_KEY, KLING_SECRET_KEY를 확인해주세요.');
  }

  console.log(`[Kling] Generating image: model=${params.model || 'kling-v2-1'}, prompt=${params.prompt.slice(0, 80)}...`);

  const taskId = await createImageTask(params);
  console.log(`[Kling] Task created: ${taskId}`);

  const imageUrls = await pollImageResult(taskId);
  console.log(`[Kling] Done: ${imageUrls.length} image(s) generated`);

  return { taskId, imageUrls };
}

/** 블로그 글에서 이미지 프롬프트 생성용 (Claude 호출 후 사용) */
export function buildImagePromptInstruction(count: number = 2): string {
  return `

## 이미지 프롬프트 요청
위 블로그 글의 핵심 주제를 시각적으로 표현하는 영문 이미지 프롬프트를 ${count}개 생성해주세요.

각 프롬프트는 다음 형식으로 출력:
[IMAGE_PROMPT_1] 프롬프트 내용
[IMAGE_PROMPT_2] 프롬프트 내용

요구사항:
- 영문으로 작성
- 블로그 대표 이미지에 적합한 구도
- 상세한 묘사 (색상, 구도, 분위기, 조명)
- 각 80단어 이내
- 텍스트/글자 포함 금지`;
}

/** Claude 응답에서 이미지 프롬프트 파싱 */
export function parseImagePrompts(content: string): string[] {
  const matches = content.matchAll(/\[IMAGE_PROMPT_\d+\]\s*(.+)/g);
  return [...matches].map(m => m[1].trim());
}
