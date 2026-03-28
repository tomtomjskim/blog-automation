import type { StyleId, LengthId, ToneId, TemplateData } from './types';
import { buildPromptHints } from './style-templates';

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

// 글 길이 설정 (확장)
export const LENGTH_CONFIG: Record<LengthId, { chars: number; label: string }> = {
  short:    { chars: 500,  label: '짧게 (~500자)' },
  medium:   { chars: 1000, label: '보통 (~1000자)' },
  long:     { chars: 2000, label: '길게 (~2000자)' },
  standard: { chars: 2000, label: '표준 (~2000자)' },
  deep:     { chars: 3000, label: '심층 (~3000자)' },
  premium:  { chars: 5000, label: '프리미엄 (~5000자)' },
};

// 톤 설정
export const TONE_INSTRUCTIONS: Record<ToneId, string> = {
  haeyoche: `문체 규칙 (해요체):
- 모든 문장을 "~해요", "~이에요", "~인데요", "~거든요" 등 해요체로 작성
- 존댓말이지만 부드럽고 친근한 느낌
- 예: "정말 좋았어요", "추천드려요", "한번 해보세요"`,

  banmal: `문체 규칙 (반말/~다 체):
- 모든 문장을 "~했다", "~이다", "~인데", "~거든" 등 반말체로 작성
- 일기/에세이 같은 솔직한 느낌
- 예: "정말 좋았다", "강력 추천한다", "한번 해보길"`,
};

// AI 특유 표현 금지 목록
const AI_FORBIDDEN_PHRASES = `
절대 사용하지 말 것 (AI 탐지 회피):
- "이로써", "결론적으로", "매우 중요합니다", "다양한 측면에서"
- "종합적으로", "기본적으로", "핵심적으로", "궁극적으로"
- "~할 수 있습니다", "~하는 것이 좋습니다" (과도 반복 시)
- "무엇보다", "특히나", "그야말로", "과언이 아닙니다"
- "알아보겠습니다", "살펴보겠습니다" (서론에서)
- 동일 접속사 3회 이상 연속 사용
- 문단 시작 패턴 반복 ("먼저...", "다음으로...", "마지막으로..." 연속)`;

// 스타일 옵션 목록
export const STYLE_OPTIONS = [
  { id: 'casual' as StyleId,      name: '일상형',   icon: '💬', description: '친근하고 캐주얼한 문체' },
  { id: 'informative' as StyleId, name: '정보형',   icon: '📚', description: '체계적이고 상세한 정보' },
  { id: 'review' as StyleId,      name: '리뷰형',   icon: '⭐', description: '균형 잡힌 평가와 추천' },
  { id: 'food_review' as StyleId, name: '맛집리뷰', icon: '🍽️', description: '음식점/카페 전문 리뷰' },
  { id: 'marketing' as StyleId,   name: '마케팅형', icon: '🎯', description: '홍보와 판매 유도' },
  { id: 'story' as StyleId,       name: '스토리형', icon: '📖', description: '몰입감 있는 이야기체' },
];

// 길이 옵션 목록 (5종 확장)
export const LENGTH_OPTIONS = [
  { id: 'short' as LengthId,    label: '짧게 (~500자)' },
  { id: 'medium' as LengthId,   label: '보통 (~1000자)' },
  { id: 'standard' as LengthId, label: '표준 (~2000자)' },
  { id: 'deep' as LengthId,     label: '심층 (~3000자)' },
  { id: 'premium' as LengthId,  label: '프리미엄 (~5000자)' },
];

