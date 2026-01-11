# Blog Automation

AI를 활용한 네이버 블로그 자동화 도구

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA](https://img.shields.io/badge/PWA-ready-purple.svg)](#)
[![No Build](https://img.shields.io/badge/build-none-green.svg)](#)

## Overview

Blog Automation은 AI를 활용하여 블로그 글을 자동으로 생성하고 네이버 블로그에 포스팅할 수 있는 웹 애플리케이션입니다. 빌드 과정 없이 순수 Vanilla JavaScript로 구현되어 있으며, PWA를 지원하여 오프라인에서도 사용 가능합니다.

## Features

### Core Features
- **Multi-LLM Support**: Claude, GPT, Gemini, Groq 등 다양한 AI 모델 지원
- **AI Image Generation**: DALL-E 3, Stable Diffusion 이미지 생성
- **Naver Blog Integration**: 생성된 글을 바로 네이버 블로그에 포스팅
- **SEO Analysis**: 키워드 밀도, 글자 수, 가독성 자동 분석
- **SSE Streaming**: 실시간 글 생성 스트리밍

### Advanced Features
- **Batch Generation**: 여러 글을 한 번에 대량 생성
- **Scheduled Posting**: 예약 포스팅 및 알림
- **Template System**: 재사용 가능한 글 템플릿
- **Series Management**: 연재물/시리즈 관리
- **Usage Statistics**: API 사용량 및 비용 추적 대시보드

### Technical Features
- **PWA Support**: 오프라인 모드, 설치 가능한 웹앱
- **Auto Save**: 작성 중인 내용 자동 저장
- **Content Versioning**: 콘텐츠 버전 관리 및 복원
- **Plugin System**: 확장 가능한 플러그인 아키텍처
- **Secure Storage**: API 키 AES-GCM 암호화 저장
- **Dark Mode**: 시스템 설정에 따른 테마 자동 전환

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Vanilla JavaScript (ES6+ Modules) |
| Styling | CSS3 Custom Properties |
| Encryption | Web Crypto API (AES-GCM) |
| Storage | localStorage + IndexedDB |
| PWA | Service Worker, Web App Manifest |
| Routing | Hash-based SPA Router |
| Build | None (No Build Required) |

## Project Structure

```
blog-automation/
├── index.html              # PWA-enabled main entry
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── offline.html            # Offline fallback
├── css/
│   ├── variables.css       # CSS variables (Toss-style design)
│   ├── base.css            # Base styles, utilities
│   └── components.css      # UI component styles
├── js/
│   ├── app.js              # Application entry point
│   ├── state.js            # Global state management
│   ├── core/
│   │   ├── crypto.js       # AES-GCM encryption
│   │   ├── storage.js      # localStorage wrapper
│   │   ├── router.js       # Hash-based router
│   │   ├── events.js       # Event bus (pub/sub)
│   │   └── plugin-system.js # Plugin architecture
│   ├── providers/
│   │   ├── base.js         # Base LLM provider
│   │   ├── anthropic.js    # Claude API
│   │   ├── openai.js       # OpenAI + DALL-E
│   │   ├── google.js       # Gemini API
│   │   ├── groq.js         # Groq API (free)
│   │   └── stability.js    # Stable Diffusion
│   ├── services/
│   │   ├── llm-service.js  # Unified LLM service
│   │   ├── blog-generator.js
│   │   ├── naver-blog.js   # Naver XMLRPC API
│   │   ├── scheduler.js    # Scheduled posting
│   │   ├── batch-generator.js # Batch generation
│   │   ├── template-manager.js
│   │   ├── series-manager.js
│   │   ├── content-storage.js # Content versioning
│   │   ├── api-connection-manager.js
│   │   ├── progress-manager.js
│   │   ├── seo-analyzer.js
│   │   ├── usage-tracker.js
│   │   └── image-uploader.js
│   ├── pages/
│   │   ├── home.js         # Content generation
│   │   ├── result.js       # Preview & edit
│   │   ├── settings.js     # Settings & API keys
│   │   ├── batch.js        # Batch generation
│   │   ├── schedule.js     # Scheduled posts
│   │   ├── stats.js        # Usage statistics
│   │   ├── image.js        # Image generation
│   │   └── history.js      # History
│   ├── ui/
│   │   ├── app-layout.js   # Main layout
│   │   ├── llm-settings-modal.js
│   │   ├── toast.js
│   │   ├── modal.js
│   │   └── components.js
│   └── features/
│       ├── autosave.js
│       ├── streaming.js
│       └── keyboard.js
└── README.md
```

## Quick Start

### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/your-repo/blog-automation.git
cd blog-automation

# Serve with any static file server
python3 -m http.server 3005

# Open in browser
# http://localhost:3005
```

### Option 2: Docker Deployment

```bash
# Using nginx static serving
docker run -d -p 80:80 \
  -v $(pwd):/usr/share/nginx/html:ro \
  nginx:alpine
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Generate content |
| `Ctrl + S` | Save draft/settings |
| `Ctrl + K` | Quick navigation |
| `Ctrl + ,` | Open settings |
| `Ctrl + H` | View history |
| `Escape` | Go back / Close |
| `Shift + ?` | Show shortcuts help |

## API Keys

Get your API keys from the following providers:

| Provider | Get API Key | Notes |
|----------|-------------|-------|
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com/settings/keys) | Recommended |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | GPT + DALL-E |
| Google (Gemini) | [aistudio.google.com](https://aistudio.google.com/app/apikey) | Free tier |
| Groq | [console.groq.com](https://console.groq.com/keys) | Free, fast |
| Stability AI | [platform.stability.ai](https://platform.stability.ai/account/keys) | Image only |

## Naver Blog Integration

1. Go to [Naver Blog Admin](https://admin.blog.naver.com)
2. Navigate to Open API settings
3. Generate API password
4. Enter your blog ID and API password in Settings

## Supported LLM Models

**Anthropic (Claude)**
- Claude Opus 4.5 (Premium)
- Claude Sonnet 4 (Default)
- Claude Haiku 3.5 (Fast)

**OpenAI**
- GPT-4o (Default)
- GPT-4o Mini (Fast)
- o1 / o1-mini (Reasoning)

**Google**
- Gemini 2.0 Flash
- Gemini 1.5 Pro
- Gemini 1.5 Flash

**Groq (Free)**
- Llama 3.3 70B
- Llama 3.1 8B
- Mixtral 8x7B

## Security

- **Encryption**: API keys encrypted using AES-GCM (256-bit)
- **Local Storage**: All data stored locally in browser
- **No Backend**: Keys never leave your browser
- **Password Protected**: Master password for settings

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13.1+ |
| Edge | 80+ |

## PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline Mode**: View saved drafts and history offline
- **Push Notifications**: Scheduled posting reminders
- **Background Sync**: Sync drafts when back online

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Anthropic](https://anthropic.com) - Claude API
- [OpenAI](https://openai.com) - GPT and DALL-E APIs
- [Google](https://ai.google.dev) - Gemini API
- [Groq](https://groq.com) - Fast inference API
- [Stability AI](https://stability.ai) - Stable Diffusion API

---

Made with AI
