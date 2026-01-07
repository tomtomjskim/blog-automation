# Blog Automation

AI를 활용한 네이버 블로그 자동화 도구

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Build](https://img.shields.io/badge/build-none-green.svg)](#)

## Overview

Blog Automation은 AI를 활용하여 블로그 글을 자동으로 생성하고 네이버 블로그에 포스팅할 수 있는 웹 애플리케이션입니다. 빌드 과정 없이 순수 Vanilla JavaScript로 구현되어 있으며, 다양한 LLM 제공자를 지원합니다.

## Features

- **Multi-LLM Support**: Claude (Anthropic), GPT (OpenAI), Gemini (Google), Groq 지원
- **AI Image Generation**: DALL-E 3, Stable Diffusion 이미지 생성
- **Naver Blog Integration**: 생성된 글을 바로 네이버 블로그에 포스팅
- **SEO Analysis**: 키워드 밀도, 글자 수, 가독성 자동 분석
- **Auto Save**: 작성 중인 내용 자동 저장
- **Dark Mode**: 시스템 설정에 따른 테마 자동 전환
- **Secure Storage**: API 키 AES-GCM 암호화 저장
- **Keyboard Shortcuts**: 효율적인 작업을 위한 단축키 지원
- **SSE Streaming**: 실시간 글 생성 스트리밍

## Screenshots

```
┌─────────────────────────────────────────┐
│  Blog Auto - AI 블로그 자동화            │
├─────────────────────────────────────────┤
│                                         │
│  ✍️ Blog Auto                           │
│  AI로 블로그 글을 자동 생성하세요          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 주제 입력                        │   │
│  │ [                              ] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [🚀 글 생성하기]                        │
│                                         │
└─────────────────────────────────────────┘
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Vanilla JavaScript (ES6+) |
| Styling | CSS3 Custom Properties |
| Encryption | Web Crypto API (AES-GCM) |
| Storage | localStorage |
| Routing | Hash-based SPA Router |
| Build | None (No Build Required) |

## Project Structure

```
blog-automation/
├── index.html              # Main HTML entry point
├── css/
│   ├── variables.css       # CSS variables (colors, spacing, themes)
│   ├── base.css            # Base styles, utilities, animations
│   └── components.css      # UI component styles
├── js/
│   ├── app.js              # Application entry point
│   ├── state.js            # Global state management
│   ├── core/
│   │   ├── crypto.js       # AES-GCM encryption
│   │   ├── storage.js      # localStorage wrapper
│   │   ├── router.js       # Hash-based router
│   │   └── events.js       # Event bus (pub/sub)
│   ├── providers/
│   │   ├── base.js         # Base LLM provider class
│   │   ├── anthropic.js    # Claude API
│   │   ├── openai.js       # OpenAI + DALL-E
│   │   ├── google.js       # Gemini API
│   │   ├── groq.js         # Groq API (free)
│   │   └── stability.js    # Stable Diffusion
│   ├── services/
│   │   ├── llm-service.js  # Unified LLM service
│   │   ├── blog-generator.js # Blog content generator
│   │   └── naver-blog.js   # Naver Blog XMLRPC API
│   ├── pages/
│   │   ├── home.js         # Home (content generation)
│   │   ├── result.js       # Result preview/edit
│   │   ├── settings.js     # Settings & API keys
│   │   ├── image.js        # Image generation
│   │   └── history.js      # History management
│   ├── ui/
│   │   ├── toast.js        # Toast notifications
│   │   ├── modal.js        # Modal dialogs
│   │   └── components.js   # Shared UI components
│   └── features/
│       ├── autosave.js     # Auto-save functionality
│       ├── streaming.js    # SSE streaming support
│       └── keyboard.js     # Keyboard shortcuts
├── nginx/
│   ├── blog-automation.conf    # Nginx server config
│   └── api-proxy.conf          # CORS proxy config
└── README.md
```

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/tomtomjskim/blog-automation.git
cd blog-automation
```

### 2. Serve with any static file server

```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8080
```

### 3. Open in browser

```
http://localhost:8080
```

## Deployment (with Nginx)

### 1. Copy nginx configuration

```bash
# Copy API proxy config
sudo cp nginx/api-proxy.conf /etc/nginx/conf.d/blog-automation-api-proxy.conf

# Or integrate into existing config
```

### 2. Deploy static files

```bash
sudo mkdir -p /var/www/blog-automation
sudo cp -r * /var/www/blog-automation/
sudo chown -R nginx:nginx /var/www/blog-automation
```

### 3. Reload nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Generate content |
| `Ctrl + S` | Save (draft/settings) |
| `Ctrl + K` | Quick navigation |
| `Ctrl + ,` | Open settings |
| `Ctrl + H` | View history |
| `Escape` | Go back / Close |
| `Shift + ?` | Show shortcuts help |
| `G → H` | Navigate to Home |
| `G → R` | Navigate to Result |
| `G → I` | Navigate to Image |
| `G → S` | Navigate to Settings |

## API Keys

Get your API keys from the following providers:

| Provider | Get API Key | Notes |
|----------|-------------|-------|
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com/settings/keys) | Recommended |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | GPT + DALL-E |
| Google (Gemini) | [makersuite.google.com](https://makersuite.google.com/app/apikey) | Free tier |
| Groq | [console.groq.com](https://console.groq.com/keys) | Free, fast |
| Stability AI | [platform.stability.ai](https://platform.stability.ai/account/keys) | Image only |

## Naver Blog Integration

1. Go to [Naver Blog Admin](https://admin.blog.naver.com)
2. Navigate to Open API settings
3. Generate API password
4. Enter your blog ID and API password in Settings

## Security

- **Encryption**: API keys are encrypted using AES-GCM (256-bit)
- **Local Storage**: All data stored locally in browser
- **No Backend**: No server-side code, keys never leave your browser
- **Password Protected**: Settings require password to unlock

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13.1+ |
| Edge | 80+ |

## Configuration

### Supported LLM Models

**Anthropic (Claude)**
- Claude Opus 4.5 (Premium)
- Claude Sonnet 4 (Default)
- Claude Haiku 3.5 (Fast)

**OpenAI**
- GPT-4o (Default)
- GPT-4o Mini (Fast)
- GPT-4 Turbo

**Google**
- Gemini 2.0 Flash
- Gemini 1.5 Pro
- Gemini 1.5 Flash

**Groq (Free)**
- Llama 3.3 70B
- Llama 3.1 8B
- Mixtral 8x7B

### Writing Styles

- **친근한 (Casual)**: 편안하고 대화하듯이
- **전문적 (Professional)**: 깔끔하고 정보 중심
- **유머러스 (Humorous)**: 재미있고 가벼운 톤
- **스토리텔링 (Storytelling)**: 이야기 형식

### Content Length

- **짧게 (Short)**: ~500자
- **보통 (Medium)**: ~1000자
- **길게 (Long)**: ~2000자

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Anthropic](https://anthropic.com) for Claude API
- [OpenAI](https://openai.com) for GPT and DALL-E APIs
- [Google](https://ai.google.dev) for Gemini API
- [Groq](https://groq.com) for fast inference API
- [Stability AI](https://stability.ai) for Stable Diffusion API

---

Made with AI by [tomtomjskim](https://github.com/tomtomjskim)
