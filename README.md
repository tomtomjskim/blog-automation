# Blog Automation v2.5

네이버 블로그에 최적화된 AI 글 생성 + 자동 포스팅 서비스.

> Claude CLI로 블로그 글을 생성하고, SEO 최적화 후 네이버에 자동 발행합니다.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | Next.js 15 (App Router) + React 19 |
| AI | Claude CLI (subprocess) |
| Image Gen | Kling AI API (선택) |
| DB | PostgreSQL (`blog_auto` schema) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Deploy | Docker (포트 3005, IP whitelist) |

## 핵심 기능

### 글 생성
- **6개 내장 스타일**: 일상형, 정보형, 리뷰형, 맛집리뷰, 마케팅형, 스토리형
- **커스텀 스타일**: 나만의 글쓰기 스타일 정의 (시스템 프롬프트 + 필드 구성)
- **구조화 입력 템플릿**: 스타일별 전용 필드 (별점, 토글, 드롭다운, 그룹핑)
- **8종 페르소나**: 뷰티 크리에이터, 맛집 탐험러, IT/테크 리뷰어 등
- **해요체/반말** 톤 선택, **5단계 글 길이** (500~5000자)
- **빠른/고품질** 생성 모드 (1회 vs 2회 Claude 호출)
- **자연화 파이프라인**: AI 특유 표현 → 자연스러운 구어체 변환
- **프리셋 저장**: 자주 쓰는 템플릿 설정을 저장/불러오기

### SEO 최적화
- 네이버 C-Rank / D.I.A. 기반 **10항목 100점** SEO 엔진
- 키워드 스터핑 방지 (주키워드 7회 초과 경고)
- 이미지 alt 텍스트 최적화
- AI 키워드 리서치 (주/보조/롱테일)

### 자동 발행
- 마크다운 → 네이버 HTML 변환 (인라인 스타일)
- XML-RPC 자동 포스팅 (임시저장/즉시 게시)
- 콘텐츠 캘린더 & 예약 발행 (5분 간격 폴링)
- 1일 2건 발행 제한

### 분석
- 생성 통계, SEO 추이, 비용 추적 대시보드
- 수동 지표 입력 (조회수, 방문자, 키워드 순위)
- 히스토리 검색/필터 + **이전 설정 재사용** 버튼

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 글 생성 폼 (주제 입력 → AI 글 작성) |
| `/styles` | 내 스타일 프로필 관리 (기존 글 학습) |
| `/custom-styles` | 커스텀 스타일 정의/관리 |
| `/keywords` | AI 키워드 리서치 |
| `/calendar` | 콘텐츠 캘린더 & 예약 발행 |
| `/history` | 생성 히스토리 (재사용 지원) |
| `/dashboard` | 성과 대시보드 |
| `/settings` | 네이버 연동 & Kling AI 설정 |
| `/result/[id]` | 생성 결과 상세 & 편집 |

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/generate` | 글 생성 |
| GET | `/api/generate/:id` | 생성 결과 조회 |
| GET/PATCH | `/api/settings` | 설정 조회/저장 |
| POST | `/api/post` | 네이버 포스팅 |
| GET | `/api/naver/categories` | 네이버 카테고리 |
| GET/POST | `/api/schedule` | 예약 목록/생성 |
| GET/POST | `/api/keywords` | 키워드 리서치 |
| GET/POST | `/api/metrics` | 통계/지표 |
| GET/DELETE | `/api/history` | 히스토리 조회/삭제 |
| GET/POST/DELETE | `/api/form-presets` | 폼 프리셋 CRUD |
| GET/POST/PUT/DELETE | `/api/custom-styles` | 커스텀 스타일 CRUD |
| GET/POST | `/api/style-profile` | 스타일 프로필 |

## DB 스키마 (`blog_auto`)

| 테이블 | 용도 |
|--------|------|
| `generations` | 글 생성 기록 (네이버 포스팅 정보 포함) |
| `blog_settings` | key-value 설정 저장소 |
| `scheduled_posts` | 예약 발행 큐 |
| `keyword_research` | 키워드 리서치 결과 |
| `post_metrics` | 포스트 성과 지표 |
| `form_presets` | 폼 프리셋 (template/full) |
| `custom_styles` | 커스텀 스타일 정의 |

## 스타일 템플릿 시스템

글쓰기 스타일별로 구조화된 입력 필드를 제공합니다.

| 스타일 | 전용 필드 | 자동 펼침 |
|--------|----------|----------|
| 맛집리뷰 | 음식점명, 위치, 가격, 영업시간, 추천메뉴, 별점, 재방문, 추천상황 | O |
| 리뷰형 | 제품명, 사용기간, 장단점, 별점, 재구매, 구매가, 구매처 | O |
| 정보형 | 핵심 팩트, 대상 독자, 출처, 구조 힌트 | X |
| 일상형 | 나의 경험, 분위기, CTA | X |
| 마케팅형 | 제품/서비스, 타겟, USP, CTA, 가격 | X |
| 스토리형 | 배경, 등장인물, 전환점, 교훈 | X |

**필드 타입**: 텍스트, 텍스트영역, 별점(1~5), 토글(O/X/조건부), 드롭다운 셀렉트

## 보안

- **IP 화이트리스트**: nginx에서 허용 IP만 접근 (비공개 서비스)
- **1일 발행 제한**: 네이버 포스팅 최대 2건/일
- **정보 정확성 원칙**: 미제공 정보(가격, 위치 등)는 AI가 추측하지 않음

## 배포

```bash
# 빌드 & 배포
docker compose build blog-automation
docker compose up -d --no-deps blog-automation

# 로그 확인
docker compose logs -f blog-automation
```

## 주요 의존성

| 패키지 | 용도 |
|--------|------|
| `xmlrpc` | 네이버 XML-RPC 클라이언트 |
| `node-cron` | 예약 발행 스케줄러 |
| `recharts` | 대시보드 차트 |
| `lucide-react` | 아이콘 |
| `@radix-ui/*` | shadcn/ui 기반 컴포넌트 |
