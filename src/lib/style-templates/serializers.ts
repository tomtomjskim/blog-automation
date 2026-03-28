import type { StyleId, TemplateField, TemplateData } from '@/lib/types';
import { getStyleTemplate } from './accessors';

/** rating 값(숫자 문자열)을 별점 표시용 레이블로 변환 */
export function formatRating(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return `${num}/5`;
}

/** food_review 직렬화: 마크다운 표 형태 */
export function serializeFoodReview(data: TemplateData, fields: TemplateField[]): string {
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
export function serializeReview(data: TemplateData, fields: TemplateField[]): string {
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
export function serializeInformative(data: TemplateData, fields: TemplateField[]): string {
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
