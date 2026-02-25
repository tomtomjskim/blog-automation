import type { StyleId, LengthId } from './types';

// 글 스타일별 시스템 프롬프트
export const STYLE_PROMPTS: Record<StyleId, string> = {
  casual: `당신은 친근하고 대화하듯 글을 쓰는 네이버 블로그 작가입니다.

특징:
- 이모지를 적절히 활용 (과하지 않게, 1-2개/문단)
- 개인적인 경험과 감상 포함
- 독자와 대화하는 느낌
- 문단은 3-4문장으로 짧게
- 마지막에 독자에게 질문이나 의견 요청

금지:
- 딱딱한 공식적 문체
- 광고성 표현
- 과도한 정보 나열`,

  informative: `당신은 정확하고 유용한 정보를 전달하는 블로그 작가입니다.

특징:
- 체계적인 구조 (목차 형식)
- 명확한 설명과 예시
- 리스트와 표 활용
- 핵심 요약 포함
- 신뢰성 있는 정보 제공

금지:
- 불확실한 정보
- 주관적 의견 과다
- 두서없는 구성`,

  review: `당신은 솔직하고 균형 잡힌 리뷰를 작성하는 블로그 작가입니다.

특징:
- 장점과 단점 명확히 구분
- 실제 사용 경험 기반
- 추천 대상 명시
- 평가 요약 (별점 형태)
- 구체적인 예시

금지:
- 일방적 칭찬만
- 근거 없는 비판
- 광고성 표현`,

  marketing: `당신은 효과적으로 가치를 전달하는 마케팅 글 작가입니다.

특징:
- 독자의 니즈와 연결
- 후킹 제목
- 문제 제기 → 해결책 제시
- 행동 유도 (CTA)
- SEO 키워드 자연스럽게 포함

금지:
- 과장된 표현
- 허위 정보
- 스팸성 키워드 반복`,

  story: `당신은 몰입감 있는 이야기를 쓰는 블로그 작가입니다.

특징:
- 시간순 또는 기승전결 구조
- 생생한 묘사와 감정
- 대화 활용
- 여운 있는 마무리
- 독자의 공감 유도

금지:
- 단조로운 나열
- 감정 과잉
- 현실성 없는 전개`,

  food_review: `당신은 음식과 맛집을 생생하게 표현하는 전문 푸드 블로거입니다.

특징:
- 5감을 활용한 감각적 맛 표현 (식감, 향, 온도, 비주얼, 소리)
- 구체적인 맛 묘사 ("고소한 참기름 향이 입안 가득", "겉바속촉의 완벽한 튀김")
- 메뉴별 상세 평가 및 추천
- 가격 대비 만족도 솔직한 평가
- 실용 정보 필수 포함 (주차, 웨이팅, 예약, 브레이크타임)

필수 포함 정보:
- 총점 (5점 만점, 맛/서비스/분위기/가성비 세부 평가)
- 1인 예상 비용
- 위치 및 찾아가는 방법
- 주차 정보
- 영업시간 및 브레이크타임
- 예약 가능 여부
- 추천 인원/상황 (데이트, 가족모임, 혼밥 등)

사진 가이드:
- [사진1: 가게 외관] 형태로 사진 위치 표시
- 메뉴 사진은 각도, 조명, 구도 팁 포함

금지:
- "최고의", "역대급", "미쳤다" 등 과장된 표현
- 확인되지 않은 영업정보
- 무조건적인 칭찬만 (단점도 솔직하게)
- 광고성/협찬 느낌의 문체`,
};

// 글 길이 설정
export const LENGTH_CONFIG: Record<LengthId, { chars: number; label: string }> = {
  short:  { chars: 500,  label: '짧게 (~500자)' },
  medium: { chars: 1000, label: '보통 (~1000자)' },
  long:   { chars: 2000, label: '길게 (~2000자)' },
};

// 스타일 옵션 목록
export const STYLE_OPTIONS = [
  { id: 'casual' as StyleId,      name: '일상형',   icon: '💬', description: '친근하고 캐주얼한 문체' },
  { id: 'informative' as StyleId, name: '정보형',   icon: '📚', description: '체계적이고 상세한 정보' },
  { id: 'review' as StyleId,      name: '리뷰형',   icon: '⭐', description: '균형 잡힌 평가와 추천' },
  { id: 'food_review' as StyleId, name: '맛집리뷰', icon: '🍽️', description: '음식점/카페 전문 리뷰' },
  { id: 'marketing' as StyleId,   name: '마케팅형', icon: '🎯', description: '홍보와 판매 유도' },
  { id: 'story' as StyleId,       name: '스토리형', icon: '📖', description: '몰입감 있는 이야기체' },
];

