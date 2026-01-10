/**
 * Blog Automation - SEO Analyzer Service
 * 고급 SEO 분석 기능
 */

const SEO_WEIGHTS = {
  title: 20,
  content: 40,
  readability: 25,
  structure: 15
};

class SEOAnalyzer {
  constructor() {
    this.results = null;
  }

  /**
   * SEO 분석 실행
   * @param {string} title - 글 제목
   * @param {string} content - 글 본문
   * @param {string[]} keywords - 키워드 배열
   * @returns {object} 분석 결과
   */
  analyze(title, content, keywords = []) {
    const results = {
      score: 0,
      maxScore: 100,
      categories: {},
      suggestions: [],
      summary: ''
    };

    // 1. 제목 분석
    results.categories.title = this.analyzeTitle(title, keywords);

    // 2. 콘텐츠 분석
    results.categories.content = this.analyzeContent(content, keywords);

    // 3. 가독성 분석
    results.categories.readability = this.analyzeReadability(content);

    // 4. 구조 분석
    results.categories.structure = this.analyzeStructure(content);

    // 종합 점수 계산
    results.score = this.calculateTotalScore(results.categories);

    // 개선 제안 생성
    results.suggestions = this.generateSuggestions(results.categories);

    // 요약 메시지
    results.summary = this.generateSummary(results.score);

    this.results = results;
    return results;
  }

  /**
   * 제목 분석
   */
  analyzeTitle(title, keywords) {
    const checks = [];
    let score = 0;
    const maxScore = SEO_WEIGHTS.title;

    // 제목 길이 체크 (30-60자 권장)
    const titleLength = title.length;
    if (titleLength >= 30 && titleLength <= 60) {
      score += 8;
      checks.push({ pass: true, message: `제목 길이 적절 (${titleLength}자)`, impact: 'high' });
    } else if (titleLength >= 20 && titleLength < 30) {
      score += 5;
      checks.push({ pass: false, message: `제목이 짧음 (${titleLength}자) - 30자 이상 권장`, impact: 'medium' });
    } else if (titleLength > 60) {
      score += 5;
      checks.push({ pass: false, message: `제목이 김 (${titleLength}자) - 60자 이하 권장`, impact: 'medium' });
    } else if (titleLength > 0) {
      score += 2;
      checks.push({ pass: false, message: `제목이 너무 짧음 (${titleLength}자) - 30자 이상 권장`, impact: 'high' });
    } else {
      checks.push({ pass: false, message: '제목이 없습니다', impact: 'high' });
    }

    // 키워드 포함 체크
    if (keywords.length > 0) {
      const keywordInTitle = keywords.some(kw =>
        title.toLowerCase().includes(kw.toLowerCase())
      );
      if (keywordInTitle) {
        score += 8;
        checks.push({ pass: true, message: '주요 키워드가 제목에 포함됨', impact: 'high' });
      } else {
        checks.push({ pass: false, message: '주요 키워드를 제목에 포함하세요', impact: 'high' });
      }
    }

    // 숫자 포함 체크 (클릭률 향상)
    if (/\d+/.test(title)) {
      score += 2;
      checks.push({ pass: true, message: '숫자 포함 (클릭률 향상)', impact: 'low' });
    }

    // 특수문자/이모지 체크
    if (/[\u{1F300}-\u{1F9FF}]/u.test(title)) {
      score += 2;
      checks.push({ pass: true, message: '이모지 포함 (시선 유도)', impact: 'low' });
    }

    return {
      name: '제목',
      score: Math.min(score, maxScore),
      maxScore,
      checks
    };
  }