/** 이미지 분석 프롬프트 빌더 — 이미지 내용 분석 + 배치 제안 JSON */
export function buildImageAnalysisPrompt(topic: string, style: StyleId): string {
  return `당신은 블로그 이미지 분석 전문가입니다.

첨부된 이미지를 분석하고, 아래 블로그 주제와 스타일에 맞게 각 이미지를 어디에 배치하면 좋을지 제안해주세요.

## 블로그 주제
${topic}

## 글쓰기 스타일
${style}

## 이미지 배치 원칙 (네이버 최적화)
- 첫 이미지: 도입부 직후 (네이버 썸네일 용도, 3:2 비율 권장)
- 이후: 각 H2 섹션 뒤 1장씩 배치
- alt 텍스트에 키워드 자연스럽게 포함

## 응답 형식 (JSON)
다음 JSON 배열로 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
[
  {
    "imageIndex": 0,
    "description": "이미지에 대한 간결한 설명 (alt 텍스트용, 키워드 포함)",
    "suggestedSection": "이미지를 배치할 소제목/섹션 제안",
    "context": "이미지가 글에 기여하는 맥락 설명 (1-2문장)"
  }
]`;
}

/** 이미지 분석 결과를 프롬프트 텍스트로 변환 */
export function buildImageContextBlock(
  analyses: Array<{ imageIndex: number; description: string; suggestedSection: string; context: string }>,
  imageUrls: string[],
): string {
  if (analyses.length === 0) return '';

  let block = `\n## 첨부 이미지\n아래 이미지들이 첨부되었습니다. 글의 적절한 위치에 마크다운 이미지 태그로 삽입해주세요.\n\n`;

  for (const a of analyses) {
    const url = imageUrls[a.imageIndex] || imageUrls[0];
    block += `- **이미지 ${a.imageIndex + 1}**: ${a.description}\n`;
    block += `  - 마크다운: \`![${a.description}](${url})\`\n`;
    block += `  - 추천 위치: ${a.suggestedSection}\n`;
    block += `  - 맥락: ${a.context}\n\n`;
  }

  block += `**중요**: 위 이미지 마크다운 태그를 글의 적절한 위치에 반드시 포함하세요. URL을 그대로 사용하세요.\n`;

  return block;
}

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
  // SEO 고도화 옵션 (모두 optional — 기존 호출에 영향 없음)
  includeFaq?: boolean;
  lsiKeywords?: string[];
  titleStyle?: 'number' | 'question' | 'tip' | 'auto';
}): string {
  const lengthConfig = LENGTH_CONFIG[params.length];
  const charTarget = lengthConfig?.chars || 1000;

  let prompt = `다음 조건으로 네이버 블로그 글을 작성해주세요.

## 주제
${params.topic}

## 키워드
${params.keywords.length > 0 ? params.keywords.join(', ') : '(키워드 없음 - 주제에서 자동 추출)'}

## 글 길이
약 ${charTarget}자 내외 (${lengthConfig?.label || '보통'})
`;

  if (params.tone) {
    prompt += `\n## 문체\n${TONE_INSTRUCTIONS[params.tone]}\n`;
  }

  if (params.additionalInfo) {
    prompt += `\n## 추가 정보\n${params.additionalInfo}\n`;
    prompt += `\n**정보 정확성 원칙**: 사용자가 제공하지 않은 구체적 정보(가격, 위치, 전화번호, 영업시간 등)는 절대 추측하거나 임의로 작성하지 마세요. 확인할 수 없는 정보는 "[확인 필요]" 또는 "(정확한 정보는 방문 전 확인해주세요)" 등으로 표시하세요.\n`;
  }

  if (params.style && params.templateData) {
    const hints = buildPromptHints(params.templateData, params.style);
    if (hints) {
      prompt += hints;
    }
  }

  if (params.imageContext) {
    prompt += params.imageContext;
  }

  // LSI 키워드 (있을 때만 삽입)
  if (params.lsiKeywords && params.lsiKeywords.length > 0) {
    prompt += `
## 관련어 (LSI 키워드)
다음 관련어를 본문에 자연스럽게 1-2회씩 포함하세요 (강제 삽입 금지, 문맥에 맞을 때만):
${params.lsiKeywords.join(', ')}
`;
  }

  prompt += `
## 네이버 블로그 최적 구조 (필수)

### 제목 스타일`;

  if (!params.titleStyle || params.titleStyle === 'auto') {
    prompt += `
- AI가 주제에 맞는 최적 형식을 선택하세요 (숫자형/질문형/팁형 중 하나)
- 숫자형 예시: "~하는 N가지 방법", "N가지 ~추천", "~TOP N"
- 질문형 예시: "~알고 계셨나요?", "왜 ~일까?", "~해도 될까?"
- 팁형 예시: "~꿀팁 총정리", "~완벽 가이드", "~비법 공개"`;
  } else if (params.titleStyle === 'number') {
    prompt += `
- **숫자형** 제목을 사용하세요: "~하는 N가지 방법", "N가지 ~추천", "~TOP N" 형식`;
  } else if (params.titleStyle === 'question') {
    prompt += `
- **질문형** 제목을 사용하세요: "~알고 계셨나요?", "왜 ~일까?", "~해도 될까?" 형식`;
  } else if (params.titleStyle === 'tip') {
    prompt += `
- **팁형** 제목을 사용하세요: "~꿀팁 총정리", "~완벽 가이드", "~비법 공개" 형식`;
  }

  prompt += `

### 도입부 스니펫 최적화 (필수)
- 첫 150자가 네이버 검색 결과에 노출됩니다
- 첫 문장: 질문형("~해보신 적 있으세요?") 또는 공감형("요즘 ~") 또는 통계형("~%가 ~한다고 합니다")으로 시작
- 첫 2문장 안에 주키워드 + 핵심 가치 제안 포함
- "오늘은 ~에 대해 알아보겠습니다" 패턴 절대 금지

### 키워드 배치 전략 (필수)
1. **도입부 첫 2문장 내**: 주키워드 1회 필수
2. **각 H2 소제목**: 주키워드 또는 관련어 포함 (최소 40%)
3. **본문 중반**: 보조키워드 각 1-2회 자연 삽입
4. **마무리 문단**: 주키워드 1회 + 행동 유도
5. **전체 밀도**: 1.0-2.5% 유지 (스터핑 주의)

### 글 구조
1. **도입부** (200-300자): 위 스니펫 최적화 규칙 준수
2. **본문 H2 섹션 3-5개** (각 300-500자):
   - 각 섹션 제목에 키워드 또는 관련어 포함
   - 경험 기반 서술 위주 ("실제로 해봤는데...", "써보니까..." 등)
   - 리스트, 비교표, 팁 박스 등 가독성 요소 활용
3. **마무리** (100-200자): 핵심 요약 + 주키워드 1회 + 독자 행동 유도

### 경험담 삽입 (필수)
- 최소 1개 섹션에 "실제로 해봤는데..." 또는 "직접 써보니..." 류의 1인칭 경험담 포함
- 구체적 수치나 기간 포함 시 가산점 (예: "3개월간 써본 결과")

### 작성 규칙
1. 제목을 # 마크다운으로 먼저 작성 (15-25자, 키워드 선두 배치)
2. 소제목은 ## 마크다운으로 구조화 (3-5개 섹션)
3. 위 키워드 배치 전략에 따라 키워드 삽입 (전체 밀도 1.0-2.5%)
4. 문단은 100-200자 단위로 끊어 가독성 확보
5. 네이버 블로그에 바로 복사해서 사용할 수 있는 마크다운 형식

${AI_FORBIDDEN_PHRASES}
`;

  // FAQ 섹션 (includeFaq가 true일 때만 추가)
  if (params.includeFaq) {
    prompt += `
### FAQ 섹션 (필수)
글 마지막에 "## 자주 묻는 질문" 섹션을 추가하세요:
- 주제 관련 실제로 사람들이 궁금해하는 질문 3-5개
- 각 질문은 "**Q. ~?**" 형식, 답변은 2-3문장으로 간결하게
- 질문에 키워드 자연스럽게 포함
- 네이버 AI 검색(스마트블록)에서 FAQ 형식을 우대합니다
`;
  }

  prompt += `
글을 작성해주세요:`;

  return prompt;
}

