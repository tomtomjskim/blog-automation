import type { SeoAnalysis } from '@/lib/types';

/** 네이버 SEO 개선 제안 생성 */
export function generateNaverSEOSuggestions(analysis: SeoAnalysis): string[] {
  return analysis.suggestions || [];
}
