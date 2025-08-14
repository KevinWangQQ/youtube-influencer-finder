# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube Influencer Finder v2.0 is a pure frontend application for discovering YouTube content creators. It uses OpenAI for intelligent keyword expansion and YouTube Data API v3 for channel discovery, with all processing happening client-side in the browser.

## Development Commands

### Installation and Setup
```bash
# Install all dependencies
npm run install:all

# Copy environment variables (optional)
cp frontend/.env.example frontend/.env
# Edit frontend/.env to add YouTube API key (optional - can be set in app)
```

### Development
```bash
# Start development server
npm run dev  # Opens frontend dev server on :3000

# Frontend-specific commands
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

### Building and Production
```bash
# Build for production
npm run build  # Builds frontend to frontend/dist/

# Preview production build
npm run preview
```

## Architecture Overview

### Pure Frontend Architecture
- **Frontend Only**: React SPA with TypeScript, no backend required
- **Direct API Integration**: Communicates directly with OpenAI and YouTube APIs from browser
- **Local Storage**: API keys, settings, and caching handled in browser localStorage
- **Static Deployment**: Can be deployed to any static hosting (Vercel, Netlify, GitHub Pages)

### Key Data Flow
1. User configures API keys in Settings modal (stored in localStorage)
2. User enters search topic in React frontend
3. Frontend calls OpenAI API directly to expand keywords
4. Frontend calls YouTube Data API directly with expanded keywords
5. Results processed, scored for relevance, and displayed
6. All data cached in localStorage for performance

### Core Services Architecture
- **OpenAI Service** (`frontend/src/services/openai.service.ts`): Direct API calls to OpenAI GPT-3.5-turbo for keyword expansion
- **YouTube Service** (`frontend/src/services/youtube.service.ts`): Direct API calls to YouTube Data API for channel discovery and relevance scoring
- **Settings Service** (`frontend/src/services/settings.service.ts`): Manages API keys and app settings in localStorage
- **Cache Implementation**: Built into each service using localStorage with TTL (30min for search, 24h for keywords)

### Environment Variables
Frontend only:
- `VITE_YOUTUBE_API_KEY`: Optional YouTube API key (users can also set in app settings)

### API Architecture
Direct browser-to-API communication:
- **OpenAI API**: HTTPS calls to api.openai.com with Authorization header
- **YouTube Data API**: HTTPS calls to googleapis.com with API key parameter
- **CORS Support**: Both APIs support browser CORS requests

Main functionality:
- Search influencers: Combines OpenAI keyword expansion + YouTube search
- Export to CSV: Client-side CSV generation and download
- Settings management: localStorage-based API key storage

### Caching Strategy
localStorage-based caching:
- Search results cached for 30 minutes using search parameters hash as key
- Keyword expansions cached for 24 hours using topic as key
- Cache entries include data, timestamp, and expiry time
- Automatic cleanup of expired entries on access

### Error Handling
- API key validation before making requests
- Specific error handling for API quota limits, invalid keys, network errors
- Fallback keyword generation when OpenAI API fails
- User-friendly error messages with actionable instructions
- Settings modal integration for missing API keys

### Type System
Frontend TypeScript interfaces:
- Core types in `frontend/src/types/index.ts`
- Key interfaces: `SearchRequest`, `SearchResponse`, `InfluencerResult`, `AppSettings`
- Service classes with full type safety
- React components with proper TypeScript props

### Development Workflow
- Frontend uses TypeScript with strict configuration
- Vite for fast development and building with HMR
- ESLint configured for code quality
- Custom CSS with utility classes (Tailwind-inspired)
- React 18 with modern hooks and patterns

### Deployment Configuration
- `vercel.json`: Vercel static deployment configuration
- `frontend/dist/`: Built static files ready for any static hosting
- No server requirements - fully static deployment
- SPA routing handled with catch-all redirects to index.html

### Privacy and Security
- **No Backend**: All processing happens client-side
- **Local API Keys**: Stored only in user's browser localStorage
- **No Data Collection**: No analytics or tracking
- **Direct API Calls**: No proxy or intermediate servers
- **HTTPS Only**: All API calls over secure connections

### Performance Optimizations
- localStorage caching reduces API calls
- Intelligent batching of YouTube searches
- Fallback mechanisms for API failures
- Optimized bundle size with Vite tree-shaking
- Lazy loading patterns where appropriate