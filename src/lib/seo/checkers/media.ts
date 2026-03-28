import type { SeoChecker } from './title';

/** 이미지 수 체크: 6-13장 최적 (5점) */
export const checkImageCount: SeoChecker = (content, _keywords, _title) => {
  const imageCount =
    (content.match(/!\[.*?\]\(.*?\)/g) || []).length + (content.match(/\[사진.*?\]/g) || []).length;

  if (imageCount >= 6 && imageCount <= 13) {
    return { name: '이미지 수', score: 5, maxScore: 5 };
  } else if (imageCount >= 3) {
    return {
      name: '이미지 수',
      score: 3,
      maxScore: 5,
      suggestion: `이미지를 ${6 - imageCount > 0 ? 6 - imageCount : 0}장 더 추가하면 체류 시간이 늘어납니다`,
    };
  }
  return {
    name: '이미지 수',
    score: 1,
    maxScore: 5,
    suggestion: '이미지를 6장 이상 추가하면 네이버 D.I.A. 점수에 유리합니다',
  };
};
