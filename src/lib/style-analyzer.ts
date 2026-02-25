/**
 * 기존 블로그 글에서 스타일 프로필을 추출하는 분석기
 * Claude CLI를 사용하여 문체, 어투, 구조를 분석합니다.
 */

import { runClaude } from './claude';

const ANALYZE_PROMPT = `다음 블로그 글 샘플들을 분석하여 글쓴이의 고유한 문체 프로필을 작성해주세요.

## 분석할 글

{SAMPLES}

## 분석 항목

다음 항목들을 분석하여 **그대로 프롬프트로 사용할 수 있는 형태**로 작성해주세요:

1. **어투**: 반말/존댓말/혼합, 격식 수준
2. **문장 스타일**: 문장 길이 경향, 접속사 사용 패턴
3. **이모지/특수문자**: 사용 빈도와 패턴
4. **문단 구성**: 문단 길이, 줄바꿈 패턴
5. **도입부 패턴**: 글을 시작하는 전형적인 방식
6. **마무리 패턴**: 글을 끝내는 전형적인 방식
7. **특징적 표현**: 자주 쓰는 말투, 감탄사, 강조 방식
8. **구조 패턴**: 소제목 사용, 리스트 활용, 정보 배치 순서
9. **톤 & 무드**: 전체적인 분위기 (유머, 진지, 따뜻함 등)

## 출력 형식

아래와 같이 시스템 프롬프트에 바로 삽입할 수 있는 형태로 작성해주세요:

\`\`\`
이 글쓴이의 문체 특징:
- [특징 1]
- [특징 2]
...

글쓴이의 전형적인 표현:
- [표현 1]
- [표현 2]
...

글 구조 패턴:
- [패턴 1]
- [패턴 2]
...
\`\`\`

마크다운 코드블록 없이, 프롬프트 텍스트만 출력해주세요.`;

export async function analyzeStyle(samples: string[]): Promise<string> {
  const samplesText = samples
    .map((s, i) => `### 샘플 ${i + 1}\n${s}`)
    .join('\n\n---\n\n');

  const prompt = ANALYZE_PROMPT.replace('{SAMPLES}', samplesText);

  const result = await runClaude(prompt, { timeout: 120000 });

  if (result.exitCode !== 0 || !result.output) {
    throw new Error(result.stderr || '스타일 분석 실패');
  }

  // 코드블록이 포함된 경우 제거
  let profile = result.output.trim();
  profile = profile.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '');

  return profile;
}
