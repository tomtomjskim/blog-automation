import type { SeoAnalysis } from '@/lib/types';
import { checkTitleLength, checkTitleKeyword } from './checkers/title';
import { checkContentLength, checkParagraphLength } from './checkers/content';
import { checkH2Structure } from './checkers/structure';
import {
  checkPrimaryKeyword,
  checkSecondaryKeywords,
  checkFirstParagraphKeyword,
  checkH2Keywords,
} from './checkers/keywords';
import { checkImageCount } from './checkers/media';

type SeoItemStatus = 'good' | 'warning' | 'error' | 'info';

function scoreToStatus(score: number, maxScore: number, name: string, content: string): SeoItemStatus {
  // 이미지 수는 최하점이 info (원본 동작 유지)
  if (name === '이미지 수') {
    const imageCount =
      (content.match(/!\[.*?\]\(.*?\)/g) || []).length + (content.match(/\[사진.*?\]/g) || []).length;
    if (imageCount >= 6) return 'good';
    if (imageCount >= 3) return 'warning';
    return 'info';
  }
  if (score === maxScore) return 'good';
  if (score > 0 && score >= maxScore * 0.5) return 'warning';
  if (score > 0) return 'error';
  return 'error';
}

/** good 상태일 때 표시할 메시지 (원본 메시지 재현) */
function buildGoodMessage(name: string, content: string, keywords: string[], title: string): string {
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)];
  const bodyText = content
    .replace(/^#\s+.+$/m, '')
    .replace(/^##\s+.+$/gm, '')
    .replace(/[#*_`\[\]()!]/g, '')
    .trim();
  const charCount = bodyText.replace(/\s/g, '').length;
  const imageCount =
    (content.match(/!\[.*?\]\(.*?\)/g) || []).length + (content.match(/\[사진.*?\]/g) || []).length;
  const paragraphs = bodyText.split(/\n\n+/).filter((p) => p.trim().length > 30);

  switch (name) {
    case '제목 길이':    return `${title.length}자 (최적)`;
    case '제목 키워드': return '키워드 선두 배치됨';
    case '본문 길이':   return `${charCount.toLocaleString()}자 (충분)`;
    case 'H2 구조':     return `소제목 ${headings.length}개 (최적)`;
    case '주키워드 빈도': {
      const primaryKw = keywords[0]?.toLowerCase() || '';
      const cnt = (
        bodyText.toLowerCase().match(new RegExp(primaryKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
      ).length;
      return `${cnt}회 (최적)`;
    }
    case '보조키워드': {
      const secondaryKws = keywords.slice(1);
      let secondaryScore = 0;
      for (const kw of secondaryKws) {
        const cnt = (
          bodyText.toLowerCase().match(new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
        ).length;
        if (cnt >= 2 && cnt <= 3) secondaryScore++;
      }
      return `${secondaryKws.length}개 중 ${secondaryScore}개 최적`;
    }
    case '첫문단 키워드': return '첫 문단에 키워드 포함';
    case 'H2 키워드': {
      const headingsWithKw = headings.filter((h) =>
        keywords.some((k) => h[1].toLowerCase().includes(k.toLowerCase())),
      );
      return `${headingsWithKw.length}/${headings.length} 소제목에 키워드`;
    }
    case '문단 길이':  return `${paragraphs.length}개 문단, 가독성 좋음`;
    case '이미지 수':  return `${imageCount}장 (최적)`;
    default: return `${name} 최적`;
  }
}

/** warning/error 상태일 때 표시할 메시지 (원본 메시지 재현) */
function buildNonGoodMessage(
  name: string,
  score: number,
  maxScore: number,
  content: string,
  keywords: string[],
  title: string,
  suggestion?: string,
): string {
  const bodyText = content
    .replace(/^#\s+.+$/m, '')
    .replace(/^##\s+.+$/gm, '')
    .replace(/[#*_`\[\]()!]/g, '')
    .trim();
  const charCount = bodyText.replace(/\s/g, '').length;
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)];
  const imageCount =
    (content.match(/!\[.*?\]\(.*?\)/g) || []).length + (content.match(/\[사진.*?\]/g) || []).length;
  const headingsWithKw =
    keywords.length > 0
      ? headings.filter((h) => keywords.some((k) => h[1].toLowerCase().includes(k.toLowerCase())))
      : [];

  switch (name) {
    case '제목 길이':   return score > 0 ? `${title.length}자 (15-25자 권장)` : '제목이 없습니다';
    case '제목 키워드': return score > 0 ? '키워드 포함 (선두 권장)' : '제목에 키워드 없음';
    case '본문 길이':   return score > 3 ? `${charCount.toLocaleString()}자 (2000자+ 권장)` : `${charCount.toLocaleString()}자 (부족)`;
    case 'H2 구조':
      if (headings.length > 5) return `소제목 ${headings.length}개 (3-5개 권장)`;
      if (headings.length > 0) return `소제목 ${headings.length}개 (3개 이상 권장)`;
      return '소제목 없음';
    case '주키워드 빈도': {
      const primaryKw = keywords[0]?.toLowerCase() || '';
      const cnt = (
        bodyText.toLowerCase().match(new RegExp(primaryKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
      ).length;
      if (cnt > 7) return `${cnt}회 (키워드 스터핑 주의)`;
      if (cnt > 0) return `${cnt}회 (3-5회 권장)`;
      return '주키워드 미사용';
    }
    case '보조키워드': return score > 0 ? '보조키워드 빈도 조정 필요' : '보조키워드 미사용';
    case '첫문단 키워드': return '첫 문단에 키워드 없음';
    case 'H2 키워드':
      return headingsWithKw.length > 0
        ? `${headingsWithKw.length}/${headings.length} 소제목에 키워드`
        : '소제목에 키워드 없음';
    case '문단 길이':  return '일부 문단이 너무 길거나 짧음';
    case '이미지 수':  return `${imageCount}장 (${imageCount >= 3 ? '6-13장 권장' : '6장+ 권장'})`;
    default: return suggestion || `${name} 개선 필요`;
  }
}

/** 네이버 C-Rank/D.I.A. 최적화 SEO 분석 오케스트레이터 (100점 만점) */
export function analyzeNaverSEO(content: string, keywords: string[] = []): SeoAnalysis {
  const analysis: SeoAnalysis = { score: 0, maxScore: 100, items: [], suggestions: [] };
  const suggestions: string[] = [];

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // (checker, requiresKeywords, minKeywords)
  const checkerDefs: Array<{
    fn: (content: string, keywords: string[], title?: string) => { name: string; score: number; maxScore: number; suggestion?: string };
    requiresKeywords: boolean;
    minKeywords: number;
  }> = [
    { fn: checkTitleLength,           requiresKeywords: false, minKeywords: 0 },
    { fn: checkTitleKeyword,          requiresKeywords: true,  minKeywords: 1 },
    { fn: checkContentLength,         requiresKeywords: false, minKeywords: 0 },
    { fn: checkH2Structure,           requiresKeywords: false, minKeywords: 0 },
    { fn: checkPrimaryKeyword,        requiresKeywords: true,  minKeywords: 1 },
    { fn: checkSecondaryKeywords,     requiresKeywords: true,  minKeywords: 2 },
    { fn: checkFirstParagraphKeyword, requiresKeywords: true,  minKeywords: 1 },
    { fn: checkH2Keywords,            requiresKeywords: true,  minKeywords: 1 },
    { fn: checkParagraphLength,       requiresKeywords: false, minKeywords: 0 },
    { fn: checkImageCount,            requiresKeywords: false, minKeywords: 0 },
  ];

  for (const { fn, requiresKeywords, minKeywords } of checkerDefs) {
    if (requiresKeywords && keywords.length < minKeywords) continue;

    const result = fn(content, keywords, title);
    const isGood = result.score === result.maxScore;
    const status = scoreToStatus(result.score, result.maxScore, result.name, content);

    const message = isGood
      ? buildGoodMessage(result.name, content, keywords, title)
      : buildNonGoodMessage(result.name, result.score, result.maxScore, content, keywords, title, result.suggestion);

    analysis.items.push({ name: result.name, status, message, score: result.score });
    analysis.score += result.score;

    if (result.suggestion && !isGood) {
      suggestions.push(result.suggestion);
    }
  }

  analysis.suggestions = suggestions;
  return analysis;
}
