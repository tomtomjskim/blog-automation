# 블로그 자동화 - 스타일 템플릿 v2 개선 설계

## 날짜: 2026-03-03

## 개요
기존 스타일별 추가 입력 템플릿 기능의 UX, 프롬프트 품질, 기능 확장 전방위 개선.

---

## Wave 1: UX 개선

### 1-A. 스마트 펼침
- `style-templates.ts`에 스타일별 `autoExpand` 플래그 추가
- 필드 5개 이상 스타일은 패널 자동 펼침
- 스타일 전환 시 새 스타일의 autoExpand에 따라 패널 상태 갱신

### 1-B. 완성도 시각화
- 접힌 상태에서 filledCount/totalCount 기반 프로그레스 도트 표시
- 작은 원형 도트 N개 (채워진=primary, 빈=muted)
- 패널 헤더 우측, chevron 왼쪽에 배치

### 1-C. 필드 그룹핑
- `TemplateField` 타입에 `group?: string` 속성 추가
- 그룹별 얇은 구분선 + 소제목(text-xs) 렌더링
- food_review 그룹: "기본 정보" / "리뷰" / "실용 정보"
- review 그룹: "제품 정보" / "평가" / "구매 정보"

### 1-D. 선택형 필드 타입
- `TemplateField.type`에 `'select' | 'rating' | 'toggle'` 추가
- `rating`: 1~5 별 클릭 UI (인라인)
- `toggle`: "O / X / 조건부" 3버튼 토글
- `select`: 드롭다운 (options 속성 추가)
- 적용 대상: rating→별점, revisit/repurchase→토글, best_for→셀렉트

---

## Wave 2: 프롬프트 품질 개선

### 2-A. 스타일별 직렬화 포맷 최적화
- food_review: 마크다운 표 형태
- review: 구조화 블록 형태
- informative: 목차 힌트 형태
- 기타: 기존 `[레이블] 값` 유지

### 2-B. 값 해석 → 톤 힌트 매핑
- rating >= 4.5 → "(높은 만족도 반영, 객관성 유지)"
- rating <= 2.5 → "(실망감 솔직하게, 건설적으로)"
- revisit === 'X' → "(재방문 의사 없음 이유 구체적 설명)"
- pros만 있고 cons 없으면 → "(단점도 1-2개 언급하여 균형 유지)"

### 2-C. 조건부 프롬프트 블록
- buildPromptHints(data, style) 함수 신규 생성
- 필드 유무에 따라 조건부 프롬프트 지시문 생성
- location 있음 → "찾아가는 길 섹션 상세 작성"
- location 없음 → "위치 정보는 '[확인 필요]'로 표기"

---

## Wave 3: 프리셋 저장/관리 + 히스토리 재사용

### 3-A. 프리셋 (DB 기반)

**스키마:**
```sql
CREATE TABLE blog_auto.form_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('template', 'full')),
  style VARCHAR(20) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API:** GET/POST/DELETE /api/form-presets

**UI:**
- 패널 상단에 프리셋 드롭다운 + "저장" 버튼
- 스타일별 필터링
- 폼 전체 저장은 생성 버튼 옆 "설정 저장" 버튼

### 3-B. 히스토리 재사용
- 히스토리 목록에 "이 설정으로 다시 쓰기" 버튼
- generations 레코드 → 쿼리파라미터로 인코딩 → 글쓰기 페이지 이동
- deserializeTemplateData(text, style) 역직렬화 함수

---

## Wave 4: 커스텀 스타일

### 3-C. 커스텀 스타일 정의

**스키마:**
```sql
CREATE TABLE blog_auto.custom_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '📝',
  description VARCHAR(100),
  system_prompt TEXT NOT NULL,
  fields JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API:** GET/POST/PUT/DELETE /api/custom-styles

**UI:**
- 스타일 선택 그리드에 기본 6개 + 커스텀 동적 추가
- "새 스타일" 카드 → 모달/페이지
- 기존 스타일 "복제" 옵션

---

## 수정 파일 예상

### Wave 1 (UX)
- src/lib/types.ts - TemplateField 타입 확장 (group, select options 등)
- src/lib/style-templates.ts - 그룹, autoExpand, 새 필드타입 적용
- src/components/style-template-fields.tsx - 그룹 렌더링, 별점/토글/셀렉트 UI

### Wave 2 (프롬프트)
- src/lib/style-templates.ts - 스타일별 직렬화 포맷
- src/lib/prompts.ts - buildPromptHints() + 조건부 블록

### Wave 3 (프리셋)
- DB 마이그레이션 (form_presets 테이블)
- src/app/api/form-presets/route.ts (신규)
- src/components/style-template-fields.tsx - 프리셋 UI
- src/components/generate-form.tsx - 폼 전체 프리셋
- src/components/history-list.tsx - 재사용 버튼

### Wave 4 (커스텀)
- DB 마이그레이션 (custom_styles 테이블)
- src/app/api/custom-styles/route.ts (신규)
- src/lib/style-templates.ts - 동적 스타일 로딩
- src/components/generate-form.tsx - 커스텀 스타일 표시
- src/app/custom-styles/page.tsx (신규) - 관리 페이지
- src/components/header.tsx - 커스텀 스타일 네비 링크 추가
- src/app/api/history/route.ts - tone, persona 필드 추가 반환

---

## 구현 상태

| Wave | 상태 | 완료일 |
|------|------|--------|
| Wave 1: UX 개선 | ✅ 완료 | 2026-03-03 |
| Wave 2: 프롬프트 품질 | ✅ 완료 | 2026-03-03 |
| Wave 3: 프리셋 + 히스토리 재사용 | ✅ 완료 | 2026-03-03 |
| Wave 4: 커스텀 스타일 | ✅ 완료 | 2026-03-03 |

### 실제 수정/생성 파일 (12개)

**수정 (6개)**
- `src/lib/types.ts` - TemplateField 확장 (group, options, rating/toggle/select)
- `src/lib/prompts.ts` - buildPromptHints 연동 + 정보 정확성 원칙
- `src/components/generate-form.tsx` - 커스텀 스타일 통합, searchParams 프리필
- `src/components/header.tsx` - 커스텀 스타일 네비 링크
- `src/components/history-list.tsx` - 재사용 버튼 (RotateCcw)
- `src/app/api/history/route.ts` - tone, persona 필드 반환

**신규 (6개)**
- `src/lib/style-templates.ts` - 6개 스타일 템플릿, 직렬화/역직렬화, promptHints
- `src/components/style-template-fields.tsx` - 별점/토글/셀렉트/그룹/프리셋 UI
- `src/app/api/form-presets/route.ts` - 프리셋 CRUD API
- `src/app/api/custom-styles/route.ts` - 커스텀 스타일 CRUD API
- `src/app/custom-styles/page.tsx` - 커스텀 스타일 관리 페이지
- `docs/plans/2026-03-03-template-v2-design.md` - 설계 문서

### Playwright 테스트 결과 (7/7 통과)
1. 맛집리뷰 스타일 필드 (그룹/별점/토글/셀렉트) ✅
2. 리뷰 스타일 + 자동 펼침 ✅
3. 일상형 기본 접힘 ✅
4. 히스토리 재사용 버튼 ✅
5. 커스텀 스타일 관리 페이지 ✅
6. 헤더 네비게이션 링크 ✅
7. URL 파라미터 프리필 ✅
