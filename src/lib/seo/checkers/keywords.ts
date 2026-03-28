import type { SeoChecker } from './title';

function extractBodyText(content: string): string {
  return content
    .replace(/^#\s+.+$/m, '')
    .replace(/^##\s+.+$/gm, '')
    .replace(/[#*_`\[\]()!]/g, '')
    .trim();
}

/** 주키워드 빈도 3-5회 체크 (10점) */
export const checkPrimaryKeyword: SeoChecker = (content, keywords, _title) => {
  if (keywords.length === 0) return { name: '주키워드 빈도', score: 0, maxScore: 10 };

  const bodyText = extractBodyText(content);
  const primaryKw = keywords[0].toLowerCase();
  const primaryCount = (
    bodyText.toLowerCase().match(new RegExp(primaryKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
  ).length;

  if (primaryCount >= 3 && primaryCount <= 5) {
    return { name: '주키워드 빈도', score: 10, maxScore: 10 };
  } else if (primaryCount >= 1 && primaryCount <= 7) {
    const suggestion =
      primaryCount < 3
        ? `주키워드 "${keywords[0]}"를 ${3 - primaryCount}회 더 사용하세요`
        : `주키워드 "${keywords[0]}" 사용이 ${primaryCount}회로 과다합니다. 5회 이하로 줄이세요`;
    return { name: '주키워드 빈도', score: 6, maxScore: 10, suggestion };
  } else if (primaryCount > 7) {
    return {
      name: '주키워드 빈도',
      score: 2,
      maxScore: 10,
      suggestion: `주키워드 스터핑 위험! "${keywords[0]}" 사용을 5회 이하로 줄이세요`,
    };
  }
  return {
    name: '주키워드 빈도',
    score: 0,
    maxScore: 10,
    suggestion: `주키워드 "${keywords[0]}"를 본문에 3-5회 포함하세요`,
  };
};

/** 보조키워드 빈도 2-3회 체크 (10점) */
export const checkSecondaryKeywords: SeoChecker = (content, keywords, _title) => {
  if (keywords.length <= 1) return { name: '보조키워드', score: 0, maxScore: 10 };

  const bodyText = extractBodyText(content);
  const secondaryKws = keywords.slice(1);
  let secondaryScore = 0;
  let secondaryTotal = 0;

  for (const kw of secondaryKws) {
    const count = (
      bodyText.toLowerCase().match(new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
    ).length;
    secondaryTotal += count;
    if (count >= 2 && count <= 3) secondaryScore++;
  }

  const ratio = secondaryScore / secondaryKws.length;
  if (ratio >= 0.5) {
    return { name: '보조키워드', score: 10, maxScore: 10 };
  } else if (secondaryTotal > 0) {
    return {
      name: '보조키워드',
      score: 5,
      maxScore: 10,
      suggestion: '보조키워드를 각 2-3회씩 자연스럽게 포함하세요',
    };
  }
  return { name: '보조키워드', score: 0, maxScore: 10, suggestion: '보조키워드를 각 2-3회씩 포함하세요' };
};

/** 첫 문단 키워드 포함 체크 (10점) */
export const checkFirstParagraphKeyword: SeoChecker = (content, keywords, _title) => {
  if (keywords.length === 0) return { name: '첫문단 키워드', score: 0, maxScore: 10 };

  const bodyText = extractBodyText(content);
  const firstParagraph = bodyText.split(/\n\n/)[0] || '';
  const hasKeywordInFirst = keywords.some((k) => firstParagraph.toLowerCase().includes(k.toLowerCase()));

  if (hasKeywordInFirst) {
    return { name: '첫문단 키워드', score: 10, maxScore: 10 };
  }
  return {
    name: '첫문단 키워드',
    score: 0,
    maxScore: 10,
    suggestion: '도입부(첫 문단)에 주키워드를 자연스럽게 포함하세요',
  };
};

/** H2 소제목 내 키워드 포함 체크 (10점) */
export const checkH2Keywords: SeoChecker = (content, keywords, _title) => {
  if (keywords.length === 0) return { name: 'H2 키워드', score: 0, maxScore: 10 };

  const headings = [...content.matchAll(/^##\s+(.+)$/gm)];
  if (headings.length === 0) return { name: 'H2 키워드', score: 0, maxScore: 10 };

  const headingsWithKw = headings.filter((h) =>
    keywords.some((k) => h[1].toLowerCase().includes(k.toLowerCase())),
  );
  const ratio = headingsWithKw.length / headings.length;

  if (ratio >= 0.4) {
    return { name: 'H2 키워드', score: 10, maxScore: 10 };
  } else if (headingsWithKw.length > 0) {
    return {
      name: 'H2 키워드',
      score: 5,
      maxScore: 10,
      suggestion: '더 많은 소제목에 키워드나 관련어를 포함하세요',
    };
  }
  return { name: 'H2 키워드', score: 0, maxScore: 10, suggestion: '최소 1-2개 소제목에 키워드를 포함하세요' };
};
