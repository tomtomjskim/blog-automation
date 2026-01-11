/**
 * Blog Automation - Fact Checker Service
 * 팩트체크 및 정보 검증 서비스
 * - 2단계 검증: 주장 추출 → 검색/검증
 * - 신뢰도 점수 산출
 */

import { llmService } from './llm-service.js';
import { webSearchService } from './web-search.js';
import { store } from '../state.js';

// 검증 상태
const VERIFICATION_STATUS = {
  VERIFIED: 'verified',       // 검증됨 (사실)
  PARTIALLY_VERIFIED: 'partially_verified', // 부분 검증
  UNVERIFIED: 'unverified',   // 미검증 (정보 부족)
  DISPUTED: 'disputed',       // 논쟁 중
  FALSE: 'false'              // 거짓
};

// 검증 결과 레벨
const CONFIDENCE_LEVELS = {
  HIGH: { min: 0.8, label: '높음', color: 'green', icon: '✅' },
  MEDIUM: { min: 0.6, label: '보통', color: 'yellow', icon: '⚠️' },
  LOW: { min: 0.4, label: '낮음', color: 'orange', icon: '🔶' },
  VERY_LOW: { min: 0, label: '매우 낮음', color: 'red', icon: '❌' }
};

class FactChecker {
  constructor() {
    this.llmService = llmService;
    this.webSearchService = webSearchService;
  }

  /**
   * 팩트체크 사용 가능 여부
   */
  isAvailable() {
    return this.webSearchService.getAvailableProviders().length > 0;
  }

  /**
   * 텍스트에서 검증 가능한 주장 추출 (1단계)
   */
  async extractClaims(text, options = {}) {
    const {
      provider = 'anthropic',
      model,
      maxClaims = 10
    } = options;

    const prompt = `다음 텍스트에서 팩트체크가 필요한 주장(claim)을 추출해주세요.

## 추출 대상
1. 수치나 통계 (가격, 날짜, 수량 등)
2. 특정 사실 주장 (역사, 과학적 사실 등)
3. 인용문이나 발언
4. 기관/단체에 대한 정보
5. 시간, 장소 관련 정보

## 제외 대상
- 주관적 의견이나 감상
- 일반적으로 알려진 상식
- 검증 불가능한 개인 경험

## 텍스트
"""
${text.substring(0, 4000)}
"""

## 출력 형식 (JSON)
{
  "claims": [
    {
      "id": 1,
      "text": "추출된 주장",
      "type": "statistic|fact|quote|location|date",
      "importance": "high|medium|low",
      "searchQuery": "검증을 위한 검색어"
    }
  ],
  "summary": {
    "total": 0,
    "highPriority": 0
  }
}

주장만 JSON 형식으로 출력하세요:`;

    try {
      const result = await this.llmService.generateText(provider, prompt, {
        model,
        maxTokens: 2000,
        temperature: 0.3
      });

      // JSON 파싱
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          claims: (parsed.claims || []).slice(0, maxClaims),
          summary: parsed.summary || { total: parsed.claims?.length || 0 }
        };
      }

