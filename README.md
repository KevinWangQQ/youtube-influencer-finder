# YouTube Influencer Finder

AI-powered YouTube influencer discovery tool that helps you find relevant content creators using intelligent keyword expansion and advanced filtering.

## Features

- 🤖 **AI-Powered Keyword Expansion**: Uses OpenAI to expand your search topics into relevant keywords
- 🎯 **Smart Filtering**: Filter by region, subscriber count, video views, and more
- 📊 **Detailed Analytics**: View subscriber counts, video statistics, and relevance scores
- 📋 **Export Functionality**: Export search results to CSV for further analysis
- ⚡ **Fast & Efficient**: Intelligent caching reduces API calls and improves performance
- 🎨 **Modern UI**: Clean, responsive design optimized for productivity

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Custom CSS** with utility classes (Tailwind-inspired)
- **Responsive Design** for desktop and mobile

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **OpenAI API** for keyword expansion
- **YouTube Data API v3** for channel discovery
- **Node-cache** for intelligent caching
- **Winston** for structured logging
- **Zod** for request validation

## Prerequisites

Before running this application, you need:

1. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/)
2. **YouTube Data API Key** - Get one from [Google Cloud Console](https://console.cloud.google.com/)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd youtube-influencer-finder
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   
   Backend (.env):
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env` and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

   Frontend (.env):
   ```bash
   cp frontend/.env.example frontend/.env
   ```

## Development

1. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend server on http://localhost:3001
   - Frontend server on http://localhost:3000

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Start production server**
   ```bash
   npm start
   ```

## API Endpoints

### Search Influencers
```
POST /api/search/influencers
```

Request body:
```json
{
  "topic": "fitness",
  "filters": {
    "region": "US",
    "minSubscribers": 10000,
    "minViews": 50000,
    "maxResults": 25
  }
}
```

### Expand Keywords
```
POST /api/keywords/expand
```

Request body:
```json
{
  "topic": "cooking",
  "maxKeywords": 10,
  "language": "en"
}
```

### Export to CSV
```
POST /api/export/csv
```

Request body:
```json
{
  "results": [/* array of influencer results */]
}
```

### Health Check
```
GET /api/health
```

## Usage

1. **Enter a Topic**: Start by entering a topic you're interested in (e.g., "fitness", "cooking", "tech reviews")

2. **Configure Filters** (Optional): 
   - **Region**: Target specific countries
   - **Min Subscribers**: Set minimum subscriber threshold
   - **Min Video Views**: Set minimum view count requirements
   - **Max Results**: Limit the number of results

3. **Search**: Click "Search" to find relevant influencers

4. **Review Results**: Browse through the results with detailed information including:
   - Channel name and subscriber count
   - Total views and video count
   - Recent videos with view counts
   - Relevance score based on your search

5. **Export**: Download results as CSV for further analysis

## Configuration

### Caching
- Search results are cached for 30 minutes
- Keyword expansions are cached for 24 hours
- Cache can be cleared via `/api/cache` endpoint (development only)

### API Limits
- OpenAI: Respects rate limits with intelligent retry
- YouTube: Manages quota efficiently with smart caching

## Project Structure

```
youtube-influencer-finder/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions and API client
│   │   └── App.tsx         # Main application component
│   ├── dist/               # Built frontend files
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic (OpenAI, YouTube)
│   │   ├── middleware/     # Express middleware
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Utilities (logger, cache)
│   │   └── index.ts        # Express server setup
│   ├── dist/               # Compiled TypeScript
│   └── package.json
├── requirements.md          # Detailed project requirements
├── architecture.md          # Technical architecture documentation
└── README.md               # This file
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`
4. Add environment variable: `VITE_API_URL=your_backend_url`

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set build command: `cd backend && npm run build`
3. Set start command: `cd backend && npm start`
4. Add environment variables:
   - `OPENAI_API_KEY`
   - `YOUTUBE_API_KEY`
   - `NODE_ENV=production`
   - `FRONTEND_URL=your_frontend_url`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

1. Check the existing [Issues](../../issues)
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## Acknowledgments

- [OpenAI](https://openai.com/) for the GPT API
- [Google](https://developers.google.com/youtube/v3) for the YouTube Data API
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the frontend framework
- [Express.js](https://expressjs.com/) for the backend framework