# Prompt Generator 기능 설계

## 개요

현재 "글 작성하기" 버튼은 LLM API를 호출하여 전체 블로그 글을 생성합니다.
이는 API 비용이 발생하고, API 키가 필수입니다.

**Prompt Generator**는 사용자 입력을 바탕으로 LLM에 보낼 프롬프트만 생성하는 기능입니다.
- API 호출 없음 → 비용 0원
- API 키 불필요
- 생성된 프롬프트를 ChatGPT, Claude 등에 직접 복사/붙여넣기 가능

---

## 사용자 시나리오

### 시나리오 1: API 키 없는 사용자
1. 주제, 키워드, 스타일 등 입력
2. "프롬프트 생성" 버튼 클릭
3. 생성된 프롬프트 복사
4. ChatGPT/Claude 웹에서 붙여넣기 후 실행

### 시나리오 2: API 비용 절약
1. 입력값으로 프롬프트 먼저 확인
2. 프롬프트 품질 검토 후 수정
3. 만족스러우면 "글 작성하기"로 실제 생성

---

## UI 변경

### 버튼 레이아웃

**Before:**
```
[  ✏️ 글 작성하기  ]
```

**After:**
```
[  📋 프롬프트 생성  ] [  ✏️ 글 작성하기  ]
```

또는 드롭다운 방식:
```
[  ✏️ 글 작성하기 ▾  ]
    ├─ 글 작성하기 (API 호출)
    └─ 프롬프트만 생성 (무료)
```

### 추천: 두 버튼 분리

```html
<div class="form-actions">
  <button type="button" class="btn btn-secondary" id="generate-prompt-btn">
    <span class="btn-icon">📋</span>
    프롬프트 생성
  </button>
  <button type="submit" class="btn btn-primary" id="generate-btn">
    <span class="btn-icon">✏️</span>
    글 작성하기
  </button>
</div>
```

---

## 프롬프트 생성 로직

### 입력 데이터 수집

```javascript
const promptData = {
  topic: string,           // 주제
  keywords: string[],      // 키워드 목록
  style: string,           // 문체 (casual, formal, etc.)
  length: string,          // 길이 (short, medium, long)
  targetAudience: string,  // 대상 독자 (선택)
  additionalNotes: string, // 추가 지시사항 (선택)
  sections: string[],      // 포함할 섹션 (선택)
};
```

### 프롬프트 템플릿

```javascript
function generateBlogPrompt(data) {
  const styleMappings = {
    casual: '친근하고 대화체',
    formal: '격식있고 전문적인',
    storytelling: '스토리텔링 방식의',
    educational: '교육적이고 설명적인'
  };

  const lengthMappings = {
    short: '약 500-800자',
    medium: '약 1000-1500자',
    long: '약 2000-3000자'
  };

  return `
당신은 전문 블로그 작가입니다. 아래 조건에 맞는 블로그 글을 작성해주세요.

## 주제
${data.topic}

## 키워드 (필수 포함)
${data.keywords.join(', ')}

## 작성 스타일
${styleMappings[data.style] || data.style} 문체로 작성해주세요.

## 글 길이
${lengthMappings[data.length] || data.length}

${data.targetAudience ? `## 대상 독자\n${data.targetAudience}\n` : ''}
${data.additionalNotes ? `## 추가 지시사항\n${data.additionalNotes}\n` : ''}

## 글 구조
1. 주목을 끄는 제목 (SEO 최적화)
2. 흥미로운 도입부
3. 핵심 내용 (소제목으로 구분)
4. 실용적인 팁 또는 인사이트
5. 마무리 및 행동 유도(CTA)

## 출력 형식
- 마크다운 형식으로 작성
- 제목은 # 사용
- 소제목은 ## 또는 ### 사용
- 핵심 포인트는 불릿 리스트 사용
- 이모지 적절히 활용
`.trim();
}
```

---

## 결과 표시 UI

### 프롬프트 결과 모달/패널

```html
<div class="prompt-result">
  <div class="prompt-result-header">
    <h3>📋 생성된 프롬프트</h3>
    <div class="prompt-result-actions">
      <button class="btn btn-sm btn-ghost" id="copy-prompt-btn">
        📋 복사
      </button>
      <button class="btn btn-sm btn-ghost" id="edit-prompt-btn">
        ✏️ 수정
      </button>
    </div>
  </div>

  <div class="prompt-result-content">
    <pre id="generated-prompt">{프롬프트 내용}</pre>
  </div>

  <div class="prompt-result-footer">
    <p class="prompt-hint">
      💡 이 프롬프트를 ChatGPT, Claude 등에 붙여넣어 글을 생성하세요.
    </p>
    <div class="prompt-actions">
      <button class="btn btn-secondary" id="close-prompt-btn">
        닫기
      </button>
      <button class="btn btn-primary" id="use-prompt-btn">
        이 프롬프트로 글 작성하기
      </button>
    </div>
  </div>
</div>
```

---

## 파일 수정 목록 (검수 후 수정)

### 기존 코드 재사용
- `blog-generator.js`의 `buildPrompt()` 메서드 활용
- `STYLE_PROMPTS` 객체 활용

### 수정 필요 파일

| 파일 | 변경 내용 |
|------|----------|
| `js/services/blog-generator.js` | `getFullPrompt()` 메서드 추가 (buildPrompt + systemPrompt 반환) |
| `js/pages/write.js` | "프롬프트 생성" 버튼 추가, 핸들러 구현 |
| `js/ui/prompt-result-modal.js` | **신규** - 결과 표시 모달 |

### 신규 파일
```
js/ui/prompt-result-modal.js  # 프롬프트 결과 모달만 추가
```

---

## API 없이 사용 시 UX 개선

### LLM Indicator 변경

API 키가 없을 때:
```
[🤖 AI 모델 미설정] [설정] [프롬프트 모드]
```

"프롬프트 모드" 클릭 시:
- "글 작성하기" 버튼 비활성화
- "프롬프트 생성" 버튼만 활성화
- 안내 문구: "프롬프트만 생성합니다. 외부 AI에서 사용하세요."

---

## 구현 단계

### Phase 1: 핵심 기능
1. `prompt-generator.js` 서비스 생성
2. `write.js`에 "프롬프트 생성" 버튼 추가
3. 프롬프트 결과 표시 (간단한 모달)
4. 복사 기능

### Phase 2: UX 개선
1. 프롬프트 편집 기능
2. 프롬프트 템플릿 저장/불러오기
3. "이 프롬프트로 글 작성하기" 버튼

### Phase 3: 고급 기능
1. 다양한 프롬프트 스타일 (SEO, 소셜미디어, 뉴스레터)
2. 프롬프트 히스토리
3. 프롬프트 공유 기능

---

## 예상 효과

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| API 키 필수 여부 | 필수 | 선택 (프롬프트 모드) |
| 최소 비용 | API 호출 비용 | 0원 |
| 사용 가능 범위 | API 키 보유자 | 모든 사용자 |
| 프롬프트 커스터마이징 | 불가 | 가능 |

---

## 승인 후 구현 예정

위 설계 확인 후 구현을 진행합니다.
