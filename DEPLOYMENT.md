# Deployment Guide

This guide explains how to deploy the YouTube Influencer Finder application.

## Architecture

- **Frontend**: Deployed on Vercel (static hosting)
- **Backend**: Deployed on Railway, Render, or similar Node.js hosting platform

## Frontend Deployment (Vercel)

### Method 1: GitHub Integration (Recommended)

1. **Connect Repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository: `youtube-influencer-finder`

2. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**
   Add the following environment variable in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your frontend

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Frontend Directory**
   ```bash
   cd frontend
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add VITE_API_URL
   # Enter your backend URL when prompted
   ```

## Backend Deployment

### Option 1: Railway

1. **Connect Repository**
   - Go to [Railway](https://railway.app/)
   - Click "Start a New Project"
   - Connect your GitHub repository

2. **Configure Service**
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

3. **Environment Variables**
   Add these in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   OPENAI_API_KEY=your_openai_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

4. **Deploy**
   Railway will automatically deploy your backend

### Option 2: Render

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `youtube-influencer-finder-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18

3. **Environment Variables**
   Add the same environment variables as Railway

4. **Deploy**
   Render will build and deploy your backend

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create youtube-influencer-finder-api
   ```

3. **Configure Buildpack and Settings**
   ```bash
   heroku buildpacks:set heroku/nodejs
   heroku config:set NODE_ENV=production
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   heroku config:set YOUTUBE_API_KEY=your_youtube_api_key
   heroku config:set FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

4. **Create Procfile**
   ```bash
   echo "web: cd backend && npm start" > Procfile
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push heroku master
   ```

## Environment Variables Setup

### Required API Keys

1. **OpenAI API Key**
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Navigate to API Keys section
   - Create a new secret key
   - Copy the key (starts with `sk-`)

2. **YouTube Data API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable YouTube Data API v3
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the API key

### Backend Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-your-openai-key-here
YOUTUBE_API_KEY=your-youtube-api-key-here

# Server Configuration
NODE_ENV=production
PORT=3001

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Optional (for Redis cache)
REDIS_URL=redis://localhost:6379
```

### Frontend Environment Variables

```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com/api
```

## Post-Deployment Configuration

### 1. Update Frontend API URL

After deploying backend, update frontend environment variable:

```bash
# In Vercel dashboard or via CLI
vercel env add VITE_API_URL production
# Enter: https://your-backend-url.com/api
```

### 2. Update Backend CORS

Ensure backend CORS is configured for your frontend domain:

```bash
# In your backend hosting platform
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 3. Test Deployment

1. **Health Check**
   ```bash
   curl https://your-backend-url.com/api/health
   ```

2. **Frontend Test**
   - Visit your Vercel app URL
   - Try a search with a simple topic
   - Check browser console for any errors

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check that frontend is making requests to correct API URL

2. **API Key Errors**
   - Verify API keys are correctly set in environment variables
   - Check API key permissions and quotas

3. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are installed
   - Review build logs for specific errors

4. **404 Errors**
   - Verify API endpoints are correctly deployed
   - Check routing configuration

### Debug Steps

1. **Check Environment Variables**
   ```bash
   # In your hosting platform console
   echo $OPENAI_API_KEY
   echo $YOUTUBE_API_KEY
   echo $VITE_API_URL
   ```

2. **Check Application Logs**
   - Review server logs in your hosting platform
   - Monitor frontend console in browser developer tools

3. **Test API Endpoints**
   ```bash
   # Health check
   curl https://your-api-url.com/api/health
   
   # Test keyword expansion
   curl -X POST https://your-api-url.com/api/keywords/expand \
     -H "Content-Type: application/json" \
     -d '{"topic": "test"}'
   ```

## Monitoring and Maintenance

### 1. Set Up Monitoring

- **Uptime Monitoring**: Use services like UptimeRobot or Pingdom
- **Error Tracking**: Consider integrating Sentry for error monitoring
- **Analytics**: Add Google Analytics or similar for usage tracking

### 2. API Quota Management

- **OpenAI**: Monitor usage in OpenAI dashboard
- **YouTube**: Monitor quota usage in Google Cloud Console
- **Set up alerts** for approaching quota limits

### 3. Performance Optimization

- **Cache Monitoring**: Monitor cache hit rates
- **Response Times**: Track API response times
- **Error Rates**: Monitor 4xx and 5xx error rates

## Scaling Considerations

### Horizontal Scaling

- **Backend**: Use load balancers and multiple instances
- **Caching**: Implement Redis for shared caching across instances
- **Database**: Consider adding PostgreSQL for persistent data

### Vertical Scaling

- **Increase server resources** based on usage patterns
- **Optimize API calls** to reduce external API costs
- **Implement rate limiting** to prevent abuse

## Security

### Production Security Checklist

- [ ] API keys are stored securely in environment variables
- [ ] CORS is properly configured
- [ ] HTTPS is enabled for all endpoints
- [ ] Rate limiting is implemented
- [ ] Input validation is working correctly
- [ ] Error messages don't expose sensitive information

### Additional Security Measures

1. **API Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Consider IP-based and API key-based limits

2. **Request Validation**
   - Ensure all inputs are properly validated
   - Sanitize user inputs to prevent injection attacks

3. **Monitoring**
   - Set up alerts for unusual traffic patterns
   - Monitor for failed authentication attempts