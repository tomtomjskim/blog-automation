/**
 * Blog Automation - Web Search Service
 * 웹 검색 API 연동 서비스 (Serper, Tavily 지원)
 * 최신 정보 수집 및 팩트체크용
 */

import { store } from '../state.js';

// 검색 API 설정
const SEARCH_APIS = {
  serper: {
    name: 'Serper',
    baseUrl: 'https://google.serper.dev',
    endpoints: {
      search: '/search',
      news: '/news',
      images: '/images'
    },
    // 무료: 2,500 쿼리/월
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerMonth: 2500
    }
  },
  tavily: {
    name: 'Tavily',
    baseUrl: 'https://api.tavily.com',
    endpoints: {
      search: '/search'
    },
    // 무료: 1,000 쿼리/월
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerMonth: 1000
    }
  }
};

// 검색 결과 캐시 (메모리)
const searchCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30분

class WebSearchService {
  constructor() {
    this.defaultProvider = 'serper';
  }

  /**
   * API 키 가져오기
   */
  getApiKey(provider) {
    const apiKeys = store.get('apiKeys') || {};
    switch (provider) {
      case 'serper':
        return apiKeys.serperApiKey;
      case 'tavily':
        return apiKeys.tavilyApiKey;
      default:
        return null;
    }
  }

  /**
   * 검색 API 사용 가능 여부 확인
   */
  isAvailable(provider = this.defaultProvider) {
    return !!this.getApiKey(provider);
  }

  /**
   * 사용 가능한 검색 API 목록
   */
  getAvailableProviders() {
    return Object.keys(SEARCH_APIS).filter(provider => this.isAvailable(provider));
  }

  /**
   * 캐시 키 생성
   */
  getCacheKey(provider, type, query, options = {}) {
    return `${provider}:${type}:${query}:${JSON.stringify(options)}`;
  }

  /**
   * 캐시에서 결과 가져오기
   */
  getFromCache(cacheKey) {
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    searchCache.delete(cacheKey);
    return null;
  }

