# Blog Automation v2.0

네이버 블로그에 최적화된 AI 글 생성 + 자동 포스팅 서비스.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **AI**: Claude CLI (subprocess)
- **Image**: Kling AI API (선택)
- **DB**: PostgreSQL (`blog_auto` schema)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Deploy**: Docker (포트 3005)

## 주요 기능

### Phase 1 - 콘텐츠 품질
- 네이버 C-Rank/D.I.A. SEO 엔진 (10항목 100점)
- 8종 페르소나 시스템 (뷰티, 맛집, IT, 여행, 자기계발, 육아, 재테크, 인테리어)
- 해요체/반말 톤 선택
- 5단계 글 길이 (short ~ premium 5000자)
- 이미지 최적화 (alt 텍스트, 배치 가이드)

### Phase 2 - 자동화
- 마크다운 → 네이버 HTML 변환 (인라인 스타일)
- XML-RPC 자동 포스팅 (임시저장/즉시 게시, 1일 2건 제한)
- AI 탐지 회피 자연화 파이프라인 (어휘 치환 + 문장 변동 + 경험담 삽입)
- 콘텐츠 캘린더 & 예약 발행 (5분 간격 폴링)

### Phase 3 - 분석
- AI 키워드 리서치 (주/보조/롱테일)
- 성과 대시보드 (생성 통계, SEO 추이, 비용 추적)
- 수동 지표 입력 (조회수, 방문자, 키워드 순위)

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 글 생성 (주제 입력 → AI 글 작성) |
| `/styles` | 내 스타일 프로필 관리 |
| `/keywords` | 키워드 리서치 |
| `/calendar` | 콘텐츠 캘린더 & 예약 |
| `/history` | 생성 히스토리 |
| `/dashboard` | 성과 대시보드 |
| `/settings` | 네이버 연동 & Kling AI 설정 |

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

## DB 스키마 (`blog_auto`)

| 테이블 | 용도 |
|--------|------|
| `generations` | 글 생성 기록 (+ 네이버 포스팅 정보) |
| `blog_settings` | key-value 설정 (네이버 API 등) |
| `scheduled_posts` | 예약 발행 |
| `keyword_research` | 키워드 리서치 결과 |
| `post_metrics` | 포스트 성과 지표 |

## 보안

- **IP 화이트리스트**: nginx에서 허용 IP만 접근 가능 (비공개 서비스)
- **1일 발행 제한**: 네이버 포스팅 최대 2건/일
- **키워드 스터핑 방지**: SEO 엔진에서 주키워드 7회 초과 경고

## 배포

```bash
# 빌드 & 배포
docker compose -f /home/ubuntu/docker-compose.yml build blog-automation
docker compose -f /home/ubuntu/docker-compose.yml up -d --no-deps blog-automation

# 로그 확인
docker compose -f /home/ubuntu/docker-compose.yml logs -f blog-automation
```

## 의존성

| 패키지 | 용도 |
|--------|------|
| `xmlrpc` | 네이버 XML-RPC 클라이언트 |
| `node-cron` | 예약 발행 스케줄러 |
| `recharts` | 대시보드 차트 |
