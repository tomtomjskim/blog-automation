import { AI_FORBIDDEN_PHRASES } from '../constants';

/** 2단계 고도화용 리뷰 프롬프트 */
export function buildQualityReviewPrompt(draft: string): string {
  return `다음 블로그 글 초안을 고도화해주세요.

## 초안
${draft}

## 고도화 요청사항
1. 문장 흐름과 가독성 개선
2. SEO 키워드 밀도 최적화 (1-3%)
3. 소제목 구조 개선
4. 도입부와 마무리 강화
5. 불필요한 반복 제거
6. 구체적 예시나 데이터 보강

## 규칙
- 원본의 핵심 내용과 스타일 유지
- 마크다운 형식 유지 (# 제목, ## 소제목)
- 글 길이를 10-20% 정도 늘려도 됨

${AI_FORBIDDEN_PHRASES}

고도화된 글을 작성해주세요:`;
}
