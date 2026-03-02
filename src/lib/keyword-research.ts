import { runClaude } from './claude';

/** Claude 기반 연관 키워드 추천 */
export async function suggestRelatedKeywords(
  topic: string,
  primaryKeywords: string[],
): Promise<{
  primary: string[];
  secondary: string[];
  longTail: string[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}> {
  const prompt = `당신은 네이버 블로그 키워드 리서치 전문가입니다.

## 주제
${topic}

## 기존 키워드
${primaryKeywords.length > 0 ? primaryKeywords.join(', ') : '없음'}

## 요청
위 주제에 대해 네이버 블로그 SEO에 효과적인 키워드를 리서치해주세요.

## 응답 형식 (JSON만 출력)
{
  "primary": ["주키워드 3개 (검색량 높은 핵심 키워드)"],
  "secondary": ["보조키워드 5개 (관련 키워드)"],
  "longTail": ["롱테일 키워드 7개 (구체적인 검색 쿼리)"]
}

JSON만 출력하세요:`;

  const result = await runClaude(prompt, { timeout: 60000 });

  if (result.exitCode !== 0 || !result.output) {
    return {
      primary: primaryKeywords,
      secondary: [],
      longTail: [],
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    };
  }

  try {
    let jsonStr = result.output.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) jsonStr = objMatch[0];

    const parsed = JSON.parse(jsonStr);
    return {
      primary: Array.isArray(parsed.primary) ? parsed.primary : primaryKeywords,
      secondary: Array.isArray(parsed.secondary) ? parsed.secondary : [],
      longTail: Array.isArray(parsed.longTail) ? parsed.longTail : [],
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      costUsd: result.usage.costUsd,
    };
  } catch {
    return {
      primary: primaryKeywords,
      secondary: [],
      longTail: [],
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      costUsd: result.usage.costUsd,
    };
  }
}

/** 롱테일 키워드 조합 생성 */
export function generateLongTailCombinations(mainKeyword: string, modifiers: string[]): string[] {
  const prefixes = ['최고의', '추천', '비교', '후기', '가격', '사용법', '장단점'];
  const suffixes = ['추천', '리뷰', '정리', '비교', '총정리', '꿀팁'];

  const combinations: string[] = [];

  // 수식어 조합
  for (const mod of modifiers) {
    combinations.push(`${mainKeyword} ${mod}`);
    combinations.push(`${mod} ${mainKeyword}`);
  }

  // 프리픽스 조합
  for (const prefix of prefixes) {
    combinations.push(`${prefix} ${mainKeyword}`);
  }

  // 서픽스 조합
  for (const suffix of suffixes) {
    combinations.push(`${mainKeyword} ${suffix}`);
  }

  // 중복 제거
  return [...new Set(combinations)].slice(0, 15);
}

/** 키워드 전략 수립 */
export function buildKeywordStrategy(
  topic: string,
  keywords: { primary: string[]; secondary: string[]; longTail: string[] },
): string {
  return `## 키워드 전략: ${topic}

### 주키워드 (제목 + 본문 3-5회)
${keywords.primary.map(k => `- ${k}`).join('\n')}

### 보조키워드 (본문 2-3회)
${keywords.secondary.map(k => `- ${k}`).join('\n')}

### 롱테일 키워드 (소제목/문단에 1-2회)
${keywords.longTail.map(k => `- ${k}`).join('\n')}

### 배치 전략
1. 제목: 주키워드 선두 배치
2. 도입부: 주키워드 + 보조키워드 1개
3. H2 소제목: 보조키워드/롱테일 키워드 활용
4. 본문: 자연스러운 밀도 유지 (키워드 스터핑 금지)
5. 마무리: 주키워드 1회 반복`;
}
