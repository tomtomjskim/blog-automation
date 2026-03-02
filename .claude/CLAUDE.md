# Blog Automation - Project Instructions

## Overview
네이버 블로그 최적화 AI 글 생성 + 자동 포스팅 서비스 (v2.0).
Next.js 15 App Router + Claude CLI subprocess + PostgreSQL.

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

## Build & Deploy
```bash
docker compose -f /home/ubuntu/docker-compose.yml build blog-automation
docker compose -f /home/ubuntu/docker-compose.yml up -d --no-deps blog-automation
```

## Security
- nginx IP whitelist (port-based.conf)
- Naver API credentials stored in blog_settings table
- 1일 2건 발행 제한 (publishToNaver에서 체크)