  /**
   * 캐시에 결과 저장
   */
  saveToCache(cacheKey, data) {
    searchCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 웹 검색 실행
   */
  async search(query, options = {}) {
    const {
      provider = this.defaultProvider,
      type = 'search', // 'search', 'news', 'images'
      num = 10,
      language = 'ko',
      country = 'kr',
      useCache = true
    } = options;

    // API 키 확인
    const apiKey = this.getApiKey(provider);
    if (!apiKey) {
      throw new Error(`${SEARCH_APIS[provider]?.name || provider} API 키가 설정되지 않았습니다.`);
    }

    // 캐시 확인
    const cacheKey = this.getCacheKey(provider, type, query, { num, language, country });
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    // 검색 실행
    let result;
    switch (provider) {
      case 'serper':
        result = await this.searchWithSerper(apiKey, query, { type, num, language, country });
        break;
      case 'tavily':
        result = await this.searchWithTavily(apiKey, query, { num });
        break;
      default:
        throw new Error(`지원하지 않는 검색 API: ${provider}`);
    }

    // 캐시 저장
    if (useCache) {
      this.saveToCache(cacheKey, result);
    }

    return { ...result, fromCache: false };
  }

  /**
   * Serper API 검색
   */
  async searchWithSerper(apiKey, query, options = {}) {
    const { type = 'search', num = 10, language = 'ko', country = 'kr' } = options;
    const config = SEARCH_APIS.serper;
    const endpoint = config.endpoints[type] || config.endpoints.search;

    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num,
        gl: country,
        hl: language
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Serper API 오류: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // 결과 정규화
    return this.normalizeSerperResults(data, type);
  }

  /**
   * Serper 결과 정규화
   */
  normalizeSerperResults(data, type) {
    const results = {
      provider: 'serper',
      query: data.searchParameters?.q || '',
      type,
      items: [],
      relatedSearches: [],
      knowledgeGraph: null
    };

    // 일반 검색 결과
    if (data.organic) {
      results.items = data.organic.map((item, index) => ({
        position: item.position || index + 1,
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        date: item.date || null,
        source: item.source || this.extractDomain(item.link)
      }));
    }

    // 뉴스 결과
    if (data.news) {
      results.items = data.news.map((item, index) => ({
        position: index + 1,
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        date: item.date,
        source: item.source,
        imageUrl: item.imageUrl
      }));
    }

    // 이미지 결과
    if (data.images) {
      results.items = data.images.map((item, index) => ({
        position: index + 1,
        title: item.title,
        url: item.link,
        imageUrl: item.imageUrl,
        thumbnailUrl: item.thumbnailUrl,
        source: item.source
      }));
    }

    // 연관 검색어
    if (data.relatedSearches) {
      results.relatedSearches = data.relatedSearches.map(item => item.query);
    }

    // 지식 그래프 (있는 경우)
    if (data.knowledgeGraph) {
      results.knowledgeGraph = {
        title: data.knowledgeGraph.title,
        type: data.knowledgeGraph.type,
        description: data.knowledgeGraph.description,
        attributes: data.knowledgeGraph.attributes || {}
      };
    }

    return results;
  }

  /**
   * Tavily API 검색
   */
  async searchWithTavily(apiKey, query, options = {}) {
    const { num = 10, searchDepth = 'basic' } = options;
    const config = SEARCH_APIS.tavily;

    const response = await fetch(`${config.baseUrl}${config.endpoints.search}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: searchDepth, // 'basic' or 'advanced'
        max_results: num,
        include_answer: true,
        include_raw_content: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tavily API 오류: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // 결과 정규화
    return this.normalizeTavilyResults(data);
  }

  /**
   * Tavily 결과 정규화
   */
  normalizeTavilyResults(data) {
    return {
      provider: 'tavily',
      query: data.query || '',
      type: 'search',
      answer: data.answer || null, // Tavily의 AI 요약 답변
      items: (data.results || []).map((item, index) => ({
        position: index + 1,
        title: item.title,
        url: item.url,
        snippet: item.content,
        score: item.score, // 관련성 점수
        source: this.extractDomain(item.url)
      })),
      relatedSearches: [],
      knowledgeGraph: null
    };
  }

  /**
   * 도메인 추출
   */
  extractDomain(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * 뉴스 검색 (Serper 전용)
   */
  async searchNews(query, options = {}) {
    return this.search(query, { ...options, type: 'news', provider: 'serper' });
  }

  /**
   * 이미지 검색 (Serper 전용)
   */
  async searchImages(query, options = {}) {
    return this.search(query, { ...options, type: 'images', provider: 'serper' });
  }

  /**
   * 주제에 대한 종합 정보 수집
   */
  async gatherInformation(topic, options = {}) {
    const {
      includeNews = true,
      maxResults = 5,
      provider
    } = options;

    const availableProvider = provider || this.getAvailableProviders()[0];
    if (!availableProvider) {
      throw new Error('사용 가능한 검색 API가 없습니다. 설정에서 API 키를 등록해주세요.');
    }

    const results = {
      topic,
      timestamp: new Date().toISOString(),
      webResults: [],
      newsResults: [],
      summary: null
    };

    // 웹 검색
    try {
      const webSearch = await this.search(topic, {
        provider: availableProvider,
        num: maxResults
      });
      results.webResults = webSearch.items;

      // Tavily는 AI 요약 제공
      if (webSearch.answer) {
        results.summary = webSearch.answer;
      }
    } catch (error) {
      console.error('웹 검색 실패:', error);
      results.errors = results.errors || [];
      results.errors.push({ type: 'web', message: error.message });
    }

    // 뉴스 검색 (Serper만 지원)
    if (includeNews && availableProvider === 'serper') {
      try {
        const newsSearch = await this.searchNews(topic, { num: maxResults });
        results.newsResults = newsSearch.items;
      } catch (error) {
        console.error('뉴스 검색 실패:', error);
        results.errors = results.errors || [];
        results.errors.push({ type: 'news', message: error.message });
      }
    }

    return results;
  }

  /**
   * 검색 결과를 프롬프트용 컨텍스트로 변환
   */
  formatAsContext(searchResults, options = {}) {
    const { maxItems = 5, includeUrls = true } = options;

    let context = '';

    // 웹 검색 결과
    if (searchResults.webResults?.length > 0) {
      context += '## 웹 검색 결과\n';
      searchResults.webResults.slice(0, maxItems).forEach((item, index) => {
        context += `\n### ${index + 1}. ${item.title}\n`;
        if (item.snippet) {
          context += `${item.snippet}\n`;
        }
        if (includeUrls) {
          context += `출처: ${item.source} (${item.url})\n`;
        }
      });
    }