  /**
   * 콘텐츠 분석
   */
  analyzeContent(content, keywords) {
    const checks = [];
    let score = 0;
    const maxScore = SEO_WEIGHTS.content;

    const textContent = this.stripMarkdown(content);
    const charCount = textContent.length;

    // 길이 체크 (1000자 이상 권장)
    if (charCount >= 2000) {
      score += 15;
      checks.push({ pass: true, message: `풍부한 콘텐츠 (${charCount.toLocaleString()}자)`, impact: 'high' });
    } else if (charCount >= 1000) {
      score += 12;
      checks.push({ pass: true, message: `적절한 콘텐츠 길이 (${charCount.toLocaleString()}자)`, impact: 'high' });
    } else if (charCount >= 500) {
      score += 7;
      checks.push({ pass: false, message: `콘텐츠가 짧음 (${charCount.toLocaleString()}자) - 1000자 이상 권장`, impact: 'high' });
    } else {
      score += 3;
      checks.push({ pass: false, message: `콘텐츠가 너무 짧음 (${charCount.toLocaleString()}자)`, impact: 'high' });
    }

    // 키워드 밀도 체크 (1-3% 권장)
    if (keywords.length > 0) {
      const primaryKeyword = keywords[0];
      const density = this.calculateKeywordDensity(textContent, primaryKeyword);

      if (density >= 1 && density <= 3) {
        score += 15;
        checks.push({ pass: true, message: `키워드 밀도 적절 (${density.toFixed(1)}%)`, impact: 'high' });
      } else if (density > 0 && density < 1) {
        score += 8;
        checks.push({
          pass: false,
          message: `키워드 밀도 낮음 (${density.toFixed(1)}%) - 1% 이상 권장`,
          impact: 'medium'
        });
      } else if (density > 3) {
        score += 5;
        checks.push({
          pass: false,
          message: `키워드 과다 사용 (${density.toFixed(1)}%) - 3% 이하 권장`,
          impact: 'medium'
        });
      } else {
        checks.push({ pass: false, message: '키워드가 본문에 없습니다', impact: 'high' });
      }

      // 보조 키워드 체크
      if (keywords.length > 1) {
        const secondaryInContent = keywords.slice(1).filter(kw =>
          textContent.toLowerCase().includes(kw.toLowerCase())
        ).length;

        if (secondaryInContent > 0) {
          score += 5;
          checks.push({ pass: true, message: `보조 키워드 ${secondaryInContent}개 포함`, impact: 'low' });
        }
      }
    }

    // 링크 체크
    const linkCount = (content.match(/\[.+?\]\(.+?\)/g) || []).length;
    if (linkCount >= 2) {
      score += 5;
      checks.push({ pass: true, message: `링크 포함 (${linkCount}개)`, impact: 'medium' });
    } else if (linkCount === 1) {
      score += 2;
      checks.push({ pass: false, message: '링크 추가 권장 (2개 이상)', impact: 'low' });
    } else {
      checks.push({ pass: false, message: '내부/외부 링크 추가 권장', impact: 'low' });
    }

    return {
      name: '콘텐츠',
      score: Math.min(score, maxScore),
      maxScore,
      checks,
      stats: {
        charCount,
        keywordDensity: keywords[0] ? this.calculateKeywordDensity(textContent, keywords[0]) : 0
      }
    };
  }

