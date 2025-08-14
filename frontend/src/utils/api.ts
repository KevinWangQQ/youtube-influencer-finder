import type { SearchRequest, SearchResponse, InfluencerResult, SearchFilters, VideoResult } from '../types';
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
    console.log(`🔧 Checking API Keys...`);
    
    if (!SettingsService.hasRequiredKeys()) {
      throw new ApiError('MISSING_YOUTUBE_KEY', 'No active YouTube API keys available. Please add API keys in Settings.');
    }

    try {
      console.log(`🎯 Direct search for: "${request.topic}"`);

      // 使用新的多key YouTube服务
      const youtubeService = new YouTubeService();
      const searchFilters: SearchFilters = {
        region: request.filters.region || 'US',
        minSubscribers: request.filters.minSubscribers || 1000,
        minViews: request.filters.minViews || 10000,
        maxResults: request.filters.maxResults || 50
      };
      
      // 使用用户输入的机型作为直接搜索关键词，搜索视频
      const directKeywords = [request.topic];
      const videos = await youtubeService.searchVideos(
        directKeywords,
        searchFilters,
        request.topic
      );

      // Generate search ID for potential future use
      const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response: SearchResponse = {
        searchId,
        results: videos,
        expandedKeywords: directKeywords, // 直接返回用户输入作为"扩展"关键词
        totalFound: videos.length
      };

      console.log(`Direct video search completed successfully. Found ${videos.length} videos`);
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

  async exportToCsv(results: VideoResult[]): Promise<Blob> {
    try {
      if (!results || results.length === 0) {
        throw new ApiError('NO_DATA', 'No data to export');
      }

      const csv = this.generateVideoCsv(results);
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('Export CSV error:', error);
      throw new ApiError('EXPORT_ERROR', 'Failed to export data');
    }
  },

  generateVideoCsv(results: VideoResult[]): string {
    if (results.length === 0) {
      return 'No data to export';
    }

    // CSV headers for video-centric export
    const headers = [
      'Video Title',
      'Video URL',
      'Video Description',
      'Published Date',
      'View Count',
      'Like Count',
      'Comment Count',
      'Duration',
      'Relevance Score',
      'Channel Name',
      'Channel URL',
      'Channel Subscribers',
      'Channel Country'
    ];

    // CSV rows
    const rows = results.map(result => {
      return [
        this.escapeCsvValue(result.title || ''),
        result.videoUrl || '',
        this.escapeCsvValue(result.description?.substring(0, 200) || ''), // 限制描述长度
        result.publishedAt || '',
        result.viewCount || 0,
        result.likeCount || 0,
        result.commentCount || 0,
        result.duration || '',
        result.relevanceScore || 0,
        this.escapeCsvValue(result.channel.channelTitle || ''),
        result.channel.channelUrl || '',
        result.channel.subscriberCount || 0,
        result.channel.country || ''
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return csvContent;
  },

  // 保留原有的方法以便兼容性
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