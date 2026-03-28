import type { StyleId, TemplateField } from '@/lib/types';

export const COMMON_FIELDS: TemplateField[] = [
  { key: 'freeform', label: '자유 입력', placeholder: '포함할 내용, 참고 정보, 특별한 요청사항...', type: 'textarea', rows: 3 },
];

export interface StyleTemplateConfig {
  fields: TemplateField[];
  autoExpand: boolean;
}

export const STYLE_TEMPLATE_CONFIGS: Partial<Record<StyleId, StyleTemplateConfig>> = {
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
