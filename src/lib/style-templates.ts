import type { StyleId, TemplateField, TemplateData } from './types';

const COMMON_FIELDS: TemplateField[] = [
  { key: 'freeform', label: '자유 입력', placeholder: '포함할 내용, 참고 정보, 특별한 요청사항...', type: 'textarea', rows: 3 },
];

interface StyleTemplateConfig {
  fields: TemplateField[];
  autoExpand: boolean;
}

const STYLE_TEMPLATE_CONFIGS: Partial<Record<StyleId, StyleTemplateConfig>> = {
  review: {
    autoExpand: true,
    fields: [
      // 제품 정보
      { key: 'product_name', label: '제품/서비스명', placeholder: '예: 다이슨 에어랩', type: 'input', group: '제품 정보' },
      { key: 'usage_period', label: '사용 기간', placeholder: '예: 3개월', type: 'input', group: '제품 정보' },
      // 평가
      { key: 'pros', label: '장점', placeholder: '좋았던 점을 간단히 나열', type: 'textarea', rows: 2, group: '평가' },
      { key: 'cons', label: '단점', placeholder: '아쉬웠던 점을 간단히 나열', type: 'textarea', rows: 2, group: '평가' },
      { key: 'rating', label: '총점 (5점 만점)', placeholder: '', type: 'rating', group: '평가' },
      { key: 'repurchase', label: '재구매 의사', placeholder: '', type: 'toggle', group: '평가' },
      // 구매 정보
      { key: 'purchase_price', label: '구매 가격', placeholder: '예: 59만원', type: 'input', group: '구매 정보' },
      { key: 'how_to_get', label: '구매처/입수 방법', placeholder: '예: 공식 온라인몰, 쿠팡', type: 'input', group: '구매 정보' },
      { key: 'reference_info', label: '참고 정보', placeholder: '스펙, 비교 제품, 유의사항 등', type: 'textarea', rows: 2, group: '구매 정보' },
    ],
  },
  food_review: {
    autoExpand: true,
    fields: [
      // 기본 정보
      { key: 'restaurant_name', label: '음식점명', placeholder: '예: 을지로 골목식당', type: 'input', group: '기본 정보' },
      { key: 'location', label: '위치/찾아가는 길', placeholder: '예: 을지로3가역 3번 출구 도보 5분', type: 'input', group: '기본 정보' },
      { key: 'price_range', label: '1인 예상 비용', placeholder: '예: 1만~1.5만원', type: 'input', group: '기본 정보' },
      { key: 'hours', label: '영업시간', placeholder: '예: 11:00~21:00, 브레이크타임 15:00~17:00', type: 'input', group: '기본 정보' },
      // 리뷰
      { key: 'recommended_menu', label: '추천 메뉴', placeholder: '예: 된장찌개, 제육볶음', type: 'input', group: '리뷰' },
      { key: 'taste_notes', label: '맛/분위기 메모', placeholder: '맛, 식감, 분위기 등 기억나는 것들', type: 'textarea', rows: 2, group: '리뷰' },
      { key: 'rating', label: '총점 (5점 만점)', placeholder: '', type: 'rating', group: '리뷰' },
      { key: 'revisit', label: '재방문 의사', placeholder: '', type: 'toggle', group: '리뷰' },
      // 실용 정보
      { key: 'best_for', label: '추천 상황', placeholder: '선택해주세요', type: 'select', options: ['혼밥', '데이트', '가족모임', '회식', '친구모임', '기타'], group: '실용 정보' },
    ],
  },
  informative: {
    autoExpand: false,
    fields: [
      { key: 'key_facts', label: '핵심 팩트/수치', placeholder: '반드시 포함할 핵심 정보나 통계', type: 'textarea', rows: 2, group: '콘텐츠' },
      { key: 'target_audience', label: '대상 독자', placeholder: '예: 초보 투자자, 대학생', type: 'input', group: '콘텐츠' },
      { key: 'source_urls', label: '참고 소스', placeholder: '참고 URL이나 출처명', type: 'textarea', rows: 2, group: '구성' },
      { key: 'structure_hint', label: '구성 힌트', placeholder: '원하는 목차/구성이 있다면 작성', type: 'textarea', rows: 2, group: '구성' },
    ],
  },
  casual: {
    autoExpand: false,
    fields: [
      { key: 'my_experience', label: '나의 경험', placeholder: '직접 겪은 에피소드를 간단히', type: 'textarea', rows: 3, group: '내용' },
      { key: 'mood', label: '분위기/감정', placeholder: '예: 설렘, 아쉬움, 뿌듯함', type: 'input', group: '내용' },
      { key: 'cta', label: '마무리 질문/CTA', placeholder: '독자에게 물어볼 질문이나 행동 유도', type: 'input', group: '내용' },
    ],
  },
  marketing: {
    autoExpand: false,
    fields: [
      { key: 'product_service', label: '제품/서비스명', placeholder: '홍보할 제품이나 서비스', type: 'input', group: '제품' },
      { key: 'target_customer', label: '타겟 고객', placeholder: '예: 2030 직장인, 자취생', type: 'input', group: '제품' },
      { key: 'usp', label: '핵심 차별점 (USP)', placeholder: '경쟁사 대비 강점', type: 'textarea', rows: 2, group: '마케팅' },
      { key: 'cta_action', label: '유도 행동 (CTA)', placeholder: '예: 무료 체험 신청, 할인 쿠폰 받기', type: 'input', group: '마케팅' },
      { key: 'price_offer', label: '가격/혜택', placeholder: '예: 월 9,900원, 첫 달 무료', type: 'input', group: '마케팅' },
    ],
  },
  story: {
    autoExpand: false,
    fields: [
      { key: 'setting', label: '배경/상황', placeholder: '시간, 장소, 상황 설정', type: 'textarea', rows: 2, group: '스토리' },
      { key: 'characters', label: '등장인물', placeholder: '나, 친구, 가족 등 관련 인물', type: 'input', group: '스토리' },
      { key: 'turning_point', label: '전환점/클라이맥스', placeholder: '이야기의 핵심 장면이나 깨달음', type: 'textarea', rows: 2, group: '스토리' },
      { key: 'lesson', label: '교훈/메시지', placeholder: '전달하고 싶은 핵심 메시지', type: 'input', group: '스토리' },
    ],
  },
};

