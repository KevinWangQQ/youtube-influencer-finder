import type { SearchRequest, SearchResponse, InfluencerResult, SearchFilters } from '../types';
import { YouTubeService } from '../services/youtube.service';
import { SettingsService } from '../services/settings.service';

export class ApiError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;
  public userMessage?: string;
  
  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    userMessage?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.userMessage = userMessage;
  }
}

export const api = {
  async searchInfluencers(request: SearchRequest): Promise<SearchResponse> {
    const settings = SettingsService.getSettings();
    
    console.log(`🔧 API Keys loaded from settings:`);
    console.log(`📺 YouTube Key: ${settings.youtubeApiKey ? `${settings.youtubeApiKey.substring(0, 10)}...` : 'MISSING'}`);
    
    if (!settings.youtubeApiKey) {
      throw new ApiError('MISSING_YOUTUBE_KEY', 'YouTube API key is required. Please set it in Settings.');
    }

    try {
      console.log(`🎯 Direct search for: "${request.topic}"`);

      // 直接使用用户输入进行YouTube搜索
      const youtubeService = new YouTubeService(settings.youtubeApiKey);
      const searchFilters: SearchFilters = {
        region: request.filters.region || 'US',
        minSubscribers: request.filters.minSubscribers || 1000,
        minViews: request.filters.minViews || 10000,
        maxResults: request.filters.maxResults || 50
      };
      
      // 使用用户输入的机型作为直接搜索关键词
      const directKeywords = [request.topic];
      const influencers = await youtubeService.searchInfluencers(
        directKeywords,
        searchFilters,
        request.topic
      );

      // Generate search ID for potential future use
      const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response: SearchResponse = {
        searchId,
        results: influencers,
        expandedKeywords: directKeywords, // 直接返回用户输入作为"扩展"关键词
        totalFound: influencers.length
      };

      console.log(`Direct search completed successfully. Found ${influencers.length} influencers`);
      return response;

    } catch (error) {
      console.error('Search influencers error:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle specific API errors with detailed information
      if (error instanceof Error && (error as any).status) {
        const status = (error as any).status;
        const userMessage = (error as any).userMessage;
        const details = (error as any).details;
        
        throw new ApiError(
          `API_ERROR_${status}`,
          userMessage || error.message,
          status,
          details,
          userMessage
        );
      }
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new ApiError('INVALID_API_KEY', 'Invalid API key. Please check your settings.', 401);
        }
        
        if (error.message.includes('403') || error.message.includes('quota')) {
          throw new ApiError('API_QUOTA_EXCEEDED', 'API quota exceeded. Please try again later.', 403);
        }
        
        if (error.message.includes('429')) {
          throw new ApiError('RATE_LIMITED', 'Rate limit exceeded. Please wait a moment and try again.', 429);
        }
      }
      
      throw new ApiError('SEARCH_ERROR', 'Failed to search influencers. Please try again.', 500);
    }
  },

  async expandKeywords(topic: string): Promise<{ expandedKeywords: string[] }> {
    // 简化版本：直接返回用户输入，不再进行AI扩展
    console.log(`🎯 Direct keyword expansion for: "${topic}"`);
    return {
      expandedKeywords: [topic]
    };
  },

  async exportToCsv(results: InfluencerResult[]): Promise<Blob> {
    try {
      if (!results || results.length === 0) {
        throw new ApiError('NO_DATA', 'No data to export');
      }

      const csv = this.generateCsv(results);
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('Export CSV error:', error);
      throw new ApiError('EXPORT_ERROR', 'Failed to export data');
    }
  },

  generateCsv(results: InfluencerResult[]): string {
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
  },

  escapeCsvValue(value: string): string {
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
};