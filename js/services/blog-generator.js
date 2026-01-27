/**
 * Blog Automation - Blog Generator Service
 * 블로그 글 생성 서비스
 */

import { llmService } from './llm-service.js';
import { storage } from '../core/storage.js';
import { eventBus, EVENT_TYPES } from '../core/events.js';
import { buildFoodReviewPrompt } from './food-review-helper.js';

// 글 스타일별 시스템 프롬프트
const STYLE_PROMPTS = {
  casual: `당신은 친근하고 대화하듯 글을 쓰는 네이버 블로그 작가입니다.

특징:
- 이모지를 적절히 활용 (과하지 않게, 1-2개/문단)
- 개인적인 경험과 감상 포함
- 독자와 대화하는 느낌
- 문단은 3-4문장으로 짧게
- 마지막에 독자에게 질문이나 의견 요청

금지:
- 딱딱한 공식적 문체
- 광고성 표현
- 과도한 정보 나열`,

  informative: `당신은 정확하고 유용한 정보를 전달하는 블로그 작가입니다.

특징:
- 체계적인 구조 (목차 형식)
- 명확한 설명과 예시
- 리스트와 표 활용
- 핵심 요약 포함
- 신뢰성 있는 정보 제공

금지:
- 불확실한 정보
- 주관적 의견 과다
- 두서없는 구성`,

  review: `당신은 솔직하고 균형 잡힌 리뷰를 작성하는 블로그 작가입니다.

특징:
- 장점과 단점 명확히 구분
- 실제 사용 경험 기반
- 추천 대상 명시
- 평가 요약 (별점 형태)
- 구체적인 예시

금지:
- 일방적 칭찬만
- 근거 없는 비판
- 광고성 표현`,

  marketing: `당신은 효과적으로 가치를 전달하는 마케팅 글 작가입니다.

특징:
- 독자의 니즈와 연결
- 후킹 제목
- 문제 제기 → 해결책 제시
- 행동 유도 (CTA)
- SEO 키워드 자연스럽게 포함

금지:
- 과장된 표현
- 허위 정보
- 스팸성 키워드 반복`,

  story: `당신은 몰입감 있는 이야기를 쓰는 블로그 작가입니다.

특징:
- 시간순 또는 기승전결 구조
- 생생한 묘사와 감정
- 대화 활용
- 여운 있는 마무리
- 독자의 공감 유도

금지:
- 단조로운 나열
- 감정 과잉
- 현실성 없는 전개`,

  food_review: `당신은 음식과 맛집을 생생하게 표현하는 전문 푸드 블로거입니다.

특징:
- 5감을 활용한 감각적 맛 표현 (식감, 향, 온도, 비주얼, 소리)
- 구체적인 맛 묘사 ("고소한 참기름 향이 입안 가득", "겉바속촉의 완벽한 튀김")
- 메뉴별 상세 평가 및 추천
- 가격 대비 만족도 솔직한 평가
- 실용 정보 필수 포함 (주차, 웨이팅, 예약, 브레이크타임)

필수 포함 정보:
- ⭐ 총점 (5점 만점, 맛/서비스/분위기/가성비 세부 평가)
- 💰 1인 예상 비용
- 📍 위치 및 찾아가는 방법
- 🅿️ 주차 정보
- ⏰ 영업시간 및 브레이크타임
- 📱 예약 가능 여부
- 👥 추천 인원/상황 (데이트, 가족모임, 혼밥 등)

사진 가이드:
- [사진1: 가게 외관] 형태로 사진 위치 표시
- 메뉴 사진은 각도, 조명, 구도 팁 포함

금지:
- "최고의", "역대급", "미쳤다" 등 과장된 표현
- 확인되지 않은 영업정보
- 무조건적인 칭찬만 (단점도 솔직하게)
- 광고성/협찬 느낌의 문체`
};

// 글 길이 설정
const LENGTH_CONFIG = {
  short: { chars: 500, tokens: 1500, label: '짧게 (~500자)' },
  medium: { chars: 1000, tokens: 3000, label: '보통 (~1000자)' },
  long: { chars: 2000, tokens: 5000, label: '길게 (~2000자)' }
};

class BlogGenerator {
  constructor() {
    this.llmService = llmService;
  }

