import type { StyleId, LengthId, ToneId, TemplateData } from '@/lib/types';
import {
  appendToneBlock,
  appendAdditionalInfoBlock,
  appendTemplateHintsBlock,
  appendImageContextBlock,
  getLengthConfig,
  buildFooter,
} from './shared-blocks';

/** 일반 블로그 글 프롬프트 빌더 (네이버 최적화 강화) */
export function buildUserPrompt(params: {
  topic: string;
  keywords: string[];
  length: LengthId;
  tone?: ToneId;
  additionalInfo?: string;
  imageContext?: string;
  style?: StyleId;
  templateData?: TemplateData;
}): string {
  const lengthConfig = getLengthConfig(params.length);
  const charTarget = lengthConfig?.chars || 1000;

  let prompt = `다음 조건으로 네이버 블로그 글을 작성해주세요.

## 주제
${params.topic}

## 키워드
${params.keywords.length > 0 ? params.keywords.join(', ') : '(키워드 없음 - 주제에서 자동 추출)'}

## 글 길이
약 ${charTarget}자 내외 (${lengthConfig?.label || '보통'})
`;

  prompt = appendToneBlock(prompt, params.tone);
  prompt = appendAdditionalInfoBlock(prompt, params.additionalInfo);
  prompt = appendTemplateHintsBlock(prompt, params.templateData, params.style);
  prompt = appendImageContextBlock(prompt, params.imageContext);

  prompt += `
## 네이버 블로그 최적 구조 (필수)

### 글 구조
1. **도입부** (200-300자): 공감 유도 + 주키워드 자연 삽입. "~해보신 적 있으시죠?" 등 독자 참여형 시작.
2. **본문 H2 섹션 3-5개** (각 300-500자):
   - 각 섹션 제목에 키워드 또는 관련어 포함
   - 경험 기반 서술 위주 ("실제로 해봤는데...", "써보니까..." 등)
   - 리스트, 비교표, 팁 박스 등 가독성 요소 활용
3. **마무리** (100-200자): 핵심 요약 + 독자 행동 유도

### 경험담 삽입 (필수)
- 최소 1개 섹션에 "실제로 해봤는데..." 또는 "직접 써보니..." 류의 1인칭 경험담 포함
- 구체적 수치나 기간 포함 시 가산점 (예: "3개월간 써본 결과")

### 작성 규칙
1. 제목을 # 마크다운으로 먼저 작성 (15-25자, 키워드 선두 배치)
2. 소제목은 ## 마크다운으로 구조화 (3-5개 섹션)
3. 키워드를 자연스럽게 3-5회 포함 (스터핑 금지)
4. 문단은 100-200자 단위로 끊어 가독성 확보
5. 네이버 블로그에 바로 복사해서 사용할 수 있는 마크다운 형식
`;

  prompt += buildFooter();
  return prompt;
}
