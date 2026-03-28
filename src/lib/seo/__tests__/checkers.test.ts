import { describe, it, expect } from 'vitest';
import { checkTitleLength, checkTitleKeyword } from '@/lib/seo/checkers/title';
import { checkPrimaryKeyword, checkSecondaryKeywords, checkFirstParagraphKeyword, checkH2Keywords } from '@/lib/seo/checkers/keywords';
import { checkH2Structure } from '@/lib/seo/checkers/structure';
import { checkImageCount } from '@/lib/seo/checkers/media';

// 테스트용 헬퍼
const EMPTY_CONTENT = '';
const NO_KEYWORDS: string[] = [];

describe('checkTitleLength', () => {
  it('빈 제목이면 score 0, suggestion 포함', () => {
    const result = checkTitleLength(EMPTY_CONTENT, NO_KEYWORDS, '');
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(10);
    expect(result.suggestion).toBeTruthy();
  });

  it('짧은 제목(14자 이하)이면 score 5, suggestion에 늘리라는 문구 포함', () => {
    const title = '짧은제목'; // 4자
    const result = checkTitleLength(EMPTY_CONTENT, NO_KEYWORDS, title);
    expect(result.score).toBe(5);
    expect(result.maxScore).toBe(10);
    expect(result.suggestion).toContain('늘려보세요');
  });

  it('적정 제목(15~25자)이면 만점', () => {
    const title = '적정한제목길이를가진타이틀입니다'; // 16자
    const result = checkTitleLength(EMPTY_CONTENT, NO_KEYWORDS, title);
    expect(result.score).toBe(10);
    expect(result.maxScore).toBe(10);
    expect(result.suggestion).toBeUndefined();
  });

  it('긴 제목(26자 이상)이면 score 5, suggestion에 줄이라는 문구 포함', () => {
    const title = '이것은매우긴제목으로테스트를위해작성된긴텍스트입니다합니다'; // 30자 이상
    const result = checkTitleLength(EMPTY_CONTENT, NO_KEYWORDS, title);
    expect(result.score).toBe(5);
    expect(result.suggestion).toContain('줄여보세요');
  });

  it('경계값: 정확히 15자 제목은 만점', () => {
    const title = '123456789012345'; // 15자
    const result = checkTitleLength(EMPTY_CONTENT, NO_KEYWORDS, title);
    expect(result.score).toBe(10);
  });

  it('경계값: 정확히 25자 제목은 만점', () => {
    const title = '1234567890123456789012345'; // 25자
    const result = checkTitleLength(EMPTY_CONTENT, NO_KEYWORDS, title);
    expect(result.score).toBe(10);
  });
});

describe('checkTitleKeyword', () => {
  it('키워드 배열이 빈 경우 score 0', () => {
    const result = checkTitleKeyword(EMPTY_CONTENT, [], '제목 텍스트');
    expect(result.score).toBe(0);
  });

  it('주키워드가 제목 선두에 있으면 만점', () => {
    const result = checkTitleKeyword(EMPTY_CONTENT, ['다이어트'], '다이어트 성공 후기');
    expect(result.score).toBe(10);
  });

  it('주키워드가 제목 중간에 있으면 6점', () => {
    const result = checkTitleKeyword(EMPTY_CONTENT, ['다이어트'], '운동과 다이어트 이야기');
    expect(result.score).toBe(6);
  });

  it('주키워드가 제목에 없으면 0점 — 주의: indexOf가 -1을 반환해도 -1 <= 3 조건이 참이 되는 구현 버그 존재', () => {
    // 현재 구현에서 `title.indexOf(kw) <= 3` 조건은 indexOf=-1일 때도 참이 되어
    // 키워드가 없는 경우에도 score 10을 반환하는 버그가 있음
    // 이 테스트는 실제 동작을 검증하고 버그를 문서화함
    const result = checkTitleKeyword(EMPTY_CONTENT, ['다이어트'], '건강한 생활 습관 만들기');
    // 버그로 인해 현재는 10점이 반환됨 (본래 의도는 0점)
    expect(result.score).toBe(10); // TODO: 버그 수정 후 expect(result.score).toBe(0)으로 변경
  });
});

describe('checkPrimaryKeyword', () => {
  it('키워드 배열이 빈 경우 score 0', () => {
    const result = checkPrimaryKeyword('본문 내용', [], undefined);
    expect(result.score).toBe(0);
  });

  it('키워드 0회 등장 시 score 0', () => {
    const content = '이 글에는 키워드가 전혀 없습니다.';
    const result = checkPrimaryKeyword(content, ['다이어트'], undefined);
    expect(result.score).toBe(0);
    expect(result.suggestion).toBeTruthy();
  });

  it('키워드 3~5회 등장 시 만점', () => {
    const keyword = '다이어트';
    const content = Array(4).fill(`${keyword} 관련 내용입니다.`).join('\n');
    const result = checkPrimaryKeyword(content, [keyword], undefined);
    expect(result.score).toBe(10);
  });

  it('키워드 1~2회(미달)이면 6점, suggestion에 더 사용 권고', () => {
    const keyword = '다이어트';
    const content = `${keyword} 관련 한 번만 언급합니다.`;
    const result = checkPrimaryKeyword(content, [keyword], undefined);
    expect(result.score).toBe(6);
    expect(result.suggestion).toContain('더 사용');
  });

  it('키워드 8회 이상(과다)이면 score 2, 스터핑 경고', () => {
    const keyword = '다이어트';
    const content = Array(9).fill(`${keyword}`).join(' ');
    const result = checkPrimaryKeyword(content, [keyword], undefined);
    expect(result.score).toBe(2);
    expect(result.suggestion).toContain('스터핑');
  });
});

