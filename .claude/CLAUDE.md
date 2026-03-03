# Blog Automation - Project Instructions

## Overview
네이버 블로그 최적화 AI 글 생성 + 자동 포스팅 서비스 (v2.5).
Next.js 15 App Router + Claude CLI subprocess + PostgreSQL.
스타일별 구조화 입력 템플릿 + 프리셋 저장 + 커스텀 스타일 정의 지원.

## Architecture
- **Port**: 3005 (IP whitelist, 비공개)
- **Container**: blog-automation (172.20.0.17:3000)
- **DB**: PostgreSQL `blog_auto` schema (maindb, appuser)
- **Claude CLI**: `/usr/local/bin/claude` (Docker volume mount via symlink)

## Key Patterns

### DB Access
```typescript
// query<T>() returns T[] directly, NOT { rows: T[] }
const result = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM ...');
const count = parseInt(result[0]?.count || '0');

// queryOne<T>() returns T | null
const row = await queryOne<{ value: string }>('SELECT value FROM ...');
```

### Claude CLI Subprocess
```typescript
// src/lib/claude.ts - spawnClaude() 패턴
// stdin으로 프롬프트 전달, stdout에서 마크다운 결과 수집
// Docker 내에서 /usr/local/bin/claude 실행
```

### Component Imports
```typescript
// shadcn/ui components: src/components/ui/
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
```

## DB Schema (blog_auto)

### generations
Core table. Columns include: id, topic, keywords, style, length, mode, tone, persona,
title, content, char_count, seo_score, status, error, cost_usd,
naturalization_score, naturalization_changes (JSONB),
naver_post_id, naver_post_url, published_at, publish_status.

### blog_settings
Key-value store: `naver_blog_id`, `naver_api_password`.

### scheduled_posts
Scheduled generation queue. Status: pending → running → completed/failed.

### keyword_research
AI keyword suggestions: primary, secondary, long_tail arrays.

### post_metrics
Manual performance tracking: views, unique_visitors, keyword_rank.

### form_presets
Saved form presets (template or full). Columns: id UUID, name, type ('template'|'full'), style, data JSONB, created_at, updated_at.

### custom_styles
User-defined writing styles. Columns: id UUID, name, icon, description, system_prompt TEXT, fields JSONB, created_at.

## Build & Deploy
```bash
docker compose -f /home/ubuntu/docker-compose.yml build blog-automation
docker compose -f /home/ubuntu/docker-compose.yml up -d --no-deps blog-automation
```

## Key Files (v2.5)
- `src/lib/style-templates.ts` - 6개 내장 스타일 템플릿 정의, 직렬화/역직렬화, buildPromptHints()
- `src/components/style-template-fields.tsx` - 접기/펼치기 패널, 별점/토글/셀렉트/그룹 렌더링, 프리셋 UI
- `src/components/generate-form.tsx` - 메인 폼 (내장 + 커스텀 스타일 통합)
- `src/app/custom-styles/page.tsx` - 커스텀 스타일 CRUD 관리 페이지
- `src/app/api/form-presets/route.ts` - 프리셋 API (GET/POST/DELETE)
- `src/app/api/custom-styles/route.ts` - 커스텀 스타일 API (GET/POST/PUT/DELETE)

## Pages
| Path | Description |
|------|-------------|
| `/` | 글 생성 폼 (메인) |
| `/styles` | 내 스타일 프로필 |
| `/keywords` | 키워드 리서치 |
| `/calendar` | 예약 발행 캘린더 |
| `/custom-styles` | 커스텀 스타일 관리 |
| `/history` | 생성 히스토리 |
| `/dashboard` | 대시보드 |
| `/settings` | 설정 |
| `/result/[id]` | 생성 결과 상세 |

## Security
- nginx IP whitelist (port-based.conf)
- Naver API credentials stored in blog_settings table
- 1일 2건 발행 제한 (publishToNaver에서 체크)