  /**
   * 가독성 분석
   */
  analyzeReadability(content) {
    const checks = [];
    let score = 0;
    const maxScore = SEO_WEIGHTS.readability;

    const textContent = this.stripMarkdown(content);
    const sentences = this.splitSentences(textContent);
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

    // 평균 문장 길이 (30자 이하 권장)
    const avgSentenceLength = sentences.length > 0
      ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
      : 0;

    if (avgSentenceLength <= 30) {
      score += 10;
      checks.push({ pass: true, message: `문장 길이 적절 (평균 ${Math.round(avgSentenceLength)}자)`, impact: 'high' });
    } else if (avgSentenceLength <= 50) {
      score += 6;
      checks.push({
        pass: false,
        message: `문장이 약간 김 (평균 ${Math.round(avgSentenceLength)}자) - 30자 이하 권장`,
        impact: 'medium'
      });
    } else {
      score += 3;
      checks.push({
        pass: false,
        message: `문장이 너무 김 (평균 ${Math.round(avgSentenceLength)}자) - 짧게 나눠주세요`,
        impact: 'high'
      });
    }

    // 단락 수 (5개 이상 권장)
    if (paragraphs.length >= 7) {
      score += 10;
      checks.push({ pass: true, message: `단락 구분 우수 (${paragraphs.length}개)`, impact: 'high' });
    } else if (paragraphs.length >= 5) {
      score += 8;
      checks.push({ pass: true, message: `단락 구분 양호 (${paragraphs.length}개)`, impact: 'high' });
    } else if (paragraphs.length >= 3) {
      score += 5;
      checks.push({
        pass: false,
        message: `단락 구분 부족 (${paragraphs.length}개) - 5개 이상 권장`,
        impact: 'medium'
      });
    } else {
      score += 2;
      checks.push({
        pass: false,
        message: `단락 구분 필요 (${paragraphs.length}개) - 적절히 나눠주세요`,
        impact: 'high'
      });
    }

    // 짧은 문장 비율 (20% 이상 권장)
    if (sentences.length > 0) {
      const shortSentences = sentences.filter(s => s.length <= 20).length;
      const shortRatio = (shortSentences / sentences.length) * 100;

      if (shortRatio >= 20) {
        score += 5;
        checks.push({ pass: true, message: `짧은 문장 비율 적절 (${Math.round(shortRatio)}%)`, impact: 'low' });
      }
    }

    return {
      name: '가독성',
      score: Math.min(score, maxScore),
      maxScore,
      checks,
      stats: {
        avgSentenceLength: Math.round(avgSentenceLength),
        paragraphCount: paragraphs.length,
        sentenceCount: sentences.length
      }
    };
  }

