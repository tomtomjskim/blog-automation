import type { SeoAnalysis } from './types';

export function analyzeSEO(content: string, keywords: string[] = []): SeoAnalysis {
  const analysis: SeoAnalysis = { score: 0, maxScore: 100, items: [] };

  // 제목 분석
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : '';

  if (title.length >= 10 && title.length <= 60) {
    analysis.items.push({ name: '제목 길이', status: 'good', message: `적절한 길이 (${title.length}자)`, score: 10 });
    analysis.score += 10;
  } else if (title.length > 0) {
    analysis.items.push({ name: '제목 길이', status: 'warning', message: `${title.length}자 (10-60자 권장)`, score: 5 });
    analysis.score += 5;
  } else {
    analysis.items.push({ name: '제목 길이', status: 'error', message: '제목이 없습니다', score: 0 });
  }

  // 키워드 포함 여부
  if (keywords.length > 0) {
    const keywordInTitle = keywords.some(k => title.toLowerCase().includes(k.toLowerCase()));
    if (keywordInTitle) {
      analysis.items.push({ name: '제목 키워드', status: 'good', message: '키워드가 제목에 포함됨', score: 10 });
      analysis.score += 10;
    } else {
      analysis.items.push({ name: '제목 키워드', status: 'warning', message: '제목에 키워드 추가 권장', score: 5 });
      analysis.score += 5;
    }
  }

  // 본문 길이
  const charCount = content.replace(/[#\s\n]/g, '').length;
  if (charCount >= 500) {
    analysis.items.push({ name: '본문 길이', status: 'good', message: `충분한 길이 (${charCount}자)`, score: 20 });
    analysis.score += 20;
  } else {
    analysis.items.push({ name: '본문 길이', status: 'warning', message: `${charCount}자 (500자 이상 권장)`, score: 10 });
    analysis.score += 10;
  }

  // 소제목 사용
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)];
  if (headings.length >= 3) {
    analysis.items.push({ name: '구조화', status: 'good', message: `소제목 ${headings.length}개 사용`, score: 15 });
    analysis.score += 15;
  } else if (headings.length > 0) {
    analysis.items.push({ name: '구조화', status: 'warning', message: `소제목 ${headings.length}개 (3개 이상 권장)`, score: 8 });
    analysis.score += 8;
  } else {
    analysis.items.push({ name: '구조화', status: 'error', message: '소제목 없음', score: 0 });
  }

  // 키워드 밀도
  if (keywords.length > 0) {
    const contentLower = content.toLowerCase();
    const keywordCount = keywords.reduce((acc, k) => {
      return acc + (contentLower.match(new RegExp(k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    }, 0);
    const density = Number((keywordCount / (charCount / 100)).toFixed(1));

    if (density >= 1 && density <= 3) {
      analysis.items.push({ name: '키워드 밀도', status: 'good', message: `${density}% (적절)`, score: 15 });
      analysis.score += 15;
    } else if (density > 0) {
      analysis.items.push({ name: '키워드 밀도', status: 'warning', message: `${density}% (1-3% 권장)`, score: 8 });
      analysis.score += 8;
    } else {
      analysis.items.push({ name: '키워드 밀도', status: 'error', message: '키워드 미포함', score: 0 });
    }
  }

  // 문단 구분
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 5) {
    analysis.items.push({ name: '문단 구분', status: 'good', message: `${paragraphs.length}개 문단`, score: 10 });
    analysis.score += 10;
  } else {
    analysis.items.push({ name: '문단 구분', status: 'warning', message: `${paragraphs.length}개 문단 (5개 이상 권장)`, score: 5 });
    analysis.score += 5;
  }

  // 이모지 사용
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 3 && emojiCount <= 10) {
    analysis.items.push({ name: '이모지 사용', status: 'good', message: `${emojiCount}개 (적절)`, score: 10 });
    analysis.score += 10;
  } else if (emojiCount > 0) {
    analysis.items.push({ name: '이모지 사용', status: 'info', message: `${emojiCount}개`, score: 5 });
    analysis.score += 5;
  }

  return analysis;
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
