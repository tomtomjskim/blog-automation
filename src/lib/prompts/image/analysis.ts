import type { StyleId } from '@/lib/types';

/** 이미지 분석 프롬프트 빌더 — 이미지 내용 분석 + 배치 제안 JSON */
export function buildImageAnalysisPrompt(topic: string, style: StyleId): string {
  return `당신은 블로그 이미지 분석 전문가입니다.

첨부된 이미지를 분석하고, 아래 블로그 주제와 스타일에 맞게 각 이미지를 어디에 배치하면 좋을지 제안해주세요.

## 블로그 주제
${topic}

## 글쓰기 스타일
${style}

## 이미지 배치 원칙 (네이버 최적화)
- 첫 이미지: 도입부 직후 (네이버 썸네일 용도, 3:2 비율 권장)
- 이후: 각 H2 섹션 뒤 1장씩 배치
- alt 텍스트에 키워드 자연스럽게 포함

## 응답 형식 (JSON)
다음 JSON 배열로 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
[
  {
    "imageIndex": 0,
    "description": "이미지에 대한 간결한 설명 (alt 텍스트용, 키워드 포함)",
    "suggestedSection": "이미지를 배치할 소제목/섹션 제안",
    "context": "이미지가 글에 기여하는 맥락 설명 (1-2문장)"
  }
]`;
}
