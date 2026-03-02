import type { SeoAnalysis } from './types';

/** 네이버 C-Rank/D.I.A. 최적화 SEO 분석 (100점 만점) */
export function analyzeNaverSEO(content: string, keywords: string[] = []): SeoAnalysis {
  const analysis: SeoAnalysis = { score: 0, maxScore: 100, items: [], suggestions: [] };
  const suggestions: string[] = [];

  // 제목 추출
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const bodyText = content.replace(/^#\s+.+$/m, '').replace(/^##\s+.+$/gm, '').replace(/[#*_`\[\]()!]/g, '').trim();
  const charCount = bodyText.replace(/\s/g, '').length;

  // 1. 제목 길이 15-25자 (10점)
  if (title.length >= 15 && title.length <= 25) {
    analysis.items.push({ name: '제목 길이', status: 'good', message: `${title.length}자 (최적)`, score: 10 });
    analysis.score += 10;
  } else if (title.length > 0 && title.length < 15) {
    analysis.items.push({ name: '제목 길이', status: 'warning', message: `${title.length}자 (15-25자 권장)`, score: 5 });
    analysis.score += 5;
    suggestions.push(`제목을 ${15 - title.length}자 더 늘려보세요 (현재 ${title.length}자)`);
  } else if (title.length > 25) {
    analysis.items.push({ name: '제목 길이', status: 'warning', message: `${title.length}자 (15-25자 권장)`, score: 5 });
    analysis.score += 5;
    suggestions.push(`제목을 ${title.length - 25}자 줄여보세요 (현재 ${title.length}자)`);
  } else {
    analysis.items.push({ name: '제목 길이', status: 'error', message: '제목이 없습니다', score: 0 });
    suggestions.push('# 마크다운으로 제목을 추가하세요');
  }

  // 2. 제목 키워드 선두 배치 (10점)
  if (keywords.length > 0) {
    const firstKeyword = keywords[0];
    if (title.toLowerCase().startsWith(firstKeyword.toLowerCase()) || title.toLowerCase().indexOf(firstKeyword.toLowerCase()) <= 3) {
      analysis.items.push({ name: '제목 키워드', status: 'good', message: '키워드 선두 배치됨', score: 10 });
      analysis.score += 10;
    } else if (title.toLowerCase().includes(firstKeyword.toLowerCase())) {
      analysis.items.push({ name: '제목 키워드', status: 'warning', message: '키워드 포함 (선두 권장)', score: 6 });
      analysis.score += 6;
      suggestions.push('제목 앞부분에 주키워드를 배치하면 SEO에 유리합니다');
    } else {
      analysis.items.push({ name: '제목 키워드', status: 'error', message: '제목에 키워드 없음', score: 0 });
      suggestions.push('제목에 주키워드를 포함하세요');
    }
  }

  // 3. 본문 길이 2000자+ (15점)
  if (charCount >= 2000) {
    analysis.items.push({ name: '본문 길이', status: 'good', message: `${charCount.toLocaleString()}자 (충분)`, score: 15 });
    analysis.score += 15;
  } else if (charCount >= 1000) {
    analysis.items.push({ name: '본문 길이', status: 'warning', message: `${charCount.toLocaleString()}자 (2000자+ 권장)`, score: 8 });
    analysis.score += 8;
    suggestions.push(`본문을 ${(2000 - charCount).toLocaleString()}자 더 작성하면 네이버 상위노출에 유리합니다`);
  } else {
    analysis.items.push({ name: '본문 길이', status: 'error', message: `${charCount.toLocaleString()}자 (부족)`, score: 3 });
    analysis.score += 3;
    suggestions.push('네이버 상위노출을 위해 최소 2000자 이상 작성하세요');
  }

  // 4. H2 구조 3-5개 (10점)
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)];
  if (headings.length >= 3 && headings.length <= 5) {
    analysis.items.push({ name: 'H2 구조', status: 'good', message: `소제목 ${headings.length}개 (최적)`, score: 10 });
    analysis.score += 10;
  } else if (headings.length > 5) {
    analysis.items.push({ name: 'H2 구조', status: 'warning', message: `소제목 ${headings.length}개 (3-5개 권장)`, score: 7 });
    analysis.score += 7;
    suggestions.push('소제목이 많습니다. 관련 섹션을 병합하여 3-5개로 줄여보세요');
  } else if (headings.length > 0) {
    analysis.items.push({ name: 'H2 구조', status: 'warning', message: `소제목 ${headings.length}개 (3개 이상 권장)`, score: 5 });
    analysis.score += 5;
    suggestions.push(`소제목을 ${3 - headings.length}개 더 추가하여 글을 구조화하세요`);
  } else {
    analysis.items.push({ name: 'H2 구조', status: 'error', message: '소제목 없음', score: 0 });
    suggestions.push('## 소제목으로 글을 3-5개 섹션으로 나누세요');
  }

  // 5. 주키워드 빈도 3-5회 (10점)
  if (keywords.length > 0) {
    const primaryKw = keywords[0].toLowerCase();
    const primaryCount = (bodyText.toLowerCase().match(new RegExp(primaryKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (primaryCount >= 3 && primaryCount <= 5) {
      analysis.items.push({ name: '주키워드 빈도', status: 'good', message: `${primaryCount}회 (최적)`, score: 10 });
      analysis.score += 10;
    } else if (primaryCount >= 1 && primaryCount <= 7) {
      analysis.items.push({ name: '주키워드 빈도', status: 'warning', message: `${primaryCount}회 (3-5회 권장)`, score: 6 });
      analysis.score += 6;
      if (primaryCount < 3) suggestions.push(`주키워드 "${keywords[0]}"를 ${3 - primaryCount}회 더 사용하세요`);
      if (primaryCount > 5) suggestions.push(`주키워드 "${keywords[0]}" 사용이 ${primaryCount}회로 과다합니다. 5회 이하로 줄이세요`);
    } else if (primaryCount > 7) {
      analysis.items.push({ name: '주키워드 빈도', status: 'error', message: `${primaryCount}회 (키워드 스터핑 주의)`, score: 2 });
      analysis.score += 2;
      suggestions.push(`주키워드 스터핑 위험! "${keywords[0]}" 사용을 5회 이하로 줄이세요`);
    } else {
      analysis.items.push({ name: '주키워드 빈도', status: 'error', message: '주키워드 미사용', score: 0 });
      suggestions.push(`주키워드 "${keywords[0]}"를 본문에 3-5회 포함하세요`);
    }
  }

  // 6. 보조키워드 빈도 2-3회 (10점)
  if (keywords.length > 1) {
    const secondaryKws = keywords.slice(1);
    let secondaryScore = 0;
    let secondaryTotal = 0;
    for (const kw of secondaryKws) {
      const count = (bodyText.toLowerCase().match(new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      secondaryTotal += count;
      if (count >= 2 && count <= 3) secondaryScore++;
    }
    const ratio = secondaryScore / secondaryKws.length;
    if (ratio >= 0.5) {
      analysis.items.push({ name: '보조키워드', status: 'good', message: `${secondaryKws.length}개 중 ${secondaryScore}개 최적`, score: 10 });
      analysis.score += 10;
    } else if (secondaryTotal > 0) {
      analysis.items.push({ name: '보조키워드', status: 'warning', message: `보조키워드 빈도 조정 필요`, score: 5 });
      analysis.score += 5;
      suggestions.push('보조키워드를 각 2-3회씩 자연스럽게 포함하세요');
    } else {
      analysis.items.push({ name: '보조키워드', status: 'error', message: '보조키워드 미사용', score: 0 });
      suggestions.push('보조키워드를 각 2-3회씩 포함하세요');
    }
  }

  // 7. 첫 문단 키워드 포함 (10점)
  if (keywords.length > 0) {
    const firstParagraph = bodyText.split(/\n\n/)[0] || '';
    const hasKeywordInFirst = keywords.some(k => firstParagraph.toLowerCase().includes(k.toLowerCase()));
    if (hasKeywordInFirst) {
      analysis.items.push({ name: '첫문단 키워드', status: 'good', message: '첫 문단에 키워드 포함', score: 10 });
      analysis.score += 10;
    } else {
      analysis.items.push({ name: '첫문단 키워드', status: 'error', message: '첫 문단에 키워드 없음', score: 0 });
      suggestions.push('도입부(첫 문단)에 주키워드를 자연스럽게 포함하세요');
    }
  }

  // 8. H2 내 키워드 포함 (10점)
  if (keywords.length > 0 && headings.length > 0) {
    const headingsWithKw = headings.filter(h => keywords.some(k => h[1].toLowerCase().includes(k.toLowerCase())));
    const ratio = headingsWithKw.length / headings.length;
    if (ratio >= 0.4) {
      analysis.items.push({ name: 'H2 키워드', status: 'good', message: `${headingsWithKw.length}/${headings.length} 소제목에 키워드`, score: 10 });
      analysis.score += 10;
    } else if (headingsWithKw.length > 0) {
      analysis.items.push({ name: 'H2 키워드', status: 'warning', message: `${headingsWithKw.length}/${headings.length} 소제목에 키워드`, score: 5 });
      analysis.score += 5;
      suggestions.push('더 많은 소제목에 키워드나 관련어를 포함하세요');
    } else {
      analysis.items.push({ name: 'H2 키워드', status: 'error', message: '소제목에 키워드 없음', score: 0 });
      suggestions.push('최소 1-2개 소제목에 키워드를 포함하세요');
    }
  }

  // 9. 문단 길이 100-200자 (10점)
  const paragraphs = bodyText.split(/\n\n+/).filter(p => p.trim().length > 30);
  if (paragraphs.length > 0) {
    const optimalParagraphs = paragraphs.filter(p => {
      const len = p.replace(/\s/g, '').length;
      return len >= 80 && len <= 250;
    });
    const ratio = optimalParagraphs.length / paragraphs.length;
    if (ratio >= 0.6) {
      analysis.items.push({ name: '문단 길이', status: 'good', message: `${paragraphs.length}개 문단, 가독성 좋음`, score: 10 });
      analysis.score += 10;
    } else {
      analysis.items.push({ name: '문단 길이', status: 'warning', message: '일부 문단이 너무 길거나 짧음', score: 5 });
      analysis.score += 5;
      suggestions.push('문단을 100-200자 단위로 나누면 모바일 가독성이 좋아집니다');
    }
  }

  // 10. 이미지 권장 수 (5점)
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length + (content.match(/\[사진.*?\]/g) || []).length;
  if (imageCount >= 6 && imageCount <= 13) {
    analysis.items.push({ name: '이미지 수', status: 'good', message: `${imageCount}장 (최적)`, score: 5 });
    analysis.score += 5;
  } else if (imageCount >= 3) {
    analysis.items.push({ name: '이미지 수', status: 'warning', message: `${imageCount}장 (6-13장 권장)`, score: 3 });
    analysis.score += 3;
    suggestions.push(`이미지를 ${6 - imageCount > 0 ? 6 - imageCount : 0}장 더 추가하면 체류 시간이 늘어납니다`);
  } else {
    analysis.items.push({ name: '이미지 수', status: 'info', message: `${imageCount}장 (6장+ 권장)`, score: 1 });
    analysis.score += 1;
    suggestions.push('이미지를 6장 이상 추가하면 네이버 D.I.A. 점수에 유리합니다');
  }

  analysis.suggestions = suggestions;
  return analysis;
}

/** 네이버 SEO 개선 제안 생성 */
export function generateNaverSEOSuggestions(analysis: SeoAnalysis): string[] {
  return analysis.suggestions || [];
}

/** 결과 텍스트에서 제목/본문/메타 파싱 */
export function parseResult(content: string) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '제목 없음';
  const body = content.replace(/^#\s+.+$/m, '').trim();
  const charCount = content.replace(/[#\s\n]/g, '').length;
  const readTime = Math.ceil(charCount / 500);
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map(m => m[1]);

  return { title, body, content, charCount, readTime, headings };
}

/** 하위 호환: 기존 analyzeSEO를 analyzeNaverSEO로 리다이렉트 */
export const analyzeSEO = analyzeNaverSEO;
