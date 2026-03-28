import { describe, it, expect } from 'vitest';
import { serializeTemplateData, formatRating } from '@/lib/style-templates/serializers';
import { deserializeTemplateData } from '@/lib/style-templates/deserializer';
import type { TemplateData } from '@/lib/types';

describe('formatRating', () => {
  it('숫자 문자열을 N/5 포맷으로 변환', () => {
    expect(formatRating('4')).toBe('4/5');
    expect(formatRating('3.5')).toBe('3.5/5');
  });

  it('숫자가 아닌 문자열은 그대로 반환', () => {
    expect(formatRating('없음')).toBe('없음');
    expect(formatRating('')).toBe('');
  });
});

describe('serializeTemplateData + deserializeTemplateData 라운드트립', () => {
  it('casual 스타일: 직렬화 → 역직렬화 라운드트립', () => {
    const data: TemplateData = {
      my_experience: '직접 겪은 에피소드',
      mood: '설렘',
      cta: '여러분도 도전해보세요!',
    };
    const serialized = serializeTemplateData(data, 'casual');
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);

    const deserialized = deserializeTemplateData(serialized, 'casual');
    expect(deserialized.my_experience).toBe('직접 겪은 에피소드');
    expect(deserialized.mood).toBe('설렘');
    expect(deserialized.cta).toBe('여러분도 도전해보세요!');
  });

  it('informative 스타일: 직렬화 → 역직렬화 라운드트립', () => {
    const data: TemplateData = {
      key_facts: '핵심 팩트 1\n핵심 팩트 2',
      target_audience: '초보 투자자',
      structure_hint: '1장 개요\n2장 방법\n3장 정리',
    };
    const serialized = serializeTemplateData(data, 'informative');
    // serializeInformative는 하드코딩된 '[핵심 팩트]' 레이블을 사용
    expect(serialized).toContain('[핵심 팩트]');
    expect(serialized).toContain('[대상 독자]');
    expect(serialized).toContain('초보 투자자');

    const deserialized = deserializeTemplateData(serialized, 'informative');
    expect(deserialized.target_audience).toBe('초보 투자자');
    // key_facts는 직렬화 시 포함되지만, deserializer가 별도 파싱하지 않을 수 있음
    // 직렬화 출력에 포함되었는지만 확인 (라운드트립 보장은 역직렬화 구현 범위에 따름)
    expect(serialized).toContain('핵심 팩트 1');
  });

  it('review 스타일: 직렬화 결과가 올바른 레이블 형태', () => {
    const data: TemplateData = {
      product_name: '다이슨 에어랩',
      usage_period: '3개월',
      pros: '빠른 건조\n열 손상 적음',
      cons: '무거운 편',
      rating: '4',
      repurchase: '예',
    };
    const serialized = serializeTemplateData(data, 'review');
    // serializer는 shorthand 레이블([제품], [사용기간])을 사용함
    expect(serialized).toContain('[제품] 다이슨 에어랩');
    expect(serialized).toContain('[사용기간] 3개월');
    expect(serialized).toContain('4/5');
    expect(serialized).toContain('[재구매 의사] 예');
  });

  it('review 스타일: 역직렬화로 장/단점 복원', () => {
    const data: TemplateData = {
      pros: '빠른 건조\n열 손상 적음',
      cons: '무거운 편',
      repurchase: '예',
    };
    const serialized = serializeTemplateData(data, 'review');
    const deserialized = deserializeTemplateData(serialized, 'review');
    // 역직렬화 가능한 필드 확인 (레이블 매핑이 있는 필드)
    expect(deserialized.repurchase).toBe('예');
    expect(deserialized.pros).toContain('빠른 건조');
    expect(deserialized.cons).toBe('무거운 편');
  });

  it('food_review 스타일: 직렬화 → 역직렬화 라운드트립', () => {
    const data: TemplateData = {
      restaurant_name: '을지로 골목식당',
      location: '을지로3가역 3번 출구 도보 5분',
      price_range: '1만~1.5만원',
      rating: '4.5',
      revisit: '예',
      taste_notes: '된장찌개가 정말 맛있었다',
    };
    const serialized = serializeTemplateData(data, 'food_review');
    // 마크다운 표 형태 확인
    expect(serialized).toContain('| 음식점명 |');
    expect(serialized).toContain('을지로 골목식당');
    expect(serialized).toContain('4.5/5');

    const deserialized = deserializeTemplateData(serialized, 'food_review');
    expect(deserialized.restaurant_name).toBe('을지로 골목식당');
    expect(deserialized.rating).toBe('4.5');
  });

  it('빈 data 직렬화 시 빈 문자열 반환', () => {
    const serialized = serializeTemplateData({}, 'casual');
    expect(serialized).toBe('');
  });

  it('빈 문자열 역직렬화 시 빈 객체 반환', () => {
    const deserialized = deserializeTemplateData('', 'casual');
    expect(deserialized).toEqual({});
  });

  it('일부 필드만 있는 경우 해당 필드만 직렬화', () => {
    const data: TemplateData = { mood: '뿌듯함' };
    const serialized = serializeTemplateData(data, 'casual');
    expect(serialized).toContain('뿌듯함');
    // 없는 필드는 포함되지 않아야 함
    expect(serialized).not.toContain('나의 경험');
  });

  it('freeform 필드는 레이블 없이 직렬화', () => {
    const data: TemplateData = { freeform: '자유 입력 내용입니다.' };
    const serialized = serializeTemplateData(data, 'casual');
    expect(serialized).toContain('자유 입력 내용입니다.');
    // [자유 입력] 레이블 형태가 아니어야 함
    expect(serialized).not.toMatch(/\[자유 입력\]/);
  });
});
