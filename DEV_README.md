# Blog Automation - 개발 현황

> 최종 업데이트: 2026-01-09
> 담당: Claude Code

---

## 현재 상태: Phase 1 MVP 완료 + 이미지 업로드 구현

```
[완료] Phase 1 MVP - 기본 기능
[완료] 이미지 업로드 기능 (2026-01-09)
[대기] Phase 2 - 고도화 기능
[대기] Phase 3 - 부가 기능
```

---

## 최근 완료 작업 (2026-01-09)

### 이미지 업로드 기능

| 파일 | 설명 |
|------|------|
| `js/utils/helpers.js` | 공통 유틸리티 (escapeHtml, formatFileSize 등) |
| `js/services/image-uploader.js` | 이미지 처리 서비스 |
| `js/ui/image-upload-zone.js` | 업로드 UI 컴포넌트 |
| `css/components.css` | 이미지 업로드 스타일 추가 |
| `js/pages/home.js` | 홈 페이지에 이미지 업로드 통합 |

**구현 기능:**
- 드래그&드롭, 클릭, 클립보드(Ctrl+V) 업로드
- 자동 리사이징 (최대 1920px), 압축 (85%)
- EXIF 자동 제거 (Canvas 처리)
- 썸네일 미리보기, Alt 텍스트 편집
- Base64 변환 (네이버 블로그용)

---

## 다음 구현 대상 (우선순위순)

### P1 - 높음

| 기능 | 문서 | 복잡도 | 설명 |
|------|------|--------|------|
| **템플릿 시스템** | 08번 2.1절 | 낮음 | 자주 쓰는 설정 저장/재사용 |
| **예약 포스팅** | 07번 1절 | 높음 | 날짜/시간 선택, 자동 발행 |

### P2 - 중간

| 기능 | 문서 | 복잡도 | 설명 |
|------|------|--------|------|
| SEO 분석 | 07번 3절 | 중간 | 키워드 밀도, 가독성 점수 |
| 대량 생성 | 07번 2절 | 높음 | CSV 업로드, 배치 처리 |
| 마크다운 미리보기 | 08번 3.1절 | 중간 | 실시간 렌더링 |
| 콘텐츠 통계 | 08번 3.2절 | 낮음 | 글자수, 읽기 시간 |

### P3 - 낮음

| 기능 | 문서 | 복잡도 | 설명 |
|------|------|--------|------|
| 사용량 통계 | 07번 4절 | 중간 | API 비용, 토큰 추적 |
| PWA 오프라인 | 07번 5절 | 중간 | Service Worker |
| 시리즈 관리 | 08번 2.3절 | 중간 | 연재물 관리 |

---

## 설계 문서 위치

```
/home/deploy/docs/blog-automation/
├── 00-index.md              # 인덱스
├── 01-design-guide.md       # 디자인 가이드
├── 02-ui-components.md      # UI 컴포넌트
├── 03-screens-flow.md       # 화면 구성
├── 04-llm-api-architecture.md # LLM API
├── 05-technical-spec.md     # 기술 명세 ⭐
├── 06-advanced-features.md  # 고급 기능
├── 07-phase2-implementation-plan.md  # Phase 2-3 구현 계획 ⭐
└── 08-enhancement-features.md        # 고도화 기능 설계 ⭐
```

**⭐ 구현 시 필수 참조**

---

## 프로젝트 구조

