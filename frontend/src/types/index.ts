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
  results: VideoResult[];
  expandedKeywords: string[];
  totalFound: number;
}

// 新的视频结果结构 - 以视频为主体
export interface VideoResult {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  // 关联的频道信息
  channel: {
    channelId: string;
    channelTitle: string;
    channelUrl: string;
    subscriberCount: number;
    thumbnailUrl: string;
    country?: string;
  };
  relevanceScore: number;
}

// 保留原有的结构作为兼容性
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

// 新的视频排序选项
export type VideoSortOption = 'relevance' | 'viewCount' | 'publishedAt' | 'likeCount' | 'duration';