  /**
   * 구조 분석
   */
  analyzeStructure(content) {
    const checks = [];
    let score = 0;
    const maxScore = SEO_WEIGHTS.structure;

    // H2 소제목 체크
    const h2Count = (content.match(/^## /gm) || []).length;
    const h3Count = (content.match(/^### /gm) || []).length;

    if (h2Count >= 3) {
      score += 8;
      checks.push({ pass: true, message: `소제목(H2) 충분 (${h2Count}개)`, impact: 'high' });
    } else if (h2Count >= 2) {
      score += 6;
      checks.push({ pass: true, message: `소제목(H2) 사용 (${h2Count}개)`, impact: 'high' });
    } else if (h2Count === 1) {
      score += 3;
      checks.push({ pass: false, message: '소제목(H2) 추가 권장 (2개 이상)', impact: 'high' });
    } else {
      checks.push({ pass: false, message: '소제목(H2)이 없음 - 구조화 필요', impact: 'high' });
    }

    // 목록 사용 체크
    const bulletList = (content.match(/^[-*]\s/gm) || []).length;
    const numberedList = (content.match(/^\d+\.\s/gm) || []).length;
    const listCount = bulletList + numberedList;

    if (listCount >= 5) {
      score += 4;
      checks.push({ pass: true, message: `목록 활용 우수 (${listCount}개)`, impact: 'medium' });
    } else if (listCount >= 3) {
      score += 3;
      checks.push({ pass: true, message: `목록 사용 (${listCount}개)`, impact: 'medium' });
    } else if (listCount > 0) {
      score += 1;
      checks.push({ pass: false, message: '목록 추가 권장 (가독성 향상)', impact: 'low' });
    } else {
      checks.push({ pass: false, message: '목록 사용 권장', impact: 'low' });
    }

    // 강조 표시 사용
    const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
    if (boldCount >= 3) {
      score += 3;
      checks.push({ pass: true, message: `강조 표시 활용 (${boldCount}개)`, impact: 'low' });
    } else if (boldCount > 0) {
      score += 1;
      checks.push({ pass: true, message: '강조 표시 사용', impact: 'low' });
    }

    return {
      name: '구조',
      score: Math.min(score, maxScore),
      maxScore,
      checks,
      stats: { h2Count, h3Count, listCount, boldCount }
    };
  }

  /**
   * 종합 점수 계산
   */
  calculateTotalScore(categories) {
    return Object.values(categories).reduce((sum, cat) => sum + cat.score, 0);
  }

  /**
   * 개선 제안 생성
   */
  generateSuggestions(categories) {
    const suggestions = [];

    Object.entries(categories).forEach(([key, category]) => {
      category.checks
        .filter(check => !check.pass)
        .forEach(check => {
          suggestions.push({
            category: category.name,
            message: check.message,
            priority: check.impact === 'high' ? 'high' : check.impact === 'medium' ? 'medium' : 'low'
          });
        });
    });

    // 우선순위 정렬
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * 요약 메시지 생성
   */
  generateSummary(score) {
    if (score >= 90) return '훌륭합니다! SEO 최적화가 잘 되어있습니다.';
    if (score >= 75) return '좋습니다! 몇 가지 개선점을 확인해보세요.';
    if (score >= 60) return '괜찮습니다. 제안사항을 참고해 개선해보세요.';
    if (score >= 40) return '개선이 필요합니다. 주요 제안사항을 확인하세요.';
    return '많은 개선이 필요합니다. 제안사항을 참고해주세요.';
  }

  /**
   * 키워드 밀도 계산
   */
  calculateKeywordDensity(text, keyword) {
    if (!keyword || !text) return 0;

    const keywordLower = keyword.toLowerCase();
    const textLower = text.toLowerCase();

    // 키워드 출현 횟수
    const regex = new RegExp(this.escapeRegex(keywordLower), 'g');
    const matches = textLower.match(regex) || [];
    const keywordCount = matches.length;

    if (keywordCount === 0) return 0;

    // 한글: 글자 수 기준, 영문: 단어 수 기준
    const isKorean = /[\uAC00-\uD7AF]/.test(keyword);

    if (isKorean) {
      const totalChars = text.replace(/\s/g, '').length;
      const keywordChars = keyword.length * keywordCount;
      return totalChars > 0 ? (keywordChars / totalChars) * 100 : 0;
    } else {
      const words = text.split(/\s+/).filter(w => w.length > 0);
      return words.length > 0 ? (keywordCount / words.length) * 100 : 0;
    }
  }

  /**
   * 마크다운 제거
   */
  stripMarkdown(text) {
    return text
      .replace(/^#+\s+/gm, '')           // 제목
      .replace(/\*\*(.+?)\*\*/g, '$1')   // 굵게
      .replace(/\*(.+?)\*/g, '$1')       // 기울임
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 링크
      .replace(/`(.+?)`/g, '$1')         // 인라인 코드
      .replace(/^[-*]\s+/gm, '')         // 목록
      .replace(/^\d+\.\s+/gm, '')        // 번호 목록
      .replace(/^>\s+/gm, '')            // 인용
      .replace(/<[^>]+>/g, '');          // HTML 태그
  }

  /**
   * 문장 분리
   */
  splitSentences(text) {
    // 한국어 문장 부호 기준
    return text
      .split(/[.!?。！？]\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * 정규식 이스케이프
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 이전 결과 반환
   */
  getLastResults() {
    return this.results;
  }

  /**
   * SEO 점수 등급
   */
  static getGrade(score) {
    if (score >= 90) return { grade: 'A', label: '우수', color: '#22c55e' };
    if (score >= 75) return { grade: 'B', label: '양호', color: '#84cc16' };
    if (score >= 60) return { grade: 'C', label: '보통', color: '#eab308' };
    if (score >= 40) return { grade: 'D', label: '개선필요', color: '#f97316' };
    return { grade: 'F', label: '미흡', color: '#ef4444' };
  }
}

// 싱글톤 인스턴스
const seoAnalyzer = new SEOAnalyzer();

export { seoAnalyzer, SEOAnalyzer };
