import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { SearchController } from './controllers/search.controller';
import { validateSearchRequest, validateKeywordExpansion } from './middleware/validation';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { cacheManager } from './utils/cache';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Initialize controllers
const searchController = new SearchController();

// Health check endpoint
app.get('/api/health', (req, res) => {
  const stats = cacheManager.getStats();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cache: stats,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API routes
app.post('/api/search/influencers', validateSearchRequest, searchController.searchInfluencers);
app.post('/api/keywords/expand', validateKeywordExpansion, searchController.expandKeywords);
app.post('/api/export/csv', searchController.exportToCsv);

// Cache management endpoints (for development)
if (process.env.NODE_ENV !== 'production') {
  app.delete('/api/cache', async (req, res) => {
    await cacheManager.clear();
    res.json({ success: true, message: 'Cache cleared' });
  });

  app.get('/api/cache/stats', (req, res) => {
    const stats = cacheManager.getStats();
    res.json({ success: true, data: stats });
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`, {
    environment: process.env.NODE_ENV || 'development',
    port: port
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await cacheManager.clear();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Error during cache cleanup:', error);
    }
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;