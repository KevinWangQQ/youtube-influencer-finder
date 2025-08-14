export interface SearchRequest {
  topic: string;
  filters: {
    region?: string;
    minSubscribers?: number;
    minViews?: number;
    maxResults?: number;
  };
}

export interface SearchResponse {
  searchId: string;
  results: InfluencerResult[];
  expandedKeywords: string[];
  totalFound: number;
}

export interface InfluencerResult {
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  country: string;
  recentVideos: RecentVideo[];
  relevanceScore: number;
}

export interface RecentVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  thumbnailUrl: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      path: string;
      message: string;
    }>;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface SearchFilters {
  region: string;
  minSubscribers: number;
  minViews: number;
  maxResults: number;
}

export type SortOption = 'relevance' | 'subscribers' | 'views' | 'recent';