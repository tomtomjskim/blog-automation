import { describe, it, expect } from 'vitest';
import { replaceAIVocab, VOCAB_REPLACEMENTS } from '@/lib/naturalization/stages/vocab-replacer';
import { mixSentenceLengths } from '@/lib/naturalization/stages/sentence-mixer';

describe('replaceAIVocab', () => {
  it('빈 문자열 입력 시 빈 문자열 반환, 에러 없음', () => {
    const { text, changes } = replaceAIVocab('');
    expect(text).toBe('');
    expect(changes).toEqual([]);
  });

  it('AI 표현 없는 일반 텍스트는 그대로 반환', () => {
    const input = '오늘 날씨가 참 좋아요.';
    const { text, changes } = replaceAIVocab(input);
    expect(text).toBe(input);
    expect(changes).toHaveLength(0);
  });

  it('"매우 중요합니다"를 다른 표현으로 치환', () => {
    const input = '이것은 매우 중요합니다.';
    const { text, changes } = replaceAIVocab(input);
    expect(text).not.toContain('매우 중요합니다');
    // changes에 치환 기록이 있거나 replacement가 빈 문자열인 경우(삭제)
    const changed = changes.find(c => c.original === '매우 중요합니다');
    expect(changed || text.length < input.length).toBeTruthy();
  });

  it('"결론적으로"를 다른 표현으로 치환', () => {
    const input = '결론적으로 이 방법이 효과적입니다.';
    const { text, changes } = replaceAIVocab(input);
    expect(text).not.toContain('결론적으로');
    expect(changes.length).toBeGreaterThanOrEqual(0);
  });

  it('"살펴보겠습니다"를 치환', () => {
    const input = '지금부터 살펴보겠습니다.';
    const { text } = replaceAIVocab(input);
    expect(text).not.toContain('살펴보겠습니다');
  });

  it('여러 AI 표현이 포함된 텍스트 처리', () => {
    const input = '결론적으로 이로써 종합적으로 살펴보겠습니다.';
    const { changes } = replaceAIVocab(input);
    // 최소 1개 이상 치환됨
    expect(changes.length).toBeGreaterThan(0);
  });

  it('changes 배열 각 항목은 type, original, replaced 필드를 가짐', () => {
    const input = '이것은 매우 중요합니다.';
    const { changes } = replaceAIVocab(input);
    if (changes.length > 0) {
      expect(changes[0]).toHaveProperty('type');
      expect(changes[0]).toHaveProperty('original');
      expect(changes[0]).toHaveProperty('replaced');
    }
  });

  it('VOCAB_REPLACEMENTS 사전이 올바른 형태', () => {
    expect(Array.isArray(VOCAB_REPLACEMENTS)).toBe(true);
    expect(VOCAB_REPLACEMENTS.length).toBeGreaterThan(0);
    for (const [pattern, replacements] of VOCAB_REPLACEMENTS) {
      expect(pattern).toBeInstanceOf(RegExp);
      expect(Array.isArray(replacements)).toBe(true);
    }
  });
});

describe('mixSentenceLengths', () => {
  it('빈 문자열 입력 시 에러 없이 빈 문자열(또는 공백 트림) 반환', () => {
    const { text, changes } = mixSentenceLengths('');
    expect(text.trim()).toBe('');
    expect(Array.isArray(changes)).toBe(true);
  });

  it('일반 텍스트를 반환하고 에러 없음', () => {
    const input = '오늘 날씨가 좋습니다. 산책하기 딱 좋은 날이에요.';
    const { text, changes } = mixSentenceLengths(input);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
    expect(Array.isArray(changes)).toBe(true);
  });

  it('반환된 text는 원본 내용을 포함', () => {
    const input = '첫 번째 문장입니다. 두 번째 문장입니다.';
    const { text } = mixSentenceLengths(input);
    // 원본 일부가 결과에 포함되어야 함
    expect(text).toContain('첫 번째 문장입니다');
  });

  it('changes 항목에 sentence type이 있으면 replaced 필드 포함', () => {
    // 5문장 이상 있고 랜덤이 0.5 초과인 경우 짧은 문장이 삽입됨
    // 삽입 여부는 랜덤이므로 구조만 검증
    const sentences = Array.from({ length: 10 }, (_, i) => `문장 ${i + 1}번입니다.`).join(' ');
    const { changes } = mixSentenceLengths(sentences);
    for (const c of changes) {
      expect(c).toHaveProperty('type', 'sentence');
      expect(c).toHaveProperty('replaced');
    }
  });

  it('단일 문장도 처리 가능', () => {
    const input = '이것은 단일 문장입니다.';
    const { text } = mixSentenceLengths(input);
    expect(text).toContain('이것은 단일 문장입니다');
  });

  it('여러 문장 처리 후 공백 트림됨', () => {
    const sentences = Array.from({ length: 6 }, (_, i) => `문장 ${i}입니다.`).join(' ');
    const { text } = mixSentenceLengths(sentences);
    expect(text).toBe(text.trim());
  });
});
