import type { StyleId, TemplateData } from '@/lib/types';
import { buildPromptHints } from '@/lib/style-templates';
import { LENGTH_CONFIG, TONE_INSTRUCTIONS, AI_FORBIDDEN_PHRASES } from '../constants';
import type { LengthId, ToneId } from '@/lib/types';

/** buildUserPrompt / buildFoodReviewPrompt 공통: 제목 스타일 분기 없음 (현재 구현상 공통 블록 없음) */
/** 공통 파라미터 처리: 문체 블록 추가 */
export function appendToneBlock(prompt: string, tone?: ToneId): string {
  if (!tone) return prompt;
  return prompt + `\n## 문체\n${TONE_INSTRUCTIONS[tone]}\n`;
}

/** 공통 파라미터 처리: 추가 정보 + 정보 정확성 원칙 블록 */
export function appendAdditionalInfoBlock(prompt: string, additionalInfo?: string, label = '추가 정보'): string {
  if (!additionalInfo) return prompt;
  return (
    prompt +
    `\n## ${label}\n${additionalInfo}\n` +
    `\n**정보 정확성 원칙**: 사용자가 제공하지 않은 구체적 정보(가격, 위치, 전화번호, 영업시간 등)는 절대 추측하거나 임의로 작성하지 마세요. 확인할 수 없는 정보는 "[확인 필요]" 또는 "(정확한 정보는 방문 전 확인해주세요)" 등으로 표시하세요.\n`
  );
}

/** 공통 파라미터 처리: 스타일 템플릿 힌트 블록 */
export function appendTemplateHintsBlock(
  prompt: string,
  templateData?: TemplateData,
  style?: StyleId,
): string {
  if (!templateData || !style) return prompt;
  const hints = buildPromptHints(templateData, style);
  if (!hints) return prompt;
  return prompt + hints;
}

/** 공통 파라미터 처리: 이미지 컨텍스트 블록 */
export function appendImageContextBlock(prompt: string, imageContext?: string): string {
  if (!imageContext) return prompt;
  return prompt + imageContext;
}

/** 공통 파라미터 처리: 길이 설정 */
export function getLengthConfig(length: LengthId) {
  return LENGTH_CONFIG[length];
}

/** 공통 footer: AI 금지 표현 + 마무리 */
export function buildFooter(): string {
  return `\n${AI_FORBIDDEN_PHRASES}\n\n글을 작성해주세요:`;
}
