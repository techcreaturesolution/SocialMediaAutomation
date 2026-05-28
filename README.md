# AI-Powered Social Media Content Automation Agent

> **Built by Tech Creature Solution** — Full-stack AI agent that generates trending technology content (images, videos, text), applies company branding, and auto-publishes to all major social media platforms.

## Features

### AI Content Generation
- **Text Generation** — GPT-4o powered trending tech content with platform-optimized variants
- **Image Generation** — DALL-E 3 & Stability AI for high-quality technology images
- **Video Generation** — Text-to-video via Replicate (Zeroscope/Stable Video Diffusion)
- **Hashtag Generation** — AI-powered trending hashtags per platform
- **Multi-Language Support** — 30+ languages including Hindi, Tamil, Telugu, Bengali, etc.

### Social Media Publishing
- **Meta Business Suite** — One-click OAuth to connect Facebook Pages & Instagram Business accounts
- **Facebook** — Pages, photos, videos, carousel posts
- **Instagram** — Posts, reels, stories, carousels
- **Twitter/X** — Tweets, threads, media upload
- **LinkedIn** — Articles, images, videos, organization posts
- **YouTube** — Video upload, thumbnails, descriptions

### Ad Campaign Management
- Generate ad-optimized content with CTA
- Campaign objectives: awareness, traffic, engagement, leads, conversions
- Budget management, audience targeting, scheduling
- Facebook Ads Manager integration

### Company Branding
- Auto-watermark logo, company name, website, email, phone on all images/videos
- Customizable brand colors and tagline
- Consistent branding across all platforms

### Automation & Scheduling
- Schedule content for future publishing
- Recurring content with cron expressions
- One-click "Generate & Publish" workflow
- Background job processing with Bull queues

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB with Mongoose ODM |
| **AI Models** | OpenAI GPT-4o, DALL-E 3, Stability AI, Replicate |
| **Queue** | Bull + Redis |
| **Auth** | JWT with bcrypt |
| **Media** | Sharp (images), FFmpeg (videos) |

## Project Structure

```
├── backend/
│   └── src/
│       ├── config/         # Environment & database config
│       ├── controllers/    # Route handlers
│       ├── middleware/      # Auth, upload middleware
│       ├── models/         # MongoDB schemas (User, Content, Schedule, Template)
│       ├── routes/         # Express routes
│       ├── services/       # Core services
│       │   ├── AIContentService.ts        # GPT-4o content generation
│       │   ├── ImageGenerationService.ts  # DALL-E 3 & Stability AI
│       │   ├── VideoGenerationService.ts  # Replicate video generation
│       │   ├── TranslationService.ts      # Multi-language support
│       │   ├── PublishingService.ts        # Unified multi-platform publisher
│       │   ├── SchedulerService.ts        # Cron-based scheduler
│       │   └── social/                    # Platform-specific services
│       │       ├── FacebookService.ts
│       │       ├── InstagramService.ts
│       │       ├── TwitterService.ts
│       │       ├── LinkedInService.ts
│       │       └── YouTubeService.ts
│       ├── types/          # TypeScript type definitions
│       ├── utils/          # Logger, helpers
│       └── index.ts        # Express server entry point
├── frontend/
│   └── src/
│       ├── components/     # Layout, shared components
│       ├── context/        # Auth context
│       ├── pages/          # Dashboard, Generate, Content, Schedules, Ads, Settings
│       ├── services/       # API client
│       ├── types/          # Frontend type definitions
│       └── main.tsx        # React entry point
├── .env.example            # Environment variables template
└── package.json            # Monorepo root
```

## Setup

### Prerequisites
- Node.js >= 18
- MongoDB
- Redis (for scheduling queue)
- FFmpeg (for video processing)

### Installation

```bash
# Clone the repo
git clone https://github.com/techcreaturesolution/SocialMediaAutomation.git
cd SocialMediaAutomation

# Install all dependencies
npm install

# Copy environment config
cp .env.example backend/.env

# Edit backend/.env with your API keys
```

### Required API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| OpenAI | Text & image generation | https://platform.openai.com/api-keys |
| Stability AI | Alternative image generation | https://platform.stability.ai/ |
| Replicate | Video generation | https://replicate.com/account |
| Facebook/Meta | FB & IG publishing | https://developers.facebook.com/ |
| Twitter/X | Tweet publishing | https://developer.twitter.com/ |
| LinkedIn | Post publishing | https://developer.linkedin.com/ |
| Google/YouTube | Video upload | https://console.cloud.google.com/ |

### Development

```bash
# Start both backend and frontend
npm run dev

# Or run separately
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

### Build

```bash
npm run build
npm start
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile & branding |
| POST | `/api/auth/social/connect` | Connect social account |
| DELETE | `/api/auth/social/:platform` | Disconnect social account |

### Meta Business (Facebook & Instagram OAuth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meta/login` | Get Meta OAuth login URL |
| GET | `/api/meta/callback` | OAuth callback (handles token exchange) |
| GET | `/api/meta/pages` | List connected Facebook Pages & IG accounts |
| POST | `/api/meta/select-page` | Select active page for publishing |
| POST | `/api/meta/refresh-token` | Refresh long-lived token |
| DELETE | `/api/meta/disconnect` | Disconnect Meta Business |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content/generate` | Generate AI content |
| POST | `/api/content/:id/publish` | Publish to platforms |
| GET | `/api/content` | List all content |
| GET | `/api/content/dashboard` | Dashboard stats |
| GET | `/api/content/trending` | AI trending topics |
| GET | `/api/content/languages` | Supported languages |
| POST | `/api/content/hashtags` | Generate hashtags |
| POST | `/api/content/translate` | Translate content |

### Schedules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedules` | List schedules |
| POST | `/api/schedules` | Create schedule |
| PUT | `/api/schedules/:id` | Update schedule |
| POST | `/api/schedules/:id/cancel` | Cancel schedule |

## License

MIT

---

**Built with AI by Tech Creature Solution**