/** 주어진 스타일의 전용 필드 + 공통 필드 반환 */
export function getStyleTemplate(style: StyleId): TemplateField[] {
  const config = STYLE_TEMPLATE_CONFIGS[style];
  const styleFields = config?.fields || [];
  return [...styleFields, ...COMMON_FIELDS];
}

/** 스타일의 autoExpand 여부 반환 */
export function getStyleAutoExpand(style: StyleId): boolean {
  return STYLE_TEMPLATE_CONFIGS[style]?.autoExpand ?? false;
}

/** 스타일 전용 키 목록 (스타일 전환 시 초기화 대상) */
export function getStyleSpecificKeys(style: StyleId): string[] {
  return (STYLE_TEMPLATE_CONFIGS[style]?.fields || []).map(f => f.key);
}

/** rating 값(숫자 문자열)을 별점 표시용 레이블로 변환 */
function formatRating(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return `${num}/5`;
}

/** food_review 직렬화: 마크다운 표 형태 */
function serializeFoodReview(data: TemplateData, fields: TemplateField[]): string {
  const tableFields = ['restaurant_name', 'location', 'price_range', 'hours', 'recommended_menu', 'rating', 'revisit', 'best_for'];
  const lines: string[] = [];

  // 기본 정보 표
  const tableRows: string[] = [];
  for (const key of tableFields) {
    const field = fields.find(f => f.key === key);
    if (!field) continue;
    const value = data[key]?.trim();
    if (!value) continue;
    const displayValue = key === 'rating' ? formatRating(value) : value;
    tableRows.push(`| ${field.label} | ${displayValue} |`);
  }
  if (tableRows.length > 0) {
    lines.push('| 항목 | 내용 |');
    lines.push('|------|------|');
    lines.push(...tableRows);
  }

  // 맛/분위기 메모 (표 밖)
  const tasteNotes = data['taste_notes']?.trim();
  if (tasteNotes) {
    lines.push('');
    lines.push(`[맛/분위기 메모]\n${tasteNotes}`);
  }

  // freeform
  const freeform = data['freeform']?.trim();
  if (freeform) {
    lines.push('');
    lines.push(freeform);
  }

  return lines.join('\n');
}