    // 뉴스 검색 결과
    if (searchResults.newsResults?.length > 0) {
      context += '\n## 최신 뉴스\n';
      searchResults.newsResults.slice(0, maxItems).forEach((item, index) => {
        context += `\n### ${index + 1}. ${item.title}\n`;
        if (item.date) {
          context += `발행일: ${item.date}\n`;
        }
        if (item.snippet) {
          context += `${item.snippet}\n`;
        }
        if (includeUrls) {
          context += `출처: ${item.source}\n`;
        }
      });
    }

    // AI 요약 (Tavily)
    if (searchResults.summary) {
      context += `\n## AI 요약\n${searchResults.summary}\n`;
    }

    return context.trim();
  }

  /**
   * 특정 URL의 신뢰도 평가
   */
  evaluateSourceCredibility(url) {
    const domain = this.extractDomain(url);

    // 신뢰할 수 있는 도메인 목록 (예시)
    const trustedDomains = {
      // 공공기관
      'go.kr': 0.95,
      'gov.kr': 0.95,
      'or.kr': 0.8,

      // 주요 언론사
      'chosun.com': 0.85,
      'donga.com': 0.85,
      'joongang.co.kr': 0.85,
      'hani.co.kr': 0.85,
      'khan.co.kr': 0.85,
      'yna.co.kr': 0.9, // 연합뉴스
      'ytn.co.kr': 0.85,
      'kbs.co.kr': 0.9,
      'mbc.co.kr': 0.85,
      'sbs.co.kr': 0.85,

      // 전문 매체
      'wikipedia.org': 0.75,
      'namu.wiki': 0.6,
      'terms.naver.com': 0.8,

      // 기업/서비스
      'blog.naver.com': 0.5,
      'tistory.com': 0.5,
      'youtube.com': 0.5
    };

    // 도메인 매칭
    for (const [pattern, score] of Object.entries(trustedDomains)) {
      if (domain.endsWith(pattern)) {
        return {
          domain,
          score,
          level: this.getCredibilityLevel(score)
        };
      }
    }

    // 기본값
    return {
      domain,
      score: 0.5,
      level: 'unknown'
    };
  }

  /**
   * 신뢰도 레벨 반환
   */
  getCredibilityLevel(score) {
    if (score >= 0.9) return 'very_high';
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    if (score >= 0.4) return 'low';
    return 'very_low';
  }

  /**
   * 검색 결과에 신뢰도 점수 추가
   */
  addCredibilityScores(searchResults) {
    const withScores = { ...searchResults };

    if (withScores.webResults) {
      withScores.webResults = withScores.webResults.map(item => ({
        ...item,
        credibility: this.evaluateSourceCredibility(item.url)
      }));
    }

    if (withScores.newsResults) {
      withScores.newsResults = withScores.newsResults.map(item => ({
        ...item,
        credibility: this.evaluateSourceCredibility(item.url)
      }));
    }

    return withScores;
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    searchCache.clear();
  }

  /**
   * API 정보 반환
   */
  getApiInfo(provider) {
    return SEARCH_APIS[provider] || null;
  }
}

// 싱글톤 인스턴스
const webSearchService = new WebSearchService();

export { webSearchService, WebSearchService, SEARCH_APIS };
