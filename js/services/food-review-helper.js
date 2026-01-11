/**
 * Blog Automation - Food Review Helper
 * 음식점 리뷰 전용 헬퍼 서비스
 * - 맛 표현 가이드라인
 * - 사진 설명 템플릿
 * - 음식 리뷰 프롬프트 빌더
 */

// 맛 표현 라이브러리
export const TASTE_EXPRESSIONS = {
  // 식감 표현
  texture: {
    crispy: ['바삭바삭한', '겉바속촉', '크리스피한', '파삭파삭한'],
    chewy: ['쫄깃쫄깃한', '탱글탱글한', '쫀득쫀득한', '찰진'],
    soft: ['부드러운', '촉촉한', '입에서 녹는', '살살 녹는'],
    tender: ['연한', '살이 부드러운', '포슬포슬한', '보들보들한'],
    crunchy: ['아삭아삭한', '씹히는 맛이 좋은', '식감이 살아있는']
  },

  // 맛 표현
  flavor: {
    savory: ['고소한', '구수한', '감칠맛 나는', '깊은 맛의'],
    sweet: ['달콤한', '은은하게 단', '새콤달콤한', '단짠단짠'],
    spicy: ['매콤한', '칼칼한', '얼얼한', '화끈한'],
    fresh: ['상큼한', '깔끔한', '개운한', '담백한'],
    rich: ['진한', '농후한', '풍부한', '묵직한']
  },

  // 온도 표현
  temperature: {
    hot: ['뜨끈뜨끈한', '김이 모락모락', '따뜻하게 데워진', '화끈하게 뜨거운'],
    warm: ['따스한', '온기가 느껴지는', '적당히 따뜻한'],
    cold: ['시원한', '차갑게 즐기는', '얼음같이 차가운', '청량한'],
    room: ['상온의', '적정 온도의']
  },

  // 향 표현
  aroma: {
    fragrant: ['향긋한', '고소한 냄새가 나는', '향이 좋은'],
    smoky: ['훈연향이 나는', '불향이 배인', '숯불 향의'],
    herbal: ['허브향 가득한', '향신료 향이 은은한'],
    fresh: ['신선한 향의', '재료 본연의 향이 살아있는']
  },

  // 종합 표현
  overall: {
    excellent: ['입안 가득 퍼지는', '한 입에 반하는', '자꾸 손이 가는'],
    balanced: ['조화로운', '균형 잡힌', '과하지 않은'],
    unique: ['독특한', '색다른', '처음 경험하는'],
    homestyle: ['집밥 같은', '정성이 느껴지는', '손맛이 느껴지는']
  }
};

// 음식 카테고리별 추천 표현
export const CATEGORY_EXPRESSIONS = {
  korean: {
    name: '한식',
    keywords: ['정갈한', '손맛', '밑반찬', '국물', '뚝배기'],
    phrases: ['어머니 손맛이 느껴지는', '정성 가득한 밑반찬', '깊은 국물 맛']
  },
  japanese: {
    name: '일식',
    keywords: ['신선한', '담백한', '정갈한', '오마카세', '제철'],
    phrases: ['재료 본연의 맛을 살린', '정갈하게 담긴', '신선도가 살아있는']
  },
  chinese: {
    name: '중식',
    keywords: ['불맛', '웍향', '짜장', '탕수육', '코스요리'],
    phrases: ['불맛이 살아있는', '웍의 불향이 느껴지는', '중화요리의 정석']
  },
  western: {
    name: '양식',
    keywords: ['스테이크', '파스타', '리조또', '코스', '와인페어링'],
    phrases: ['정통 유럽식', '셰프의 손길이 느껴지는', '고급스러운 플레이팅']
  },
  cafe: {
    name: '카페/디저트',
    keywords: ['브런치', '디저트', '커피', '분위기', '인테리어'],
    phrases: ['눈으로 먼저 맛보는', '달콤한 유혹', '인생 디저트']
  },
  street: {
    name: '분식/길거리',
    keywords: ['떡볶이', '김밥', '순대', '튀김', '포장마차'],
    phrases: ['추억의 맛', '학창시절 생각나는', 'B급 감성 가득한']
  }
};