/** review 직렬화: 구조화 블록 형태 */
function serializeReview(data: TemplateData, fields: TemplateField[]): string {
  const lines: string[] = [];

  const productName = data['product_name']?.trim();
  if (productName) lines.push(`[제품] ${productName}`);

  const usagePeriod = data['usage_period']?.trim();
  if (usagePeriod) lines.push(`[사용기간] ${usagePeriod}`);

  const purchasePrice = data['purchase_price']?.trim();
  if (purchasePrice) lines.push(`[가격] ${purchasePrice}`);

  const howToGet = data['how_to_get']?.trim();
  if (howToGet) lines.push(`[구매처] ${howToGet}`);

  const rating = data['rating']?.trim();
  if (rating) lines.push(`[총점] ${formatRating(rating)}`);

  const repurchase = data['repurchase']?.trim();
  if (repurchase) lines.push(`[재구매 의사] ${repurchase}`);

  const pros = data['pros']?.trim();
  if (pros) {
    lines.push('');
    lines.push(`[장점]\n${pros}`);
  }

  const cons = data['cons']?.trim();
  if (cons) {
    lines.push('');
    lines.push(`[단점]\n${cons}`);
  }

  const referenceInfo = data['reference_info']?.trim();
  if (referenceInfo) {
    lines.push('');
    lines.push(`[참고 정보]\n${referenceInfo}`);
  }

  const freeform = data['freeform']?.trim();
  if (freeform) {
    lines.push('');
    lines.push(freeform);
  }

  return lines.join('\n');
}

/** informative 직렬화: 목차 힌트 형태 */
function serializeInformative(data: TemplateData, fields: TemplateField[]): string {
  const lines: string[] = [];

  const keyFacts = data['key_facts']?.trim();
  if (keyFacts) {
    lines.push('[핵심 팩트]');
    lines.push(keyFacts);
  }

  const targetAudience = data['target_audience']?.trim();
  if (targetAudience) lines.push(`[대상 독자] ${targetAudience}`);

  const structureHint = data['structure_hint']?.trim();
  if (structureHint) {
    lines.push('');
    lines.push('[목차 구성 힌트]');
    lines.push(structureHint);
  }

  const sourceUrls = data['source_urls']?.trim();
  if (sourceUrls) {
    lines.push('');
    lines.push('[참고 소스]');
    lines.push(sourceUrls);
  }

  const freeform = data['freeform']?.trim();
  if (freeform) {
    lines.push('');
    lines.push(freeform);
  }

  return lines.join('\n');
}

/** 템플릿 데이터를 스타일별 최적화된 문자열로 직렬화 (빈 항목 생략) */
export function serializeTemplateData(data: TemplateData, style: StyleId): string {
  const fields = getStyleTemplate(style);

  if (style === 'food_review') {
    return serializeFoodReview(data, fields);
  }
  if (style === 'review') {
    return serializeReview(data, fields);
  }
  if (style === 'informative') {
    return serializeInformative(data, fields);
  }

  // 기타 스타일: 기존 [레이블] 값 유지
  const lines: string[] = [];
  for (const field of fields) {
    const value = data[field.key]?.trim();
    if (!value) continue;

    if (field.key === 'freeform') {
      lines.push(value);
    } else {
      const displayValue = field.type === 'rating' ? formatRating(value) : value;
      lines.push(`[${field.label}] ${displayValue}`);
    }
  }
  return lines.join('\n');
}