/** 음식 리뷰 전용 프롬프트 빌더 (네이버 최적화) */
export function buildFoodReviewPrompt(params: {
  topic: string;
  keywords: string[];
  length: LengthId;
  tone?: ToneId;
  additionalInfo?: string;
  imageContext?: string;
  templateData?: TemplateData;
  // SEO 고도화 옵션 (모두 optional — 기존 호출에 영향 없음)
  includeFaq?: boolean;
  lsiKeywords?: string[];
  titleStyle?: 'number' | 'question' | 'tip' | 'auto';
}): string {
  const lengthConfig = LENGTH_CONFIG[params.length];
  const charTarget = lengthConfig?.chars || 1000;

  let prompt = `다음 조건으로 음식점 리뷰 블로그 글을 작성해주세요.

## 음식점/메뉴 정보
${params.topic}

## 키워드
${params.keywords.length > 0 ? params.keywords.join(', ') : '(음식점명, 메뉴명, 위치 등에서 자동 추출)'}

## 글 길이
약 ${charTarget}자 내외 (${lengthConfig?.label || '보통'})
`;

  if (params.tone) {
    prompt += `\n## 문체\n${TONE_INSTRUCTIONS[params.tone]}\n`;
  }

  if (params.additionalInfo) {
    prompt += `\n## 추가 정보 (맛, 분위기, 가격 등)\n${params.additionalInfo}\n`;
    prompt += `\n**정보 정확성 원칙**: 사용자가 제공하지 않은 구체적 정보(가격, 위치, 전화번호, 영업시간 등)는 절대 추측하거나 임의로 작성하지 마세요. 확인할 수 없는 정보는 "[확인 필요]" 또는 "(정확한 정보는 방문 전 확인해주세요)" 등으로 표시하세요.\n`;
  }

  if (params.templateData) {
    const hints = buildPromptHints(params.templateData, 'food_review');
    if (hints) {
      prompt += hints;
    }
  }

  if (params.imageContext) {
    prompt += params.imageContext;
  }

  // LSI 키워드 (있을 때만 삽입)
  if (params.lsiKeywords && params.lsiKeywords.length > 0) {
    prompt += `
## 관련어 (LSI 키워드)
다음 관련어를 본문에 자연스럽게 1-2회씩 포함하세요 (강제 삽입 금지, 문맥에 맞을 때만):
${params.lsiKeywords.join(', ')}
`;
  }

  prompt += `
## 네이버 맛집리뷰 최적 구조 (필수)

### 제목 스타일`;

  if (!params.titleStyle || params.titleStyle === 'auto') {
    prompt += `
- AI가 주제에 맞는 최적 형식을 선택하세요 (숫자형/질문형/팁형 중 하나)
- 숫자형 예시: "~하는 N가지 방법", "N가지 ~추천", "~TOP N"
- 질문형 예시: "~알고 계셨나요?", "왜 ~일까?", "~해도 될까?"
- 팁형 예시: "~꿀팁 총정리", "~완벽 가이드", "~비법 공개"`;
  } else if (params.titleStyle === 'number') {
    prompt += `
- **숫자형** 제목을 사용하세요: "~하는 N가지 방법", "N가지 ~추천", "~TOP N" 형식`;
  } else if (params.titleStyle === 'question') {
    prompt += `
- **질문형** 제목을 사용하세요: "~알고 계셨나요?", "왜 ~일까?", "~해도 될까?" 형식`;
  } else if (params.titleStyle === 'tip') {
    prompt += `
- **팁형** 제목을 사용하세요: "~꿀팁 총정리", "~완벽 가이드", "~비법 공개" 형식`;
  }

  prompt += `

### 도입부 스니펫 최적화 (필수)
- 첫 150자가 네이버 검색 결과에 노출됩니다
- 첫 문장: 질문형("~가 궁금하세요?") 또는 공감형("요즘 ~") 또는 통계형("~%가 ~한다고 합니다")으로 시작
- 첫 2문장 안에 주키워드(음식점명 또는 메뉴명) + 핵심 가치 제안 포함
- "오늘은 ~에 대해 알아보겠습니다" 패턴 절대 금지

### 키워드 배치 전략 (필수)
1. **도입부 첫 2문장 내**: 주키워드(음식점명/메뉴명) 1회 필수
2. **각 H2 소제목**: 주키워드 또는 관련어 포함 (최소 40%)
3. **본문 중반**: 보조키워드(지역명, 음식 종류 등) 각 1-2회 자연 삽입
4. **마무리 문단**: 주키워드 1회 + 재방문 의사 또는 추천 행동 유도
5. **전체 밀도**: 1.0-2.5% 유지 (스터핑 주의)

### 글 구조
1. **도입부** (200-300자): 위 스니펫 최적화 규칙 준수 + 방문 동기
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
3. 위 키워드 배치 전략에 따라 키워드 삽입 (전체 밀도 1.0-2.5%)
4. 경험 기반 서술 필수 ("직접 가봤는데...", "먹어보니...")
5. 마크다운 형식 유지

### 주의사항
- 과장된 표현 자제 ("최고의", "역대급", "미쳤다" 등 금지)
- 확인되지 않은 정보는 "확인 필요"로 표시
- 장점과 단점 균형있게 서술

${AI_FORBIDDEN_PHRASES}
`;

  // FAQ 섹션 (includeFaq가 true일 때만 추가)
  if (params.includeFaq) {
    prompt += `
### FAQ 섹션 (필수)
글 마지막에 "## 자주 묻는 질문" 섹션을 추가하세요:
- 주제 관련 실제로 사람들이 궁금해하는 질문 3-5개
- 각 질문은 "**Q. ~?**" 형식, 답변은 2-3문장으로 간결하게
- 질문에 키워드 자연스럽게 포함
- 네이버 AI 검색(스마트블록)에서 FAQ 형식을 우대합니다
`;
  }

  prompt += `
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

${AI_FORBIDDEN_PHRASES}

고도화된 글을 작성해주세요:`;
}