// 사진 설명 템플릿
export const PHOTO_TEMPLATES = {
  exterior: {
    label: '가게 외관',
    template: '[사진: 가게 외관 - {{description}}]',
    tips: '간판이 잘 보이게, 낮 시간대 촬영 권장'
  },
  interior: {
    label: '내부 인테리어',
    template: '[사진: 내부 분위기 - {{description}}]',
    tips: '좌석 배치, 조명, 전체적인 분위기 포착'
  },
  menu_board: {
    label: '메뉴판',
    template: '[사진: 메뉴판 - 가격대 확인 가능]',
    tips: '대표 메뉴와 가격이 보이도록'
  },
  signature: {
    label: '시그니처 메뉴',
    template: '[사진: {{menuName}} - {{description}}]',
    tips: '45도 각도, 자연광 활용, 플레이팅 전체가 보이게'
  },
  closeup: {
    label: '음식 클로즈업',
    template: '[사진: {{menuName}} 클로즈업 - {{description}}]',
    tips: '디테일한 식감, 단면, 토핑 등 강조'
  },
  side: {
    label: '사이드/반찬',
    template: '[사진: 사이드 메뉴 - {{description}}]',
    tips: '기본 제공 반찬이나 세트 구성'
  },
  drink: {
    label: '음료',
    template: '[사진: {{drinkName}} - {{description}}]',
    tips: '컵/잔 디자인과 음료 색감'
  }
};

// 평가 카테고리
export const RATING_CATEGORIES = {
  taste: { label: '맛', icon: '😋', weight: 0.4 },
  service: { label: '서비스', icon: '💁', weight: 0.2 },
  atmosphere: { label: '분위기', icon: '✨', weight: 0.2 },
  value: { label: '가성비', icon: '💰', weight: 0.2 }
};

// 가격대 표시
export const PRICE_RANGES = {
  cheap: { label: '가성비', range: '~10,000원', icon: '💰' },
  moderate: { label: '보통', range: '10,000~20,000원', icon: '💰💰' },
  expensive: { label: '고가', range: '20,000~50,000원', icon: '💰💰💰' },
  premium: { label: '프리미엄', range: '50,000원~', icon: '💰💰💰💰' }
};

// 추천 상황
export const OCCASIONS = [
  { id: 'date', label: '데이트', icon: '💑' },
  { id: 'family', label: '가족모임', icon: '👨‍👩‍👧‍👦' },
  { id: 'friends', label: '친구모임', icon: '👥' },
  { id: 'solo', label: '혼밥', icon: '🧑' },
  { id: 'business', label: '비즈니스', icon: '💼' },
  { id: 'special', label: '특별한 날', icon: '🎉' }
];

/**
 * 음식 리뷰 전용 프롬프트 빌더
 */