/** 값 해석 힌트 + 조건부 프롬프트 블록 생성 */
export function buildPromptHints(data: TemplateData, style: StyleId): string {
  const hints: string[] = [];

  if (style === 'food_review' || style === 'review') {
    const ratingStr = data['rating']?.trim();
    if (ratingStr) {
      const rating = parseFloat(ratingStr);
      if (!isNaN(rating)) {
        if (rating >= 4.5) {
          hints.push('(높은 만족도 반영, 객관성 유지)');
        } else if (rating <= 2.5) {
          hints.push('(실망감 솔직하게, 건설적으로)');
        }
      }
    }
  }

  if (style === 'review') {
    const repurchase = data['repurchase']?.trim();
    if (repurchase === 'X') {
      hints.push('(재구매 의사 없음 이유 구체적 설명)');
    }

    const pros = data['pros']?.trim();
    const cons = data['cons']?.trim();
    if (pros && !cons) {
      hints.push('(단점도 1-2개 언급하여 균형 유지)');
    }
  }

  if (style === 'food_review') {
    const revisit = data['revisit']?.trim();
    if (revisit === 'X') {
      hints.push('(재방문 의사 없음 이유 구체적 설명)');
    }

    const location = data['location']?.trim();
    if (location) {
      hints.push('(찾아가는 길 상세 작성)');
    } else {
      hints.push("(위치는 '[확인 필요]'로 표시)");
    }

    const hours = data['hours']?.trim();
    if (!hours) {
      hints.push("(영업시간은 '방문 전 확인 권장'으로 표시)");
    }
  }

  if (style === 'review') {
    const howToGet = data['how_to_get']?.trim();
    if (!howToGet) {
      hints.push('(구매처 정보 생략)');
    }
  }

  if (hints.length === 0) return '';
  return `\n## 작성 힌트\n${hints.map(h => `- ${h}`).join('\n')}\n`;
}

/** "[레이블] 값" 형태 문자열을 TemplateData로 역직렬화 */
export function deserializeTemplateData(text: string, style: StyleId): TemplateData {
  if (!text) return {};
  const fields = getStyleTemplate(style);
  const labelToKey = new Map<string, string>();
  for (const f of fields) {
    labelToKey.set(f.label, f.key);
  }

  const result: TemplateData = {};
  const lines = text.split('\n');
  let currentKey: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentKey && currentLines.length > 0) {
      result[currentKey] = currentLines.join('\n').trim();
    }
    currentKey = null;
    currentLines = [];
  };

  for (const line of lines) {
    // 마크다운 표 행 파싱 (food_review 직렬화 포맷)
    const tableMatch = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (tableMatch && tableMatch[1] !== '항목' && tableMatch[1] !== '------') {
      const label = tableMatch[1].trim();
      const value = tableMatch[2].trim();
      const key = labelToKey.get(label);
      if (key) {
        result[key] = key === 'rating' ? value.replace('/5', '') : value;
      }
      continue;
    }

    // "[레이블] 값" 형태 파싱
    const bracketMatch = line.match(/^\[(.+?)\]\s*(.*)/);
    if (bracketMatch) {
      flush();
      const label = bracketMatch[1].trim();
      const value = bracketMatch[2].trim();
      const key = labelToKey.get(label);
      if (key) {
        currentKey = key;
        currentLines = value ? [key === 'rating' ? value.replace('/5', '') : value] : [];
      } else {
        // freeform에 해당하는 경우
        currentKey = 'freeform';
        currentLines = [line];
      }
      continue;
    }

    // 이전 키의 연속 라인이거나 freeform
    if (currentKey) {
      currentLines.push(line);
    } else if (line.trim()) {
      // 매칭되지 않는 라인은 freeform으로
      if (!result['freeform']) result['freeform'] = '';
      result['freeform'] += (result['freeform'] ? '\n' : '') + line;
    }
  }
  flush();

  return result;
}