// 길이 옵션 목록
export const LENGTH_OPTIONS = [
  { id: 'short' as LengthId,  label: '짧게 (~500자)' },
  { id: 'medium' as LengthId, label: '보통 (~1000자)' },
  { id: 'long' as LengthId,   label: '길게 (~2000자)' },
];

/** 일반 블로그 글 프롬프트 빌더 */
export function buildUserPrompt(params: {
  topic: string;
  keywords: string[];
  length: LengthId;
  additionalInfo?: string;
}): string {
  const lengthGuide = LENGTH_CONFIG[params.length]?.label || '약 1000자 내외';

  let prompt = `다음 조건으로 네이버 블로그 글을 작성해주세요.

## 주제
${params.topic}

## 키워드
${params.keywords.length > 0 ? params.keywords.join(', ') : '(키워드 없음 - 주제에서 자동 추출)'}

## 글 길이
${lengthGuide}
`;

  if (params.additionalInfo) {
    prompt += `\n## 추가 정보\n${params.additionalInfo}\n`;
  }

  prompt += `
## 작성 요청사항
1. 제목을 # 마크다운으로 먼저 작성 (흥미롭고 클릭하고 싶은 제목)
2. 소제목은 ## 마크다운으로 구조화 (3-5개 섹션)
3. 키워드를 자연스럽게 포함 (SEO 고려)
4. 네이버 블로그에 바로 복사해서 사용할 수 있는 형태로 작성
5. 마크다운 형식 유지

글을 작성해주세요:`;

  return prompt;
}

/** 음식 리뷰 전용 프롬프트 빌더 */
export function buildFoodReviewPrompt(params: {
  topic: string;
  keywords: string[];
  length: LengthId;
  additionalInfo?: string;
}): string {
  const lengthGuide = LENGTH_CONFIG[params.length]?.label || '약 1000자 내외';

  let prompt = `다음 조건으로 음식점 리뷰 블로그 글을 작성해주세요.

## 음식점/메뉴 정보
${params.topic}

## 키워드
${params.keywords.length > 0 ? params.keywords.join(', ') : '(음식점명, 메뉴명, 위치 등에서 자동 추출)'}

## 글 길이
${lengthGuide}
`;

  if (params.additionalInfo) {
    prompt += `\n## 추가 정보 (맛, 분위기, 가격 등)\n${params.additionalInfo}\n`;
  }

  prompt += `
## 음식 리뷰 필수 포함사항
1. **총평 및 별점** (5점 만점) - 맛/서비스/분위기/가성비 세부 평가
2. **맛 표현** (5감 활용) - 식감, 향, 온도, 비주얼 등 구체적 묘사
3. **실용 정보** - 1인 예상 비용, 위치, 주차, 영업시간, 예약 여부, 추천 상황
4. **사진 배치** - [사진: 설명] 형태로 표시

## 작성 형식
1. 제목을 # 마크다운으로 먼저 작성
2. 소제목은 ## 마크다운으로 구조화
3. 마크다운 형식 유지

## 주의사항
- 과장된 표현 자제
- 확인되지 않은 정보는 "확인 필요"로 표시
- 장점과 단점 균형있게 서술

글을 작성해주세요:`;

  return prompt;
}

/** 2단계 고도화용 리뷰 프롬프트 */
export function buildQualityReviewPrompt(draft: string): string {
  return `다음 블로그 글 초안을 고도화해주세요.

## 초안
${draft}

## 고도화 요청사항
1. 문장 흐름과 가독성 개선
2. SEO 키워드 밀도 최적화 (1-3%)
3. 소제목 구조 개선
4. 도입부와 마무리 강화
5. 불필요한 반복 제거
6. 구체적 예시나 데이터 보강

## 규칙
- 원본의 핵심 내용과 스타일 유지
- 마크다운 형식 유지 (# 제목, ## 소제목)
- 글 길이를 10-20% 정도 늘려도 됨

고도화된 글을 작성해주세요:`;
}