export function buildFoodReviewPrompt(options) {
  const {
    restaurantName,
    location,
    category = 'korean',
    visitDate,
    menuItems = [],
    priceRange = 'moderate',
    atmosphere = '',
    parking = '',
    reservation = '',
    businessHours = '',
    occasions = [],
    photos = [],
    additionalNotes = ''
  } = options;

  const categoryInfo = CATEGORY_EXPRESSIONS[category] || CATEGORY_EXPRESSIONS.korean;
  const priceInfo = PRICE_RANGES[priceRange] || PRICE_RANGES.moderate;

  let prompt = `## 음식점 정보
- 상호명: ${restaurantName}
- 위치: ${location}
- 음식 카테고리: ${categoryInfo.name}
- 방문일: ${visitDate || '최근'}

## 주문 메뉴
${menuItems.length > 0 ? menuItems.map((item, i) => `${i + 1}. ${item.name}${item.price ? ` (${item.price})` : ''}${item.description ? ` - ${item.description}` : ''}`).join('\n') : '(메뉴 정보 없음 - 대표 메뉴 추천해주세요)'}

## 가격대
${priceInfo.icon} ${priceInfo.label} (${priceInfo.range})

## 작성 가이드라인

### 필수 포함 정보
1. **총평 및 별점** (5점 만점)
   - 맛: ⭐⭐⭐⭐⭐ (5점)
   - 서비스: ⭐⭐⭐⭐ (4점)
   - 분위기: ⭐⭐⭐⭐ (4점)
   - 가성비: ⭐⭐⭐⭐ (4점)

2. **실용 정보**`;

  if (parking) {
    prompt += `\n   - 🅿️ 주차: ${parking}`;
  } else {
    prompt += `\n   - 🅿️ 주차: (주차 정보 포함 필요)`;
  }

  if (businessHours) {
    prompt += `\n   - ⏰ 영업시간: ${businessHours}`;
  } else {
    prompt += `\n   - ⏰ 영업시간: (영업시간 정보 포함 필요)`;
  }

  if (reservation) {
    prompt += `\n   - 📱 예약: ${reservation}`;
  } else {
    prompt += `\n   - 📱 예약: (예약 가능 여부 포함 필요)`;
  }

  prompt += `

3. **추천 상황**
${occasions.length > 0 ? occasions.map(o => {
    const occ = OCCASIONS.find(oc => oc.id === o);
    return occ ? `   - ${occ.icon} ${occ.label}` : `   - ${o}`;
  }).join('\n') : '   - (추천 상황 포함 필요)'}

### 맛 표현 가이드
- ${categoryInfo.name} 특화 키워드: ${categoryInfo.keywords.join(', ')}
- 추천 표현: "${categoryInfo.phrases.join('", "')}"

### 사진 배치`;

  if (photos.length > 0) {
    photos.forEach((photo, i) => {
      const template = PHOTO_TEMPLATES[photo.type];
      if (template) {
        prompt += `\n${i + 1}. ${template.template.replace('{{menuName}}', photo.menuName || '').replace('{{description}}', photo.description || '')}`;
      }
    });
  } else {
    prompt += `
1. [사진: 가게 외관]
2. [사진: 대표 메뉴]
3. [사진: 음식 클로즈업]
4. [사진: 내부 분위기]`;
  }

  if (atmosphere) {
    prompt += `\n\n### 분위기/특이사항\n${atmosphere}`;
  }

  if (additionalNotes) {
    prompt += `\n\n### 추가 메모\n${additionalNotes}`;
  }

  prompt += `

## 주의사항
- 확인되지 않은 정보(영업시간, 가격 등)는 "확인 필요"로 표시
- 과장된 표현 자제 ("인생 맛집", "역대급" 등)
- 장점과 단점 균형있게 서술
- 재방문 의사 명확히 표현

위 정보를 바탕으로 네이버 블로그용 음식점 리뷰를 작성해주세요.`;

  return prompt;
}

/**
 * 맛 표현 추천 가져오기
 */
export function getTasteExpressionSuggestions(category, type) {
  if (category && TASTE_EXPRESSIONS[category]) {
    if (type && TASTE_EXPRESSIONS[category][type]) {
      return TASTE_EXPRESSIONS[category][type];
    }
    return Object.values(TASTE_EXPRESSIONS[category]).flat();
  }
  return Object.values(TASTE_EXPRESSIONS).map(cat => Object.values(cat).flat()).flat();
}

/**
 * 카테고리별 추천 키워드
 */
export function getCategoryKeywords(category) {
  return CATEGORY_EXPRESSIONS[category] || CATEGORY_EXPRESSIONS.korean;
}

/**
 * 사진 템플릿 가져오기
 */
export function getPhotoTemplate(type, data = {}) {
  const template = PHOTO_TEMPLATES[type];
  if (!template) return null;

  let result = template.template;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(`{{${key}}}`, value || '');
  });

  return {
    ...template,
    rendered: result
  };
}

/**
 * 종합 평점 계산
 */
export function calculateOverallRating(ratings) {
  const { taste = 0, service = 0, atmosphere = 0, value = 0 } = ratings;

  const weighted =
    taste * RATING_CATEGORIES.taste.weight +
    service * RATING_CATEGORIES.service.weight +
    atmosphere * RATING_CATEGORIES.atmosphere.weight +
    value * RATING_CATEGORIES.value.weight;

  return Math.round(weighted * 10) / 10;
}

/**
 * 별점 문자열 생성
 */
export function generateStarRating(score, maxScore = 5) {
  const fullStars = Math.floor(score);
  const hasHalf = score % 1 >= 0.5;
  const emptyStars = maxScore - fullStars - (hasHalf ? 1 : 0);

  return '⭐'.repeat(fullStars) + (hasHalf ? '✨' : '') + '☆'.repeat(emptyStars);
}

export default {
  TASTE_EXPRESSIONS,
  CATEGORY_EXPRESSIONS,
  PHOTO_TEMPLATES,
  RATING_CATEGORIES,
  PRICE_RANGES,
  OCCASIONS,
  buildFoodReviewPrompt,
  getTasteExpressionSuggestions,
  getCategoryKeywords,
  getPhotoTemplate,
  calculateOverallRating,
  generateStarRating
};
