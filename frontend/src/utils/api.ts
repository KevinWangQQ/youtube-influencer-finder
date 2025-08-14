import type { SearchRequest, SearchResponse, InfluencerResult, SearchFilters } from '../types';
import { OpenAIService } from '../services/openai.service';
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
    console.log(`📝 OpenAI Key: ${settings.openaiApiKey ? `${settings.openaiApiKey.substring(0, 8)}...` : 'MISSING'}`);
    console.log(`📺 YouTube Key: ${settings.youtubeApiKey ? `${settings.youtubeApiKey.substring(0, 10)}...` : 'MISSING'}`);
    
    if (!settings.openaiApiKey) {
      throw new ApiError('MISSING_OPENAI_KEY', 'OpenAI API key is required. Please set it in Settings.');
    }
    
    if (!settings.youtubeApiKey) {
      throw new ApiError('MISSING_YOUTUBE_KEY', 'YouTube API key is required. Please set it in Settings.');
    }

    try {
      // Step 1: Expand keywords using OpenAI
      const openaiService = new OpenAIService(settings.openaiApiKey);
      const keywordResponse = await openaiService.expandKeywords({
        topic: request.topic,
        maxKeywords: 10,
        language: 'en'
      });

      console.log(`Expanded ${keywordResponse.expandedKeywords.length} keywords`);

      // Step 2: Search YouTube with expanded keywords
      const youtubeService = new YouTubeService(settings.youtubeApiKey);
      const searchFilters: SearchFilters = {
        region: request.filters.region || 'US',
        minSubscribers: request.filters.minSubscribers || 1000,
        minViews: request.filters.minViews || 10000,
        maxResults: request.filters.maxResults || 50
      };
      const influencers = await youtubeService.searchInfluencers(
        keywordResponse.expandedKeywords,
        searchFilters,
        request.topic
      );

      // Step 3: Generate search ID for potential future use
      const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response: SearchResponse = {
        searchId,
        results: influencers,
        expandedKeywords: keywordResponse.expandedKeywords,
        totalFound: influencers.length
      };

      console.log(`Search completed successfully. Found ${influencers.length} influencers`);
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
    const settings = SettingsService.getSettings();
    
    if (!settings.openaiApiKey) {
      throw new ApiError('MISSING_OPENAI_KEY', 'OpenAI API key is required. Please set it in Settings.');
    }

    try {
      const openaiService = new OpenAIService(settings.openaiApiKey);
      const response = await openaiService.expandKeywords({ topic });
      
      return {
        expandedKeywords: response.expandedKeywords
      };
    } catch (error) {
      console.error('Expand keywords error:', error);
      throw new ApiError('KEYWORD_EXPANSION_ERROR', 'Failed to expand keywords. Please try again.');
    }
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