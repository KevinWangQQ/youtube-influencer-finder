import { Request, Response, NextFunction } from 'express';
import { OpenAIService } from '../services/openai.service';
import { YouTubeService } from '../services/youtube.service';
import { SearchRequest, SearchResponse, ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class SearchController {
  private openaiService: OpenAIService;
  private youtubeService: YouTubeService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.youtubeService = new YouTubeService();
  }

  searchInfluencers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchRequest: SearchRequest = req.body;
      const { topic, filters } = searchRequest;

      logger.info(`Starting influencer search for topic: ${topic}`);

      // Step 1: Expand keywords using OpenAI
      const keywordResponse = await this.openaiService.expandKeywords({
        topic,
        maxKeywords: 10,
        language: 'en'
      });

      logger.info(`Expanded ${keywordResponse.expandedKeywords.length} keywords`);

      // Step 2: Search YouTube with expanded keywords
      const influencers = await this.youtubeService.searchInfluencers(
        keywordResponse.expandedKeywords,
        filters
      );

      // Step 3: Generate search ID for potential future use
      const searchId = this.generateSearchId();

      const response: ApiResponse<SearchResponse> = {
        success: true,
        data: {
          searchId,
          results: influencers,
          expandedKeywords: keywordResponse.expandedKeywords,
          totalFound: influencers.length
        },
        meta: {
          total: influencers.length,
          page: 1,
          limit: filters.maxResults || 50
        }
      };

      logger.info(`Search completed successfully. Found ${influencers.length} influencers`);
      res.json(response);

    } catch (error) {
      logger.error('Search influencers error:', error);
      next(error);
    }
  };

  expandKeywords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keywordRequest = req.body;

      logger.info(`Expanding keywords for topic: ${keywordRequest.topic}`);

      const result = await this.openaiService.expandKeywords(keywordRequest);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result
      };

      logger.info(`Keywords expanded successfully for topic: ${keywordRequest.topic}`);
      res.json(response);

    } catch (error) {
      logger.error('Expand keywords error:', error);
      next(error);
    }
  };

  exportToCsv = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { results } = req.body;

      if (!results || !Array.isArray(results)) {
        throw new AppError('Invalid results data for export', 400, 'INVALID_EXPORT_DATA');
      }

      logger.info(`Exporting ${results.length} results to CSV`);

      const csv = this.generateCsv(results);
      const filename = `youtube-influencers-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);

      logger.info(`CSV export completed for ${results.length} results`);

    } catch (error) {
      logger.error('Export CSV error:', error);
      next(error);
    }
  };

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCsv(results: any[]): string {
    if (results.length === 0) {
      return 'No data to export';
    }

    // CSV headers
    const headers = [
      'Channel Name',
      'Channel URL',
      'Subscribers',
      'Total Views', 
      'Video Count',
      'Country',
      'Relevance Score',
      'Recent Video 1',
      'Recent Video 1 Views',
      'Recent Video 2',
      'Recent Video 2 Views',
      'Recent Video 3',
      'Recent Video 3 Views'
    ];

    // CSV rows
    const rows = results.map(result => {
      const recentVideos = result.recentVideos || [];
      return [
        this.escapeCsvValue(result.channelTitle || ''),
        result.channelUrl || '',
        result.subscriberCount || 0,
        result.viewCount || 0,
        result.videoCount || 0,
        result.country || '',
        result.relevanceScore || 0,
        this.escapeCsvValue(recentVideos[0]?.title || ''),
        recentVideos[0]?.viewCount || 0,
        this.escapeCsvValue(recentVideos[1]?.title || ''),
        recentVideos[1]?.viewCount || 0,
        this.escapeCsvValue(recentVideos[2]?.title || ''),
        recentVideos[2]?.viewCount || 0
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return csvContent;
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    // Escape quotes and wrap in quotes if necessary
    const hasComma = value.includes(',');
    const hasQuote = value.includes('"');
    const hasNewline = value.includes('\n') || value.includes('\r');

    if (hasComma || hasQuote || hasNewline) {
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return value;
  }
}