/** 자연화 후처리 프롬프트 */
export function buildNaturalizationPrompt(draft: string): string {
  return `당신은 AI가 작성한 텍스트를 인간이 쓴 것처럼 자연스럽게 수정하는 전문가입니다.

## 원문
${draft}

## 자연화 작업 지침

### A단계: AI 어휘 치환
- "이로써" → 삭제 또는 "그래서"
- "결론적으로" → "정리하면" 또는 삭제
- "매우 중요합니다" → "꽤 중요하더라고요" 또는 "이게 핵심이에요"
- "다양한 측면에서" → 삭제
- 동일 접속사 연속 사용 → 다른 접속사로 교체 또는 삭제
- 과도한 존칭/격식 → 자연스러운 구어체

### B단계: 문장 리듬 변동
- 지나치게 균일한 문장 길이 → 짧은 문장(10자 내외)과 긴 문장(50자+) 섞기
- 가끔 "진짜요.", "솔직히.", "근데요." 같은 초단문 삽입
- 접속사 없이 문장 바로 이어붙이기 간간이 사용

### C단계: 경험 표현 보강
- "제가 직접 해봤는데", "솔직히 말하면", "개인적으로는" 등 1인칭 표현 자연스럽게 삽입
- 구체적 숫자/기간 추가 (있는 경우)

### D단계: 구조 변동
- 첫 문장의 시작 패턴을 자연스럽게 변경
- "오늘은 ~에 대해 알아보겠습니다" 같은 정형화된 도입부 → 에피소드나 질문으로 시작

## 응답 형식
자연화된 글 전문만 출력하세요. 제목(#)과 소제목(##) 마크다운 형식을 유지하세요.
설명이나 코멘트 없이 글만 작성하세요.`;
}
