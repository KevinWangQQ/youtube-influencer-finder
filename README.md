# YouTube Influencer Finder v2.0

🚀 **Pure Frontend** AI-powered YouTube influencer discovery tool that helps you find relevant content creators using intelligent keyword expansion and advanced filtering.

## ✨ Features

- 🤖 **AI-Powered Keyword Expansion**: Uses OpenAI to expand your search topics into relevant keywords
- 🎯 **Smart Filtering**: Filter by region, subscriber count, video views, and more
- 📊 **Detailed Analytics**: View subscriber counts, video statistics, and relevance scores
- 📋 **Export Functionality**: Export search results to CSV for further analysis
- ⚡ **Fast & Efficient**: Client-side caching for improved performance
- 🔒 **Privacy-First**: All API keys stored locally in your browser
- 🎨 **Modern UI**: Clean, responsive design optimized for productivity
- 📱 **Fully Client-Side**: No backend required - runs entirely in your browser

## 🛠 Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Custom CSS** with utility classes (Tailwind-inspired)
- **OpenAI API** for intelligent keyword expansion
- **YouTube Data API v3** for channel discovery
- **Local Storage** for caching and settings

## 🚀 Quick Start

### Prerequisites

You'll need API keys from:
1. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/)
2. **YouTube Data API Key** - Get one from [Google Cloud Console](https://console.cloud.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KevinWangQQ/youtube-influencer-finder.git
   cd youtube-influencer-finder
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Opens at http://localhost:3000

4. **Configure API Keys**
   - Click the Settings button in the top-right corner
   - Enter your OpenAI and YouTube API keys
   - Keys are stored securely in your browser's local storage

## 🎯 Usage

1. **Configure API Keys**: Click Settings and enter your API keys
2. **Enter a Topic**: Start by entering a topic you're interested in (e.g., "fitness", "cooking", "tech reviews")
3. **Configure Filters** (Optional): 
   - **Region**: Target specific countries
   - **Min Subscribers**: Set minimum subscriber threshold
   - **Min Video Views**: Set minimum view count requirements
   - **Max Results**: Limit the number of results
4. **Search**: Click "Search" to find relevant influencers
5. **Review Results**: Browse through results with detailed information
6. **Export**: Download results as CSV for further analysis

## 🔒 Privacy & Security

- **Local Storage**: API keys are stored only in your browser's local storage
- **No Backend**: Application runs entirely client-side
- **Direct API Calls**: Communicates directly with OpenAI and YouTube APIs
- **No Data Collection**: We don't collect or store any of your data

## ⚡ Performance Features

- **Smart Caching**: Search results cached for 30 minutes
- **Keyword Caching**: Expanded keywords cached for 24 hours
- **Intelligent Batching**: Optimized API calls to reduce quota usage
- **Fallback Mechanisms**: Graceful degradation when APIs are unavailable

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Fork this repository** on GitHub

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your forked repository

3. **Configure Build Settings**:
   - Vercel will automatically detect the configuration from `vercel.json`
   - No additional configuration needed!

4. **Optional Environment Variables**:
   ```
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```
   (Users can also set this in the app settings)

5. **Deploy**: Click "Deploy" and you're live! 🎉

### Deploy to Netlify

1. **Connect Repository**: Link your GitHub repository to Netlify

2. **Build Settings**:
   - **Build Command**: `cd frontend && npm run build`
   - **Publish Directory**: `frontend/dist`

3. **Deploy**: Click deploy!

### Deploy to GitHub Pages

1. **Enable GitHub Pages** in repository settings

2. **Add GitHub Action** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
           with:
             node-version: '18'
         - run: cd frontend && npm install && npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./frontend/dist
   ```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install all dependencies
npm run install:all
```

### Project Structure

```
youtube-influencer-finder/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── services/        # API services (OpenAI, YouTube, Settings)
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── dist/                # Built files
│   └── package.json
├── requirements.md          # Product requirements
├── architecture.md          # Technical architecture
├── vercel.json             # Vercel deployment config
└── README.md               # This file
```

## 📊 API Usage & Costs

### OpenAI API
- **Model**: GPT-3.5-turbo
- **Usage**: ~100-300 tokens per keyword expansion
- **Cost**: ~$0.001-0.003 per search
- **Caching**: 24 hours to minimize repeated calls

### YouTube Data API
- **Quota**: 10,000 units per day (free tier)
- **Usage**: ~100-500 units per search
- **Cost**: Free up to quota limit
- **Caching**: 30 minutes to optimize quota usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Version History

### v2.0.0 - Frontend-Only Architecture
- ✅ Removed backend dependency
- ✅ Direct API integration with OpenAI and YouTube
- ✅ Local storage for caching and settings
- ✅ Simplified deployment (static hosting only)
- ✅ Enhanced privacy and security

### v1.0.0 - Full-Stack Architecture
- Backend API with Node.js/Express
- Server-side caching with Redis
- Complex deployment requirements

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify keys are correctly set in Settings
   - Check API key permissions and quotas
   - Ensure keys are active and not expired

2. **CORS Errors**
   - YouTube API supports CORS by default
   - OpenAI API supports CORS for browser requests

3. **Quota Exceeded**
   - YouTube: Wait for quota reset or upgrade plan
   - OpenAI: Check billing and usage limits

4. **No Results Found**
   - Try different keywords or broader topics
   - Adjust filters (lower subscriber/view requirements)
   - Check if the topic exists on YouTube

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/KevinWangQQ/youtube-influencer-finder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KevinWangQQ/youtube-influencer-finder/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for the GPT API
- [Google](https://developers.google.com/youtube/v3) for the YouTube Data API
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the frontend framework
- [Vercel](https://vercel.com/) for excellent static hosting

---

**Made with ❤️ by developers, for developers**