```
/home/deploy/projects/blog-automation/
├── index.html
├── css/
│   ├── variables.css      # CSS 변수 (Toss 스타일)
│   ├── base.css           # 기본 스타일
│   └── components.css     # 컴포넌트 스타일
├── js/
│   ├── app.js             # 앱 진입점
│   ├── state.js           # 상태 관리
│   ├── core/
│   │   ├── crypto.js      # AES-GCM 암호화
│   │   ├── storage.js     # localStorage 래퍼
│   │   ├── router.js      # 해시 라우터
│   │   └── events.js      # 이벤트 버스
│   ├── utils/
│   │   └── helpers.js     # 유틸리티 함수 [NEW]
│   ├── providers/
│   │   ├── anthropic.js   # Claude API (기본)
│   │   ├── openai.js
│   │   ├── google.js
│   │   ├── groq.js
│   │   └── stability.js   # 이미지 생성
│   ├── services/
│   │   ├── llm-service.js
│   │   ├── blog-generator.js
│   │   ├── naver-blog.js
│   │   └── image-uploader.js  [NEW]
│   ├── ui/
│   │   ├── components.js
│   │   ├── toast.js
│   │   ├── modal.js
│   │   └── image-upload-zone.js  [NEW]
│   ├── pages/
│   │   ├── home.js        # 메인 페이지 [MODIFIED]
│   │   ├── result.js
│   │   ├── settings.js
│   │   ├── image.js
│   │   └── history.js
│   └── features/
│       ├── streaming.js
│       ├── keyboard.js
│       └── autosave.js
├── templates/
│   └── prompts.json
└── nginx/
    └── blog-automation.conf
```

---

## 빠른 시작 가이드

### 로컬 테스트
```bash
# 프로젝트 디렉토리
cd /home/deploy/projects/blog-automation

# 정적 서버 실행 (필요시)
python3 -m http.server 3005

# 브라우저 접속
# http://localhost:3005 또는 http://203.245.30.6:3005
```

### 배포 (Docker)
```bash
# 서비스 없음 - 정적 파일만 nginx로 서빙
# nginx 설정: /home/deploy/nginx/conf.d/port-based.conf
```

---

## 개발 컨벤션

### JavaScript
- ES6 모듈 (import/export)
- 클래스 기반 서비스
- JSDoc 주석
- 싱글톤 패턴 (서비스)

### CSS
- CSS 변수 사용 (`--primary`, `--space-4` 등)
- BEM 유사 네이밍
- 다크모드: `[data-theme="dark"]`

### 상태 관리
```javascript
import { store, updateCurrentGeneration } from './state.js';

// 상태 읽기
const { currentGeneration } = store.getState();

// 상태 업데이트
updateCurrentGeneration({ topic: '새 주제' });
```

### 이벤트
```javascript
import { eventBus, EVENT_TYPES } from './core/events.js';

// 이벤트 발행
eventBus.emit(EVENT_TYPES.GENERATE_COMPLETE, result);

// 이벤트 구독
eventBus.on(EVENT_TYPES.GENERATE_COMPLETE, (result) => { ... });
```

---

## 다음 세션 권장 작업

### 옵션 1: 템플릿 시스템 (P1, 낮은 복잡도)
```
참조: 08-enhancement-features.md 2.1절
파일:
- js/services/template-manager.js (신규)
- js/ui/template-selector.js (신규)
- js/pages/home.js (수정 - 템플릿 선택 UI 추가)
```

### 옵션 2: SEO 분석 (P2, 중간 복잡도)
```
참조: 07-phase2-implementation-plan.md 3절
파일:
- js/services/seo-analyzer.js (신규)
- js/ui/seo-panel.js (신규)
- js/pages/result.js (수정 - SEO 패널 추가)
```

### 옵션 3: 콘텐츠 통계 (P2, 낮은 복잡도)
```
참조: 08-enhancement-features.md 3.2절
파일:
- js/ui/content-stats.js (신규)
- js/pages/home.js, result.js (수정)
```

---

## 알려진 이슈

- [ ] 이미지 업로드 후 글 생성 시 이미지 자동 삽입 로직 미구현
- [ ] 결과 페이지에서 이미지 삽입 UI 미구현
- [ ] 네이버 블로그 API 연동 테스트 필요

---

## 연락처

- 설계 문서: `/home/deploy/docs/blog-automation/`
- 서버 문서: `/home/deploy/CLAUDE.md`
- 이슈: 현재 git 미연동 상태