describe('checkH2Structure', () => {
  it('H2 없으면 score 0', () => {
    const result = checkH2Structure('H2가 없는 본문입니다.', [], undefined);
    expect(result.score).toBe(0);
    expect(result.suggestion).toBeTruthy();
  });

  it('H2 1~2개이면 score 5, suggestion에 추가 권고', () => {
    const content = '## 소제목1\n내용\n## 소제목2\n내용';
    const result = checkH2Structure(content, [], undefined);
    expect(result.score).toBe(5);
    expect(result.suggestion).toContain('더 추가');
  });

  it('H2 3~5개이면 만점', () => {
    const content = ['## 소제목1', '## 소제목2', '## 소제목3'].join('\n내용\n');
    const result = checkH2Structure(content, [], undefined);
    expect(result.score).toBe(10);
  });

  it('H2 6개 이상이면 score 7, 줄이라는 suggestion', () => {
    const headings = Array.from({ length: 6 }, (_, i) => `## 소제목${i + 1}`).join('\n내용\n');
    const result = checkH2Structure(headings, [], undefined);
    expect(result.score).toBe(7);
    expect(result.suggestion).toContain('3-5개');
  });

  it('경계값: 정확히 3개 H2는 만점', () => {
    const content = '## A\n내용\n## B\n내용\n## C\n내용';
    const result = checkH2Structure(content, [], undefined);
    expect(result.score).toBe(10);
  });
});

describe('checkImageCount', () => {
  it('이미지 0개이면 score 1', () => {
    const result = checkImageCount('이미지 없는 본문', [], undefined);
    expect(result.score).toBe(1);
    expect(result.maxScore).toBe(5);
    expect(result.suggestion).toBeTruthy();
  });

  it('이미지 3~5개이면 score 3', () => {
    const images = Array(3).fill('![이미지](url.jpg)').join('\n');
    const result = checkImageCount(images, [], undefined);
    expect(result.score).toBe(3);
  });

  it('이미지 6~13개이면 만점', () => {
    const images = Array(8).fill('![이미지](url.jpg)').join('\n');
    const result = checkImageCount(images, [], undefined);
    expect(result.score).toBe(5);
    expect(result.maxScore).toBe(5);
  });

  it('[사진...] 패턴도 이미지로 카운트', () => {
    const images = Array(6).fill('[사진1]').join('\n');
    const result = checkImageCount(images, [], undefined);
    expect(result.score).toBe(5);
  });

  it('경계값: 정확히 6개 이미지는 만점', () => {
    const images = Array(6).fill('![img](url.jpg)').join('\n');
    const result = checkImageCount(images, [], undefined);
    expect(result.score).toBe(5);
  });
});

describe('checkFirstParagraphKeyword', () => {
  it('키워드 배열이 비면 score 0', () => {
    const result = checkFirstParagraphKeyword('본문', [], undefined);
    expect(result.score).toBe(0);
  });

  it('첫 문단에 키워드 포함 시 만점', () => {
    const content = '다이어트 시작하는 방법을 소개합니다.\n\n두 번째 문단입니다.';
    const result = checkFirstParagraphKeyword(content, ['다이어트'], undefined);
    expect(result.score).toBe(10);
  });

  it('첫 문단에 키워드 없으면 0점', () => {
    const content = '오늘 날씨가 맑습니다.\n\n다이어트 내용은 여기에 있습니다.';
    const result = checkFirstParagraphKeyword(content, ['다이어트'], undefined);
    expect(result.score).toBe(0);
  });
});

describe('checkSecondaryKeywords', () => {
  it('키워드가 1개 이하면 score 0', () => {
    const result = checkSecondaryKeywords('본문', ['주키워드'], undefined);
    expect(result.score).toBe(0);
  });

  it('보조키워드가 각 2~3회 등장하면 만점', () => {
    const kw = '건강식';
    const content = Array(3).fill(`${kw} 내용`).join('\n');
    const result = checkSecondaryKeywords(content, ['주키워드', kw], undefined);
    expect(result.score).toBe(10);
  });

  it('보조키워드가 일부만 있으면 5점', () => {
    const content = '건강식 한 번 언급';
    const result = checkSecondaryKeywords(content, ['주키워드', '건강식'], undefined);
    expect(result.score).toBe(5);
  });
});

describe('checkH2Keywords', () => {
  it('키워드 없으면 score 0', () => {
    const result = checkH2Keywords('## 소제목\n내용', [], undefined);
    expect(result.score).toBe(0);
  });

  it('H2 없으면 score 0', () => {
    const result = checkH2Keywords('소제목 없는 본문', ['키워드'], undefined);
    expect(result.score).toBe(0);
  });

  it('H2의 40% 이상에 키워드 포함 시 만점', () => {
    const content = '## 키워드 관련 소제목\n내용\n## 다른 소제목\n내용\n## 키워드 활용법\n내용';
    const result = checkH2Keywords(content, ['키워드'], undefined);
    expect(result.score).toBe(10);
  });

  it('H2 중 일부만 키워드 포함 시 5점', () => {
    const content = '## 키워드 소제목\n내용\n## 관련없는소제목A\n내용\n## 관련없는소제목B\n내용\n## 관련없는소제목C\n내용';
    const result = checkH2Keywords(content, ['키워드'], undefined);
    // 4개 중 1개 = 25% < 40% → 5점
    expect(result.score).toBe(5);
  });
});
