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

export interface KeywordExpansionRequest {
  topic: string;
  maxKeywords?: number;
  language?: string;
}

export interface KeywordExpansionResponse {
  originalTopic: string;
  expandedKeywords: string[];
  confidence: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expiry: number;
}