import type { SeoAnalysis } from './types';

/** 네이버 C-Rank/D.I.A. 최적화 SEO 분석 (100점 만점)
 *
 * 배점 구성:
 *   제목 길이        8점
 *   제목 키워드      7점
 *   본문 길이       10점
 *   H2 구조         8점
 *   주키워드 밀도    8점
 *   보조키워드       8점
 *   첫문단 키워드    8점
 *   H2 키워드        8점
 *   문단 길이        5점
 *   이미지 수       10점
 *   이미지 alt 키워드 5점
 *   CTA 유도        5점
 *   문장 시작 다양성 5점
 *   도입부 훅        5점
 *   합계           100점
 */
export function analyzeNaverSEO(content: string, keywords: string[] = []): SeoAnalysis {
  const analysis: SeoAnalysis = { score: 0, maxScore: 100, items: [], suggestions: [] };
  const suggestions: string[] = [];

  // 제목 추출
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // 본문 텍스트 (마크다운 기호 제거, 이미지/링크 제외)
  const bodyText = content
    .replace(/^#\s+.+$/m, '')
    .replace(/^##\s+.+$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '') // 이미지 제거
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크 텍스트만 남김
    .replace(/[#*_`]/g, '')
    .trim();
  const charCount = bodyText.replace(/\s/g, '').length;

  // ─── 1. 제목 길이 15-25자 (8점) ─────────────────────────────────────
  if (title.length >= 15 && title.length <= 25) {
    analysis.items.push({ name: '제목 길이', status: 'good', message: `${title.length}자 (최적)`, score: 8 });
    analysis.score += 8;
  } else if (title.length > 0 && title.length < 15) {
    analysis.items.push({ name: '제목 길이', status: 'warning', message: `${title.length}자 (15-25자 권장)`, score: 4 });
    analysis.score += 4;
    suggestions.push(`제목을 ${15 - title.length}자 더 늘려보세요 (현재 ${title.length}자)`);
  } else if (title.length > 25) {
    analysis.items.push({ name: '제목 길이', status: 'warning', message: `${title.length}자 (15-25자 권장)`, score: 4 });
    analysis.score += 4;
    suggestions.push(`제목을 ${title.length - 25}자 줄여보세요 (현재 ${title.length}자)`);
  } else {
    analysis.items.push({ name: '제목 길이', status: 'error', message: '제목이 없습니다', score: 0 });
    suggestions.push('# 마크다운으로 제목을 추가하세요');
  }

  // ─── 2. 제목 키워드 선두 배치 (7점) ──────────────────────────────────
  if (keywords.length > 0) {
    const firstKeyword = keywords[0];
    if (
      title.toLowerCase().startsWith(firstKeyword.toLowerCase()) ||
      title.toLowerCase().indexOf(firstKeyword.toLowerCase()) <= 3
    ) {
      analysis.items.push({ name: '제목 키워드', status: 'good', message: '키워드 선두 배치됨', score: 7 });
      analysis.score += 7;
    } else if (title.toLowerCase().includes(firstKeyword.toLowerCase())) {
      analysis.items.push({ name: '제목 키워드', status: 'warning', message: '키워드 포함 (선두 권장)', score: 4 });
      analysis.score += 4;
      suggestions.push('제목 앞부분에 주키워드를 배치하면 SEO에 유리합니다');
    } else {
      analysis.items.push({ name: '제목 키워드', status: 'error', message: '제목에 키워드 없음', score: 0 });
      suggestions.push('제목에 주키워드를 포함하세요');
    }
  }

  // ─── 3. 본문 길이 2000자+ (10점) ─────────────────────────────────────
  if (charCount >= 2000) {
    analysis.items.push({ name: '본문 길이', status: 'good', message: `${charCount.toLocaleString()}자 (충분)`, score: 10 });
    analysis.score += 10;
  } else if (charCount >= 1000) {
    analysis.items.push({ name: '본문 길이', status: 'warning', message: `${charCount.toLocaleString()}자 (2000자+ 권장)`, score: 6 });
    analysis.score += 6;
    suggestions.push(`본문을 ${(2000 - charCount).toLocaleString()}자 더 작성하면 네이버 상위노출에 유리합니다`);
  } else {
    analysis.items.push({ name: '본문 길이', status: 'error', message: `${charCount.toLocaleString()}자 (부족)`, score: 2 });
    analysis.score += 2;
    suggestions.push('네이버 상위노출을 위해 최소 2000자 이상 작성하세요');
  }

  // ─── 4. H2 구조 3-5개 (8점) ──────────────────────────────────────────
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)];
  if (headings.length >= 3 && headings.length <= 5) {
    analysis.items.push({ name: 'H2 구조', status: 'good', message: `소제목 ${headings.length}개 (최적)`, score: 8 });
    analysis.score += 8;
  } else if (headings.length > 5) {
    analysis.items.push({ name: 'H2 구조', status: 'warning', message: `소제목 ${headings.length}개 (3-5개 권장)`, score: 5 });
    analysis.score += 5;
    suggestions.push('소제목이 많습니다. 관련 섹션을 병합하여 3-5개로 줄여보세요');
  } else if (headings.length > 0) {
    analysis.items.push({ name: 'H2 구조', status: 'warning', message: `소제목 ${headings.length}개 (3개 이상 권장)`, score: 4 });
    analysis.score += 4;
    suggestions.push(`소제목을 ${3 - headings.length}개 더 추가하여 글을 구조화하세요`);
  } else {
    analysis.items.push({ name: 'H2 구조', status: 'error', message: '소제목 없음', score: 0 });
    suggestions.push('## 소제목으로 글을 3-5개 섹션으로 나누세요');
  }

  // ─── 5. 주키워드 밀도 1.0-2.5% (8점) ────────────────────────────────
  // 밀도 = (키워드 글자수 × 출현횟수) / 전체 글자수 × 100
  if (keywords.length > 0) {
    const primaryKw = keywords[0];
    const primaryKwLen = primaryKw.replace(/\s/g, '').length;
    const bodyLower = bodyText.toLowerCase();
    const primaryCount = (
      bodyLower.match(new RegExp(primaryKw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
    ).length;
    const density = charCount > 0 ? (primaryKwLen * primaryCount) / charCount * 100 : 0;
    const densityStr = density.toFixed(2);

    if (density >= 1.0 && density <= 2.5) {
      analysis.items.push({
        name: '주키워드 밀도',
        status: 'good',
        message: `밀도 ${densityStr}% (최적 1.0-2.5%)`,
        score: 8,
      });
      analysis.score += 8;
    } else if (density > 2.5 && density <= 3.0) {
      analysis.items.push({
        name: '주키워드 밀도',
        status: 'warning',
        message: `밀도 ${densityStr}% (스터핑 주의, 2.5% 이하 권장)`,
        score: 4,
      });
      analysis.score += 4;
      suggestions.push(`주키워드 "${primaryKw}" 밀도가 ${densityStr}%입니다. 2.5% 이하로 줄이세요`);
    } else if (density > 3.0) {
      analysis.items.push({
        name: '주키워드 밀도',
        status: 'error',
        message: `밀도 ${densityStr}% (키워드 스터핑!)`,
        score: 0,
      });
      suggestions.push(`주키워드 스터핑 위험! "${primaryKw}" 밀도가 ${densityStr}%입니다. 3% 이하로 줄이세요`);
    } else if (density > 0) {
      analysis.items.push({
        name: '주키워드 밀도',
        status: 'warning',
        message: `밀도 ${densityStr}% (1.0-2.5% 권장)`,
        score: 4,
      });
      analysis.score += 4;
      suggestions.push(`주키워드 "${primaryKw}"를 더 자연스럽게 추가하세요 (현재 밀도 ${densityStr}%)`);
    } else {
      analysis.items.push({ name: '주키워드 밀도', status: 'error', message: '주키워드 미사용', score: 0 });
      suggestions.push(`주키워드 "${primaryKw}"를 본문에 포함하세요 (목표 밀도 1.0-2.5%)`);
    }
  }

  // ─── 6. 보조키워드 빈도 2-3회 (8점) ─────────────────────────────────
  if (keywords.length > 1) {
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
      analysis.items.push({ name: '보조키워드', status: 'good', message: `${secondaryKws.length}개 중 ${secondaryScore}개 최적`, score: 8 });
      analysis.score += 8;
    } else if (secondaryTotal > 0) {
      analysis.items.push({ name: '보조키워드', status: 'warning', message: '보조키워드 빈도 조정 필요', score: 4 });
      analysis.score += 4;
      suggestions.push('보조키워드를 각 2-3회씩 자연스럽게 포함하세요');
    } else {
      analysis.items.push({ name: '보조키워드', status: 'error', message: '보조키워드 미사용', score: 0 });
      suggestions.push('보조키워드를 각 2-3회씩 포함하세요');
    }
  }

  // ─── 7. 첫 문단 키워드 포함 (8점) ────────────────────────────────────
  if (keywords.length > 0) {
    const firstParagraph = bodyText.split(/\n\n/)[0] || '';
    const hasKeywordInFirst = keywords.some(k => firstParagraph.toLowerCase().includes(k.toLowerCase()));
    if (hasKeywordInFirst) {
      analysis.items.push({ name: '첫문단 키워드', status: 'good', message: '첫 문단에 키워드 포함', score: 8 });
      analysis.score += 8;
    } else {
      analysis.items.push({ name: '첫문단 키워드', status: 'error', message: '첫 문단에 키워드 없음', score: 0 });
      suggestions.push('도입부(첫 문단)에 주키워드를 자연스럽게 포함하세요');
    }
  }

  // ─── 8. H2 내 키워드 포함 (8점) ──────────────────────────────────────
  if (keywords.length > 0 && headings.length > 0) {
    const headingsWithKw = headings.filter(h => keywords.some(k => h[1].toLowerCase().includes(k.toLowerCase())));
    const ratio = headingsWithKw.length / headings.length;
    if (ratio >= 0.4) {
      analysis.items.push({ name: 'H2 키워드', status: 'good', message: `${headingsWithKw.length}/${headings.length} 소제목에 키워드`, score: 8 });
      analysis.score += 8;
    } else if (headingsWithKw.length > 0) {
      analysis.items.push({ name: 'H2 키워드', status: 'warning', message: `${headingsWithKw.length}/${headings.length} 소제목에 키워드`, score: 4 });
      analysis.score += 4;
      suggestions.push('더 많은 소제목에 키워드나 관련어를 포함하세요');
    } else {
      analysis.items.push({ name: 'H2 키워드', status: 'error', message: '소제목에 키워드 없음', score: 0 });
      suggestions.push('최소 1-2개 소제목에 키워드를 포함하세요');
    }
  }

  // ─── 9. 문단 길이 100-200자 (5점) ────────────────────────────────────
  const paragraphs = bodyText.split(/\n\n+/).filter(p => p.trim().length > 30);
  if (paragraphs.length > 0) {
    const optimalParagraphs = paragraphs.filter(p => {
      const len = p.replace(/\s/g, '').length;
      return len >= 80 && len <= 250;
    });
    const ratio = optimalParagraphs.length / paragraphs.length;
    if (ratio >= 0.6) {
      analysis.items.push({ name: '문단 길이', status: 'good', message: `${paragraphs.length}개 문단, 가독성 좋음`, score: 5 });
      analysis.score += 5;
    } else {
      analysis.items.push({ name: '문단 길이', status: 'warning', message: '일부 문단이 너무 길거나 짧음', score: 2 });
      analysis.score += 2;
      suggestions.push('문단을 100-200자 단위로 나누면 모바일 가독성이 좋아집니다');
    }
  }

  // ─── 10. 이미지 권장 수 (10점) ───────────────────────────────────────
  const imageMatches = content.match(/!\[.*?\]\(.*?\)/g) || [];
  const naverImageMatches = content.match(/\[사진.*?\]/g) || [];
  const imageCount = imageMatches.length + naverImageMatches.length;

  if (imageCount >= 6 && imageCount <= 13) {
    analysis.items.push({ name: '이미지 수', status: 'good', message: `${imageCount}장 (최적)`, score: 10 });
    analysis.score += 10;
  } else if (imageCount >= 3) {
    analysis.items.push({ name: '이미지 수', status: 'warning', message: `${imageCount}장 (6-13장 권장)`, score: 6 });
    analysis.score += 6;
    suggestions.push(`이미지를 ${Math.max(0, 6 - imageCount)}장 더 추가하면 D.I.A. 체류 시간이 늘어납니다`);
  } else {
    analysis.items.push({ name: '이미지 수', status: 'info', message: `${imageCount}장 (6장+ 권장)`, score: 2 });
    analysis.score += 2;
    suggestions.push('이미지를 6장 이상 추가하면 네이버 D.I.A. 점수에 유리합니다');
  }

  // ─── 11. 이미지 alt 키워드 체크 (5점) ───────────────────────────────
  // ![alt텍스트](url) 형태에서 alt에 주키워드/보조키워드 포함 여부
  if (imageMatches.length > 0 && keywords.length > 0) {
    const altTexts = imageMatches.map(img => {
      const altMatch = img.match(/!\[([^\]]*)\]/);
      return altMatch ? altMatch[1] : '';
    });
    const imagesWithKwAlt = altTexts.filter(alt =>
      alt.length > 0 && keywords.some(k => alt.toLowerCase().includes(k.toLowerCase()))
    ).length;
    const altRatio = imagesWithKwAlt / imageMatches.length;

    if (altRatio >= 0.5) {
      analysis.items.push({
        name: '이미지 alt 키워드',
        status: 'good',
        message: `${imagesWithKwAlt}/${imageMatches.length}개 이미지에 키워드 alt`,
        score: 5,
      });
      analysis.score += 5;
    } else if (imagesWithKwAlt > 0) {
      analysis.items.push({
        name: '이미지 alt 키워드',
        status: 'warning',
        message: `${imagesWithKwAlt}/${imageMatches.length}개 이미지에 키워드 alt (50% 이상 권장)`,
        score: 3,
      });
      analysis.score += 3;
      suggestions.push('이미지 alt 텍스트에 주키워드/보조키워드를 포함하면 검색 노출에 유리합니다');
    } else {
      analysis.items.push({
        name: '이미지 alt 키워드',
        status: 'error',
        message: 'alt에 키워드 없음',
        score: 0,
      });
      suggestions.push('이미지 ![키워드 포함 설명](url) 형태로 alt 텍스트에 키워드를 넣으세요');
    }
  } else if (imageMatches.length === 0) {
    analysis.items.push({
      name: '이미지 alt 키워드',
      status: 'info',
      message: '이미지 없음 (분석 불가)',
      score: 0,
    });
  }

  // ─── 12. CTA/인터랙션 유도 (5점) ─────────────────────────────────────
  // 마지막 200자 내 CTA 문구 존재 여부
  const ctaKeywords = ['댓글', '의견', '공감', '좋아요', '구독', '질문', '어떠세요', '알려주세요', '남겨주세요', '부탁드립니다', '알아보세요', '함께해요', '응원해주세요'];
  const lastChars = content.slice(-200);
  const hasCTA = ctaKeywords.some(cta => lastChars.includes(cta));

  if (hasCTA) {
    const foundCta = ctaKeywords.find(cta => lastChars.includes(cta));
    analysis.items.push({
      name: 'CTA 유도',
      status: 'good',
      message: `마무리에 CTA 문구 있음 ("${foundCta}" 등)`,
      score: 5,
    });
    analysis.score += 5;
  } else {
    analysis.items.push({
      name: 'CTA 유도',
      status: 'warning',
      message: '마무리에 CTA 문구 없음',
      score: 0,
    });
    suggestions.push('글 마무리에 "댓글로 의견 남겨주세요", "공감 버튼 눌러주세요" 등 독자 참여 유도 문구를 추가하세요');
  }

  // ─── 13. 문장 시작 패턴 다양성 (5점) ─────────────────────────────────
  // 연속 3문장 이상 같은 단어/접속사로 시작하면 감점
  const sentences = bodyText
    .split(/(?<=[.!?])\s+|(?<=。)\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  let maxRepeat = 0;
  if (sentences.length >= 3) {
    // 각 문장의 첫 2글자(접속사/시작어) 추출
    const starters = sentences.map(s => s.replace(/^[^가-힣a-zA-Z]+/, '').slice(0, 4));
    for (let i = 0; i < starters.length - 2; i++) {
      let repeat = 1;
      for (let j = i + 1; j < starters.length; j++) {
        if (starters[j].slice(0, 2) === starters[i].slice(0, 2)) {
          repeat++;
        } else {
          break;
        }
      }
      if (repeat > maxRepeat) maxRepeat = repeat;
    }
  }

  if (maxRepeat < 3) {
    analysis.items.push({ name: '문장 시작 다양성', status: 'good', message: '문장 시작 패턴이 다양함', score: 5 });
    analysis.score += 5;
  } else if (maxRepeat === 3) {
    analysis.items.push({
      name: '문장 시작 다양성',
      status: 'warning',
      message: `연속 ${maxRepeat}문장 동일 패턴 감지`,
      score: 3,
    });
    analysis.score += 3;
    suggestions.push('일부 문장이 같은 단어/접속사로 시작합니다. 다양한 문장 시작 표현을 사용해보세요');
  } else {
    analysis.items.push({
      name: '문장 시작 다양성',
      status: 'error',
      message: `연속 ${maxRepeat}문장 동일 패턴 (단조로움)`,
      score: 0,
    });
    suggestions.push(`연속 ${maxRepeat}문장이 동일한 패턴으로 시작됩니다. 접속사와 시작 표현을 다양하게 바꾸세요`);
  }

  // ─── 14. 도입부 훅 품질 (5점) ────────────────────────────────────────
  // 첫 문장의 유형 판별
  const firstSentenceRaw = bodyText.split(/\n\n/)[0]?.split(/(?<=[.!?])\s+/)[0]?.trim() || '';

  // AI 정형 패턴 (0점)
  const aiPatterns = [
    /^오늘은\s.+(대해|알아보|살펴보)/,
    /^이번\s?(포스팅|글|시간)에는/,
    /^안녕하세요.*(입니다|해요)/,
    /^오늘\s?소개/,
    /^이번에\s?소개/,
  ];
  // 질문형 훅 (5점)
  const questionPattern = /[?？]$|하신\s?적\s?있|어떻게\s?생각|아시나요|알고\s?계|혹시\s?/;
  // 공감형/통계형 (5점)
  const empathyPattern = /^요즘\s|^최근\s|^\d+[%％]\s?|^많은\s?분들|^대부분|^누구나|^혹시\s?/;

  const isAiPattern = aiPatterns.some(p => p.test(firstSentenceRaw));
  const isQuestion = questionPattern.test(firstSentenceRaw);
  const isEmpathy = empathyPattern.test(firstSentenceRaw);

  if (isAiPattern) {
    analysis.items.push({
      name: '도입부 훅',
      status: 'error',
      message: 'AI 정형 도입부 감지 ("오늘은 ~에 대해" 등)',
      score: 0,
    });
    suggestions.push('도입부를 질문형("~하신 적 있으세요?"), 공감형("요즘 ~"), 통계형("~%가") 등으로 바꾸면 체류 시간이 늘어납니다');
  } else if (isQuestion || isEmpathy) {
    analysis.items.push({
      name: '도입부 훅',
      status: 'good',
      message: isQuestion ? '질문형 훅으로 독자 집중 유도' : '공감형/통계형 훅으로 몰입 유도',
      score: 5,
    });
    analysis.score += 5;
  } else {
    analysis.items.push({
      name: '도입부 훅',
      status: 'warning',
      message: '일반 서술형 도입부',
      score: 2,
    });
    analysis.score += 2;
    suggestions.push('도입부 첫 문장을 질문형("~하신 적 있으세요?")이나 공감형("요즘 ~")으로 바꾸면 독자 이탈을 줄일 수 있습니다');
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