  /**
   * 블로그 글 생성
   */
  async generate(input) {
    const {
      topic,
      keywords = [],
      style = 'casual',
      length = 'medium',
      additionalInfo = '',
      referenceUrl = '',
      provider = 'anthropic',
      model,
      foodReviewOptions = null  // 음식 리뷰 전용 옵션
    } = input;

    // 시스템 프롬프트 (스타일별)
    const systemPrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.casual;

    // 사용자 프롬프트 생성
    const userPrompt = this.buildPrompt({
      topic,
      keywords,
      length,
      additionalInfo,
      referenceUrl,
      style,
      foodReviewOptions
    });

    // LLM 호출
    const result = await this.llmService.generateText(provider, userPrompt, {
      model,
      systemPrompt,
      maxTokens: LENGTH_CONFIG[length]?.tokens || 3000,
      temperature: 0.7
    });

    // 결과 파싱 및 반환
    const parsed = this.parseResult(result.content);

    return {
      ...result,
      ...parsed,
      style,
      keywords,
      length,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 스트리밍으로 블로그 글 생성
   */
  async *generateStream(input) {
    const {
      topic,
      keywords = [],
      style = 'casual',
      length = 'medium',
      additionalInfo = '',
      referenceUrl = '',
      provider = 'anthropic',
      model,
      foodReviewOptions = null  // 음식 리뷰 전용 옵션
    } = input;

    const systemPrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.casual;
    const userPrompt = this.buildPrompt({
      topic,
      keywords,
      length,
      additionalInfo,
      referenceUrl,
      style,
      foodReviewOptions
    });

    let fullContent = '';

    for await (const chunk of this.llmService.generateTextStream(provider, userPrompt, {
      model,
      systemPrompt,
      maxTokens: LENGTH_CONFIG[length]?.tokens || 3000,
      temperature: 0.7
    })) {
      if (chunk.type === 'delta') {
        fullContent += chunk.content;
        yield chunk;
      } else if (chunk.type === 'done') {
        const parsed = this.parseResult(fullContent);

        yield {
          ...chunk,
          ...parsed,
          style,
          keywords,
          length,
          generatedAt: new Date().toISOString()
        };
      }
    }
  }

  /**
   * 프롬프트 생성
   */
  buildPrompt({ topic, keywords, length, additionalInfo, referenceUrl, style, foodReviewOptions }) {
    const lengthGuide = LENGTH_CONFIG[length]?.label || '약 1000자 내외';

    // 음식 리뷰 스타일인 경우 전용 프롬프트 빌더 사용
    if (style === 'food_review') {
      return this.buildFoodReviewPromptWrapper({
        topic,
        keywords,
        length,
        lengthGuide,
        additionalInfo,
        referenceUrl,
        foodReviewOptions
      });
    }

    let prompt = `다음 조건으로 네이버 블로그 글을 작성해주세요.

## 주제
${topic}

## 키워드
${keywords.length > 0 ? keywords.join(', ') : '(키워드 없음 - 주제에서 자동 추출)'}

## 글 길이
${lengthGuide}
`;

    if (additionalInfo) {
      prompt += `
## 추가 정보
${additionalInfo}
`;
    }

    if (referenceUrl) {
      prompt += `
## 참고 URL
${referenceUrl}
`;
    }

    prompt += `
## 작성 요청사항
1. 제목을 # 마크다운으로 먼저 작성 (흥미롭고 클릭하고 싶은 제목)
2. 소제목은 ## 마크다운으로 구조화 (3-5개 섹션)
3. 키워드를 자연스럽게 포함 (SEO 고려)
4. 네이버 블로그에 바로 복사해서 사용할 수 있는 형태로 작성
5. 마크다운 형식 유지

글을 작성해주세요:`;

    return prompt;
  }

  /**
   * 음식 리뷰 전용 프롬프트 래퍼
   */
  buildFoodReviewPromptWrapper({ topic, keywords, length, lengthGuide, additionalInfo, referenceUrl, foodReviewOptions }) {
    // foodReviewOptions가 있으면 전용 빌더 사용
    if (foodReviewOptions && foodReviewOptions.restaurantName) {
      const fullPrompt = buildFoodReviewPrompt({
        ...foodReviewOptions,
        additionalNotes: additionalInfo
      });

      return `${fullPrompt}

## 글 길이
${lengthGuide}

## 작성 형식
1. 제목을 # 마크다운으로 먼저 작성
2. 소제목은 ## 마크다운으로 구조화
3. 마크다운 형식 유지
4. 사진 위치는 [사진: 설명] 형태로 표시`;
    }

    // 기본 음식 리뷰 프롬프트 (간소화 버전)
    let prompt = `다음 조건으로 음식점 리뷰 블로그 글을 작성해주세요.

## 음식점/메뉴 정보
${topic}

## 키워드
${keywords.length > 0 ? keywords.join(', ') : '(음식점명, 메뉴명, 위치 등에서 자동 추출)'}

## 글 길이
${lengthGuide}
`;

    if (additionalInfo) {
      prompt += `
## 추가 정보 (맛, 분위기, 가격 등)
${additionalInfo}
`;
    }

    if (referenceUrl) {
      prompt += `
## 참고 URL (네이버 플레이스, 인스타 등)
${referenceUrl}
`;
    }

    prompt += `
## 음식 리뷰 필수 포함사항
1. **총평 및 별점** (5점 만점)
   - 맛: ⭐⭐⭐⭐⭐
   - 서비스: ⭐⭐⭐⭐
   - 분위기: ⭐⭐⭐⭐
   - 가성비: ⭐⭐⭐⭐

2. **맛 표현** (5감 활용)
   - 식감, 향, 온도, 비주얼 등 구체적 묘사
   - "겉바속촉", "불향이 배인", "입안 가득 퍼지는" 등

3. **실용 정보**
   - 💰 1인 예상 비용
   - 📍 위치/찾아가는 방법
   - 🅿️ 주차 정보
   - ⏰ 영업시간
   - 📱 예약 가능 여부
   - 👥 추천 상황 (데이트/가족/혼밥 등)

4. **사진 배치**
   - [사진: 가게 외관]
   - [사진: 대표 메뉴]
   - [사진: 음식 클로즈업]
   - [사진: 내부 분위기]

## 작성 형식
1. 제목을 # 마크다운으로 먼저 작성
2. 소제목은 ## 마크다운으로 구조화
3. 마크다운 형식 유지

## 주의사항
- 과장된 표현 자제 ("인생맛집", "역대급" 등)
- 확인되지 않은 정보는 "확인 필요"로 표시
- 장점과 단점 균형있게 서술

글을 작성해주세요:`;

    return prompt;
  }

  /**
   * 결과 파싱
   */
  parseResult(content) {
    // 제목 추출
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 본문 (제목 제외)
    const body = content.replace(/^#\s+.+$/m, '').trim();

    // 글자 수
    const charCount = content.replace(/[#\s\n]/g, '').length;

    // 예상 읽기 시간 (분당 500자 기준)
    const readTime = Math.ceil(charCount / 500);

    // 소제목 추출
    const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map(m => m[1]);

    return {
      title,
      body,
      content,
      charCount,
      readTime,
      headings
    };
  }

  /**
   * 글 재생성
   */
  async regenerate(originalResult, newOptions = {}) {
    const input = {
      topic: originalResult.title || originalResult.topic,
      keywords: originalResult.keywords || [],
      style: newOptions.style || originalResult.style || 'casual',
      length: newOptions.length || originalResult.length || 'medium',
      provider: newOptions.provider || originalResult.provider,
      model: newOptions.model
    };

    return this.generate(input);
  }

  /**
   * 이미지 프롬프트 생성
   */
  async generateImagePrompt(blogContent, provider = 'anthropic') {
    const prompt = `다음 블로그 글의 내용을 바탕으로 대표 이미지를 위한 영문 프롬프트를 작성해주세요.

블로그 글:
"""
${blogContent.substring(0, 2000)}
"""

요구사항:
1. 영문으로 작성
2. 블로그 글의 핵심 주제를 시각적으로 표현
3. 상세한 묘사 (색상, 구도, 분위기)
4. 100단어 이내
5. 프롬프트만 출력 (설명 없이)`;

    const result = await this.llmService.generateText(provider, prompt, {
      maxTokens: 300,
      temperature: 0.8
    });

    return result.content.trim();
  }

  /**
   * SEO 분석
   */
  analyzeSEO(content, keywords = []) {
    const analysis = {
      score: 0,
      maxScore: 100,
      items: []
    };

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
        return acc + (contentLower.match(new RegExp(k.toLowerCase(), 'g')) || []).length;
      }, 0);
      const density = (keywordCount / (charCount / 100)).toFixed(1);

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

  /**
   * 스타일 목록 반환
   */
  getStyles() {
    return [
      { id: 'casual', name: '일상형', icon: '💬', description: '친근하고 캐주얼한 문체' },
      { id: 'informative', name: '정보형', icon: '📚', description: '체계적이고 상세한 정보' },
      { id: 'review', name: '리뷰형', icon: '⭐', description: '균형 잡힌 평가와 추천' },
      { id: 'food_review', name: '맛집리뷰', icon: '🍽️', description: '음식점/카페 전문 리뷰' },
      { id: 'marketing', name: '마케팅형', icon: '🎯', description: '홍보와 판매 유도' },
      { id: 'story', name: '스토리형', icon: '📖', description: '몰입감 있는 이야기체' }
    ];
  }

  /**
   * 길이 옵션 반환
   */
  getLengthOptions() {
    return Object.entries(LENGTH_CONFIG).map(([id, config]) => ({
      id,
      ...config
    }));
  }


  /**
   * 전체 프롬프트 반환 (API 호출 없이)
   * - systemPrompt: 스타일별 시스템 프롬프트
   * - userPrompt: 사용자 입력 기반 프롬프트
   */
  getFullPrompt(input) {
    const {
      style = 'casual',
      topic,
      keywords = [],
      length = 'medium',
      additionalInfo = '',
      referenceUrl = '',
      foodReviewOptions = null
    } = input;

    // 시스템 프롬프트 (스타일별)
    const systemPrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.casual;

    // 사용자 프롬프트 생성
    const userPrompt = this.buildPrompt({
      topic,
      keywords,
      length,
      additionalInfo,
      referenceUrl,
      style,
      foodReviewOptions
    });

    return { systemPrompt, userPrompt };
  }
}

// 싱글톤 인스턴스
const blogGenerator = new BlogGenerator();

export { blogGenerator, BlogGenerator, STYLE_PROMPTS, LENGTH_CONFIG };
