import type { InfluencerResult, RecentVideo, SearchFilters } from '../types';

interface YouTubeApiResponse {
  items?: any[];
  nextPageToken?: string;
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export class YouTubeService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('YouTube API key is required');
    }
    this.apiKey = apiKey;
  }

  async searchInfluencers(
    keywords: string[], 
    filters: SearchFilters
  ): Promise<InfluencerResult[]> {
    const {
      region = 'US',
      minSubscribers = 1000,
      minViews = 10000,
      maxResults = 50
    } = filters;

    // Generate cache key
    const cacheKey = this.generateCacheKey('search', { keywords, filters });
    
    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      console.log(`Returning cached search results for keywords: ${keywords.join(', ')}`);
      return cachedResult;
    }

    try {
      console.log(`Searching YouTube influencers with keywords: ${keywords.join(', ')}`);

      const allChannels = new Map<string, InfluencerResult>();

      // Search with multiple keywords
      for (const keyword of keywords.slice(0, 5)) { // Limit to 5 keywords to avoid quota issues
        try {
          const channels = await this.searchByKeyword(keyword, region, Math.min(10, maxResults));
          
          channels.forEach(channel => {
            if (!allChannels.has(channel.channelId)) {
              allChannels.set(channel.channelId, channel);
            } else {
              // Update relevance score if this channel appears in multiple searches
              const existing = allChannels.get(channel.channelId)!;
              existing.relevanceScore = Math.min(100, existing.relevanceScore + 10);
            }
          });
        } catch (error) {
          console.warn(`Failed to search for keyword: ${keyword}`, error);
        }
      }

      // Filter results based on criteria
      let results = Array.from(allChannels.values())
        .filter(channel => 
          channel.subscriberCount >= minSubscribers &&
          (channel.recentVideos.length === 0 || 
           channel.recentVideos.some(video => video.viewCount >= minViews))
        );

      // Sort by relevance score and subscriber count
      results = results
        .sort((a, b) => {
          const relevanceDiff = b.relevanceScore - a.relevanceScore;
          if (Math.abs(relevanceDiff) < 5) {
            return b.subscriberCount - a.subscriberCount;
          }
          return relevanceDiff;
        })
        .slice(0, maxResults);

      // Cache the results for 30 minutes
      this.setCache(cacheKey, results, 30 * 60 * 1000);

      console.log(`Found ${results.length} influencers matching criteria`);
      return results;

    } catch (error) {
      console.error('YouTube search error:', error);
      throw new Error('Failed to search YouTube influencers');
    }
  }

  private async searchByKeyword(
    keyword: string, 
    region: string, 
    maxResults: number
  ): Promise<InfluencerResult[]> {
    try {
      // Search for videos first
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', keyword);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('regionCode', region);
      searchUrl.searchParams.set('maxResults', (maxResults * 2).toString());
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('publishedAfter', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
      searchUrl.searchParams.set('key', this.apiKey);

      const searchResponse = await fetch(searchUrl.toString());
      if (!searchResponse.ok) {
        throw new Error(`YouTube search failed: ${searchResponse.status}`);
      }

      const searchData: YouTubeApiResponse = await searchResponse.json();

      if (!searchData.items) {
        return [];
      }

      // Extract unique channel IDs
      const channelIds = [...new Set(
        searchData.items
          .map(item => item.snippet?.channelId)
          .filter(Boolean) as string[]
      )];

      if (channelIds.length === 0) {
        return [];
      }

      // Get channel details
      const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      channelsUrl.searchParams.set('part', 'snippet,statistics,brandingSettings');
      channelsUrl.searchParams.set('id', channelIds.slice(0, maxResults).join(','));
      channelsUrl.searchParams.set('key', this.apiKey);

      const channelsResponse = await fetch(channelsUrl.toString());
      if (!channelsResponse.ok) {
        throw new Error(`YouTube channels API failed: ${channelsResponse.status}`);
      }

      const channelsData: YouTubeApiResponse = await channelsResponse.json();

      if (!channelsData.items) {
        return [];
      }

      // Process channels
      const channels: InfluencerResult[] = [];
      
      for (const channel of channelsData.items) {
        try {
          const channelData = await this.processChannel(channel, keyword);
          if (channelData) {
            channels.push(channelData);
          }
        } catch (error) {
          console.warn(`Failed to process channel ${channel.id}:`, error);
        }
      }

      return channels;

    } catch (error) {
      console.error(`Search by keyword error for "${keyword}":`, error);
      return [];
    }
  }

  private async processChannel(channel: any, searchKeyword: string): Promise<InfluencerResult | null> {
    try {
      const snippet = channel.snippet;
      const statistics = channel.statistics;

      if (!snippet || !statistics) {
        return null;
      }

      const subscriberCount = parseInt(statistics.subscriberCount || '0');
      const viewCount = parseInt(statistics.viewCount || '0');
      const videoCount = parseInt(statistics.videoCount || '0');

      // Skip channels with very low stats
      if (subscriberCount < 100) {
        return null;
      }

      // Get recent videos (获取更多视频，然后按播放量排序选择前3个)
      const recentVideos = await this.getTopViewedVideos(channel.id, searchKeyword, 3);

      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(
        snippet.title || '',
        snippet.description || '',
        searchKeyword,
        subscriberCount,
        recentVideos
      );

      return {
        channelId: channel.id,
        channelTitle: snippet.title || 'Unknown Channel',
        channelUrl: `https://www.youtube.com/channel/${channel.id}`,
        thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        subscriberCount,
        viewCount,
        videoCount,
        country: snippet.country || 'Unknown',
        recentVideos,
        relevanceScore
      };

    } catch (error) {
      console.warn('Process channel error:', error);
      return null;
    }
  }

  private async getTopViewedVideos(channelId: string, searchKeyword: string, maxResults: number): Promise<RecentVideo[]> {
    try {
      // 获取更多视频以便筛选 (获取20个视频)
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('channelId', channelId);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('order', 'relevance'); // 改为按相关性排序
      searchUrl.searchParams.set('maxResults', '20'); // 获取更多视频
      searchUrl.searchParams.set('key', this.apiKey);

      const searchResponse = await fetch(searchUrl.toString());
      if (!searchResponse.ok) {
        return [];
      }

      const searchData: YouTubeApiResponse = await searchResponse.json();

      if (!searchData.items) {
        return [];
      }

      const videoIds = searchData.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];

      if (videoIds.length === 0) {
        return [];
      }

      const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videosUrl.searchParams.set('part', 'snippet,statistics');
      videosUrl.searchParams.set('id', videoIds.join(','));
      videosUrl.searchParams.set('key', this.apiKey);

      const videosResponse = await fetch(videosUrl.toString());
      if (!videosResponse.ok) {
        return [];
      }

      const videosData: YouTubeApiResponse = await videosResponse.json();

      if (!videosData.items) {
        return [];
      }

      // 转换为RecentVideo格式并计算相关性分数
      const videos = videosData.items.map(video => ({
        videoId: video.id!,
        title: video.snippet?.title || 'Unknown Title',
        publishedAt: video.snippet?.publishedAt || '',
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url || '',
        relevanceScore: this.calculateVideoRelevanceScore(video.snippet?.title || '', searchKeyword)
      }));

      // 按相关性和播放量综合排序，优先显示相关的高播放量视频
      const sortedVideos = videos
        .filter(video => video.relevanceScore > 0.3) // 过滤掉不太相关的视频
        .sort((a, b) => {
          // 综合考虑相关性分数和播放量
          const scoreA = a.relevanceScore * 0.7 + Math.log10(a.viewCount + 1) * 0.3;
          const scoreB = b.relevanceScore * 0.7 + Math.log10(b.viewCount + 1) * 0.3;
          return scoreB - scoreA;
        })
        .slice(0, maxResults); // 取前maxResults个

      // 移除relevanceScore字段，因为接口不需要
      return sortedVideos.map(({ relevanceScore, ...video }) => video);

    } catch (error) {
      console.warn(`Failed to get top viewed videos for channel ${channelId}:`, error);
      return [];
    }
  }


  private calculateRelevanceScore(
    channelTitle: string,
    channelDescription: string,
    searchKeyword: string,
    subscriberCount: number,
    recentVideos: RecentVideo[]
  ): number {
    let score = 0;

    // Title relevance (30 points max)
    const titleLower = channelTitle.toLowerCase();
    const keywordLower = searchKeyword.toLowerCase();
    if (titleLower.includes(keywordLower)) {
      score += 30;
    } else {
      const keywordWords = keywordLower.split(' ');
      const matchingWords = keywordWords.filter(word => titleLower.includes(word));
      score += (matchingWords.length / keywordWords.length) * 20;
    }

    // Description relevance (20 points max)
    const descriptionLower = channelDescription.toLowerCase();
    if (descriptionLower.includes(keywordLower)) {
      score += 20;
    } else {
      const keywordWords = keywordLower.split(' ');
      const matchingWords = keywordWords.filter(word => descriptionLower.includes(word));
      score += (matchingWords.length / keywordWords.length) * 15;
    }

    // Recent video relevance (25 points max)
    let videoRelevance = 0;
    recentVideos.forEach(video => {
      if (video.title.toLowerCase().includes(keywordLower)) {
        videoRelevance += 8;
      }
    });
    score += Math.min(25, videoRelevance);

    // Subscriber count bonus (25 points max)
    if (subscriberCount > 1000000) score += 25;
    else if (subscriberCount > 100000) score += 20;
    else if (subscriberCount > 10000) score += 15;
    else if (subscriberCount > 1000) score += 10;
    else score += 5;

    return Math.min(100, Math.round(score));
  }

  private calculateVideoRelevanceScore(videoTitle: string, searchKeyword: string): number {
    const titleLower = videoTitle.toLowerCase();
    const keywordLower = searchKeyword.toLowerCase();
    
    // 精确匹配
    if (titleLower.includes(keywordLower)) {
      return 1.0;
    }
    
    // 单词匹配
    const keywordWords = keywordLower.split(' ').filter(word => word.length > 2);
    const titleWords = titleLower.split(' ');
    
    let matchCount = 0;
    keywordWords.forEach(keyword => {
      titleWords.forEach(titleWord => {
        if (titleWord.includes(keyword) || keyword.includes(titleWord)) {
          matchCount++;
        }
      });
    });
    
    const relevanceRatio = matchCount / Math.max(keywordWords.length, 1);
    
    // 加分项：包含常见评测词汇
    const techWords = ['review', 'test', 'unboxing', 'setup', 'comparison', 'vs', 'tutorial', 'guide'];
    const hasTechWords = techWords.some(word => titleLower.includes(word));
    
    let score = relevanceRatio;
    if (hasTechWords) {
      score += 0.2;
    }
    
    return Math.min(1.0, score);
  }

  private generateCacheKey(prefix: string, params: any): string {
    const hash = btoa(JSON.stringify(params))
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 16);
    return `${prefix}_${hash}`;
  }

  private getFromCache(key: string): any {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, expiry } = JSON.parse(cached);
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private setCache(key: string, data: any, ttlMs: number): void {
    try {
      const expiry = Date.now() + ttlMs;
      localStorage.setItem(key, JSON.stringify({ data, expiry }));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
}