      return { claims: [], summary: { total: 0 } };
    } catch (error) {
      console.error('주장 추출 실패:', error);
      throw new Error(`주장 추출 중 오류 발생: ${error.message}`);
    }
  }

  /**
   * 단일 주장 검증 (2단계)
   */
  async verifyClaim(claim, options = {}) {
    const {
      provider = 'anthropic',
      model,
      searchProvider
    } = options;

    const verificationResult = {
      claim: claim.text,
      claimId: claim.id,
      type: claim.type,
      status: VERIFICATION_STATUS.UNVERIFIED,
      confidence: 0,
      sources: [],
      evidence: [],
      correction: null,
      searchResults: null
    };

    try {
      // 웹 검색으로 관련 정보 수집
      const searchQuery = claim.searchQuery || claim.text;
      let searchResults = null;

      if (this.webSearchService.isAvailable(searchProvider)) {
        try {
          searchResults = await this.webSearchService.gatherInformation(searchQuery, {
            maxResults: 5,
            includeNews: true,
            provider: searchProvider
          });

          // 신뢰도 점수 추가
          searchResults = this.webSearchService.addCredibilityScores(searchResults);
          verificationResult.searchResults = searchResults;

          // 소스 정보 추출
          verificationResult.sources = [
            ...searchResults.webResults.map(r => ({
              title: r.title,
              url: r.url,
              credibility: r.credibility
            })),
            ...searchResults.newsResults.map(r => ({
              title: r.title,
              url: r.url,
              date: r.date,
              credibility: r.credibility
            }))
          ];
        } catch (searchError) {
          console.warn('검색 실패, LLM만으로 검증 시도:', searchError);
        }
      }

      // 검색 결과 기반 LLM 검증
      const context = searchResults
        ? this.webSearchService.formatAsContext(searchResults)
        : '';

      const verifyPrompt = `주어진 주장의 사실 여부를 검증해주세요.

## 주장
"${claim.text}"

## 주장 유형
${claim.type || '일반 사실'}

${context ? `## 수집된 정보\n${context}\n` : ''}

## 검증 지침
1. 수집된 정보를 바탕으로 주장의 사실 여부 판단
2. 정보가 부족하면 'unverified'로 표시
3. 부분적으로만 맞는 경우 'partially_verified'로 표시
4. 여러 출처에서 다른 정보가 있으면 'disputed'로 표시
5. 명백히 틀린 경우 'false'로 표시하고 정정 정보 제공

## 출력 형식 (JSON)
{
  "status": "verified|partially_verified|unverified|disputed|false",
  "confidence": 0.0-1.0,
  "reasoning": "판단 근거 설명",
  "evidence": ["근거 1", "근거 2"],
  "correction": "틀린 경우 정정 정보 (선택)"
}

JSON 형식으로 출력하세요:`;

      const verifyResult = await this.llmService.generateText(provider, verifyPrompt, {
        model,
        maxTokens: 1000,
        temperature: 0.2
      });

      // JSON 파싱
      const jsonMatch = verifyResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        verificationResult.status = parsed.status || VERIFICATION_STATUS.UNVERIFIED;
        verificationResult.confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));
        verificationResult.reasoning = parsed.reasoning;
        verificationResult.evidence = parsed.evidence || [];
        verificationResult.correction = parsed.correction;
      }

    } catch (error) {
      console.error('주장 검증 실패:', error);
      verificationResult.error = error.message;
    }

    return verificationResult;
  }

  /**
   * 전체 텍스트 팩트체크 (1단계 + 2단계)
   */
  async checkText(text, options = {}) {
    const {
      provider = 'anthropic',
      model,
      searchProvider,
      maxClaims = 5,
      onProgress
    } = options;

    const result = {
      originalText: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
      timestamp: new Date().toISOString(),
      claims: [],
      verificationResults: [],
      overallScore: 0,
      warnings: [],
      summary: null
    };

    // 진행 상황 콜백
    const reportProgress = (step, data) => {
      if (onProgress) {
        onProgress({ step, ...data });
      }
    };

    try {
      // 1단계: 주장 추출
      reportProgress('extracting', { message: '검증 대상 추출 중...' });
      const extractResult = await this.extractClaims(text, { provider, model, maxClaims });
      result.claims = extractResult.claims;

      if (result.claims.length === 0) {
        result.summary = '검증이 필요한 주장이 발견되지 않았습니다.';
        return result;
      }

      // 2단계: 각 주장 검증
      const verificationPromises = result.claims.map(async (claim, index) => {
        reportProgress('verifying', {
          message: `주장 검증 중... (${index + 1}/${result.claims.length})`,
          current: index + 1,
          total: result.claims.length
        });

        return this.verifyClaim(claim, { provider, model, searchProvider });
      });

      result.verificationResults = await Promise.all(verificationPromises);

      // 전체 신뢰도 점수 계산
      result.overallScore = this.calculateOverallScore(result.verificationResults);

      // 경고 생성
      result.warnings = this.generateWarnings(result.verificationResults);

      // 요약 생성
      result.summary = this.generateSummary(result);

      reportProgress('complete', { message: '팩트체크 완료' });

    } catch (error) {
      console.error('팩트체크 실패:', error);
      result.error = error.message;
    }

    return result;
  }

  /**
   * 전체 신뢰도 점수 계산
   */
  calculateOverallScore(verificationResults) {
    if (!verificationResults || verificationResults.length === 0) {
      return 1; // 검증 항목 없으면 만점
    }

    // 상태별 가중치
    const statusWeights = {
      [VERIFICATION_STATUS.VERIFIED]: 1.0,
      [VERIFICATION_STATUS.PARTIALLY_VERIFIED]: 0.7,
      [VERIFICATION_STATUS.UNVERIFIED]: 0.5,
      [VERIFICATION_STATUS.DISPUTED]: 0.3,
      [VERIFICATION_STATUS.FALSE]: 0.0
    };

    const totalScore = verificationResults.reduce((sum, result) => {
      const statusWeight = statusWeights[result.status] ?? 0.5;
      const confidence = result.confidence || 0.5;
      return sum + (statusWeight * confidence);
    }, 0);

    return Math.round((totalScore / verificationResults.length) * 100) / 100;
  }

  /**
   * 경고 메시지 생성
   */
  generateWarnings(verificationResults) {
    const warnings = [];

    verificationResults.forEach(result => {
      if (result.status === VERIFICATION_STATUS.FALSE) {
        warnings.push({
          type: 'error',
          claim: result.claim,
          message: `거짓 정보 발견: "${result.claim.substring(0, 50)}..."`,
          correction: result.correction,
          icon: '❌'
        });
      } else if (result.status === VERIFICATION_STATUS.DISPUTED) {
        warnings.push({
          type: 'warning',
          claim: result.claim,
          message: `논쟁 중인 정보: "${result.claim.substring(0, 50)}..."`,
          icon: '⚠️'
        });
      } else if (result.status === VERIFICATION_STATUS.UNVERIFIED && result.confidence < 0.5) {
        warnings.push({
          type: 'info',
          claim: result.claim,
          message: `검증 필요: "${result.claim.substring(0, 50)}..."`,
          icon: '🔍'
        });
      }
    });

    return warnings;
  }

  /**
   * 요약 생성
   */
  generateSummary(result) {
    const total = result.verificationResults.length;
    const counts = {
      verified: 0,
      partiallyVerified: 0,
      unverified: 0,
      disputed: 0,
      false: 0
    };

    result.verificationResults.forEach(r => {
      switch (r.status) {
        case VERIFICATION_STATUS.VERIFIED: counts.verified++; break;
        case VERIFICATION_STATUS.PARTIALLY_VERIFIED: counts.partiallyVerified++; break;
        case VERIFICATION_STATUS.UNVERIFIED: counts.unverified++; break;
        case VERIFICATION_STATUS.DISPUTED: counts.disputed++; break;
        case VERIFICATION_STATUS.FALSE: counts.false++; break;
      }
    });

    let summary = `총 ${total}개 주장 검증 완료. `;
    summary += `신뢰도 점수: ${Math.round(result.overallScore * 100)}%\n`;

    if (counts.verified > 0) summary += `✅ 검증됨: ${counts.verified}개\n`;
    if (counts.partiallyVerified > 0) summary += `⚠️ 부분 검증: ${counts.partiallyVerified}개\n`;
    if (counts.unverified > 0) summary += `🔍 미검증: ${counts.unverified}개\n`;
    if (counts.disputed > 0) summary += `💬 논쟁 중: ${counts.disputed}개\n`;
    if (counts.false > 0) summary += `❌ 거짓: ${counts.false}개\n`;

    return summary.trim();
  }

  /**
   * 신뢰도 레벨 반환
   */
  getConfidenceLevel(score) {
    for (const [level, config] of Object.entries(CONFIDENCE_LEVELS)) {
      if (score >= config.min) {
        return { level, ...config };
      }
    }
    return { level: 'VERY_LOW', ...CONFIDENCE_LEVELS.VERY_LOW };
  }

  /**
   * 글 생성 전 주제 사전 조사
   */
  async researchTopic(topic, options = {}) {
    const {
      includeNews = true,
      maxResults = 10,
      searchProvider
    } = options;

    if (!this.webSearchService.isAvailable(searchProvider)) {
      return {
        topic,
        available: false,
        message: '웹 검색 API가 설정되지 않았습니다.'
      };
    }

    try {
      // 종합 정보 수집
      const searchResults = await this.webSearchService.gatherInformation(topic, {
        includeNews,
        maxResults,
        provider: searchProvider
      });

      // 신뢰도 점수 추가
      const resultsWithScores = this.webSearchService.addCredibilityScores(searchResults);

      // 프롬프트용 컨텍스트 생성
      const context = this.webSearchService.formatAsContext(resultsWithScores);

      // 고신뢰도 소스만 추출
      const trustedSources = [
        ...resultsWithScores.webResults,
        ...resultsWithScores.newsResults
      ].filter(r => r.credibility && r.credibility.score >= 0.7);

      return {
        topic,
        available: true,
        timestamp: new Date().toISOString(),
        searchResults: resultsWithScores,
        context,
        trustedSources,
        summary: resultsWithScores.summary || null,
        sourceCount: {
          total: resultsWithScores.webResults.length + resultsWithScores.newsResults.length,
          trusted: trustedSources.length
        }
      };
    } catch (error) {
      console.error('주제 조사 실패:', error);
      return {
        topic,
        available: false,
        error: error.message
      };
    }
  }

  /**
   * 생성된 글에 대한 빠른 검증
   */
  async quickCheck(text, options = {}) {
    const {
      provider = 'anthropic',
      model
    } = options;

    // 주장 추출 (최대 3개만)
    const extractResult = await this.extractClaims(text, {
      provider,
      model,
      maxClaims: 3
    });

    // 높은 중요도만 검증
    const highPriorityClaims = extractResult.claims.filter(c => c.importance === 'high');

    if (highPriorityClaims.length === 0) {
      return {
        passed: true,
        score: 1,
        message: '빠른 검증 통과 (검증 대상 없음)',
        claims: []
      };
    }

    // 검증 수행
    const verifications = await Promise.all(
      highPriorityClaims.slice(0, 3).map(claim =>
        this.verifyClaim(claim, { provider, model })
      )
    );

    const score = this.calculateOverallScore(verifications);
    const hasIssues = verifications.some(v =>
      v.status === VERIFICATION_STATUS.FALSE ||
      v.status === VERIFICATION_STATUS.DISPUTED
    );

    return {
      passed: !hasIssues && score >= 0.6,
      score,
      message: hasIssues
        ? '일부 정보에 대한 검증이 필요합니다'
        : '빠른 검증 통과',
      claims: verifications
    };
  }
}

// 싱글톤 인스턴스
const factChecker = new FactChecker();

export {
  factChecker,
  FactChecker,
  VERIFICATION_STATUS,
  CONFIDENCE_LEVELS
};
