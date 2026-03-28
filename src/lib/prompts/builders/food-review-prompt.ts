import type { LengthId, ToneId, TemplateData } from '@/lib/types';
import {
  appendToneBlock,
  appendAdditionalInfoBlock,
  appendTemplateHintsBlock,
  appendImageContextBlock,
  getLengthConfig,
  buildFooter,
} from './shared-blocks';

/** 음식 리뷰 전용 프롬프트 빌더 (네이버 최적화) */
export function buildFoodReviewPrompt(params: {
  topic: string;
  keywords: string[];
  length: LengthId;
  tone?: ToneId;
  additionalInfo?: string;
  imageContext?: string;
  templateData?: TemplateData;
}): string {
  const lengthConfig = getLengthConfig(params.length);
  const charTarget = lengthConfig?.chars || 1000;

  let prompt = `다음 조건으로 음식점 리뷰 블로그 글을 작성해주세요.

## 음식점/메뉴 정보
${params.topic}

## 키워드
${params.keywords.length > 0 ? params.keywords.join(', ') : '(음식점명, 메뉴명, 위치 등에서 자동 추출)'}

## 글 길이
약 ${charTarget}자 내외 (${lengthConfig?.label || '보통'})
`;

  prompt = appendToneBlock(prompt, params.tone);
  prompt = appendAdditionalInfoBlock(prompt, params.additionalInfo, '추가 정보 (맛, 분위기, 가격 등)');
  prompt = appendTemplateHintsBlock(prompt, params.templateData, 'food_review');
  prompt = appendImageContextBlock(prompt, params.imageContext);

  prompt += `
## 네이버 맛집리뷰 최적 구조 (필수)

### 글 구조
1. **도입부** (200-300자): 가게 발견 경위 + 방문 동기
2. **가게 소개** (H2): 위치, 외관, 분위기
3. **메뉴 리뷰** (H2, 가장 긴 섹션): 5감 묘사, 각 메뉴별 평가
4. **실용 정보** (H2): 가격, 주차, 영업시간, 예약, 추천 상황
5. **총평** (H2): 별점 + 한줄 요약 + 재방문 의사

### 음식 리뷰 필수 포함사항
1. **총평 및 별점** (5점 만점) - 맛/서비스/분위기/가성비 세부 평가
2. **맛 표현** (5감 활용) - 식감, 향, 온도, 비주얼 등 구체적 묘사
3. **실용 정보** - 1인 예상 비용, 위치, 주차, 영업시간, 예약 여부, 추천 상황
4. **사진 배치** - [사진: 설명] 형태로 표시

### 작성 규칙
1. 제목을 # 마크다운으로 먼저 작성 (15-25자, 키워드 선두 배치)
2. 소제목은 ## 마크다운으로 구조화
3. 경험 기반 서술 필수 ("직접 가봤는데...", "먹어보니...")
4. 마크다운 형식 유지

### 주의사항
- 과장된 표현 자제 ("최고의", "역대급", "미쳤다" 등 금지)
- 확인되지 않은 정보는 "확인 필요"로 표시
- 장점과 단점 균형있게 서술
`;

  prompt += buildFooter();
  return prompt;
}
