import type { StyleId, TemplateField } from '@/lib/types';
import { STYLE_TEMPLATE_CONFIGS, COMMON_FIELDS } from './configs';

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
