import type { InfluencerResult, RecentVideo, SearchFilters, VideoResult } from '../types';

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
    console.log(`🔑 YouTubeService initialized with API key: ${apiKey.substring(0, 10)}...${apiKey.substring(-4)}`);
  }

  // 测试API连接状态
  async testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔧 Testing YouTube API connection...');
      
      // 使用简单的搜索请求测试API
      const testUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      testUrl.searchParams.set('part', 'snippet');
      testUrl.searchParams.set('q', 'test');
      testUrl.searchParams.set('type', 'video');
      testUrl.searchParams.set('maxResults', '1');
      testUrl.searchParams.set('key', this.apiKey);

      const response = await fetch(testUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        console.log('✅ YouTube API connection successful');
        return {
          success: true,
          message: '✅ YouTube API连接正常'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ YouTube API connection failed:', errorData);
        
        let message = '❌ YouTube API连接失败';
        if (response.status === 403) {
          const error = errorData?.error;
          console.error('🚨 YouTube API 403错误详情:', errorData);
          
          if (error?.message?.includes('quotaExceeded')) {
            message = '🚫 YouTube API配额已用完 - 请等待配额重置或升级计划';
          } else if (error?.message?.includes('accessNotConfigured')) {
            message = '🔧 YouTube Data API v3未启用 - 请在Google Cloud Console中启用';
          } else if (error?.message?.includes('keyInvalid')) {
            message = '🔑 YouTube API密钥无效 - 请检查密钥是否正确';
          } else if (error?.message?.includes('forbidden')) {
            message = '🚫 API密钥权限不足 - 请检查密钥是否有YouTube API权限';
          } else {
            message = `🚫 YouTube API访问被拒绝 - 错误: ${error?.message || '未知错误'}`;
          }
          
          // 提供详细的解决方案
          console.error('🔧 解决方案:');
          console.error('1. 确认API密钥有效: https://console.cloud.google.com/apis/credentials');
          console.error('2. 启用YouTube Data API v3: https://console.cloud.google.com/apis/library/youtube.googleapis.com');
          console.error('3. 检查API配额: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas');
          console.error('4. 验证HTTP引用来源设置');
          
        } else if (response.status === 400) {
          message = '❌ API请求参数错误';
        }
        
        return {
          success: false,
          message,
          details: {
            status: response.status,
            error: errorData
          }
        };
      }
    } catch (error) {
      console.error('❌ YouTube API test failed:', error);
      return {
        success: false,
        message: '❌ 网络连接失败或API不可用',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // 清理过期缓存和损坏的缓存数据
  static clearExpiredCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const youtubeKeys = keys.filter(key => key.startsWith('search_'));
      
      youtubeKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { data, expiry } = JSON.parse(cached);
            if (!data || !expiry || Date.now() > expiry) {
              localStorage.removeItem(key);
              console.log(`Cleared expired cache: ${key}`);
            }
          }
        } catch (e) {
          // 清理损坏的缓存数据
          localStorage.removeItem(key);
          console.log(`Cleared corrupted cache: ${key}`);
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  async searchInfluencers(
    keywords: string[], 
    filters: SearchFilters,
    originalTopic?: string
  ): Promise<InfluencerResult[]> {
    const {
      region = 'US',
      minSubscribers = 1000,
      minViews = 10000,
      maxResults = 50
    } = filters;

    // Generate cache key that includes API key identifier to prevent cross-key contamination
    const cacheKey = this.generateCacheKey('search', { keywords, filters, apiKeyHash: this.getApiKeyHash() });
    
    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      console.log(`Returning cached search results for keywords: ${keywords.join(', ')}`);
      return cachedResult;
    }

    try {
      console.log(`Searching YouTube influencers with keywords: ${keywords.join(', ')}`);
      if (originalTopic) {
        console.log(`🎯 Original topic: "${originalTopic}" - prioritizing related keywords`);
      }

      const allChannels = new Map<string, InfluencerResult>();

      // 优化关键词优先级 - 包含原始产品名称的关键词优先搜索
      const prioritizedKeywords = this.prioritizeKeywords(keywords, originalTopic);
      console.log(`📊 Keyword priority order: ${prioritizedKeywords.join(', ')}`);

      // 直接搜索策略：对单个关键词进行多种搜索模式
      for (const keyword of prioritizedKeywords.slice(0, 1)) { // 只处理第一个关键词（用户输入）
        console.log(`🎯 Performing comprehensive search for: "${keyword}"`);
        
        // 使用不同的搜索模式来获取更全面的结果
        const searchModes = [
          keyword, // 原始关键词
          `${keyword} review`, // 评测视频
          `${keyword} unboxing`, // 开箱视频
          `${keyword} test`, // 测试视频
          `${keyword} hands on` // 上手体验
        ];
        
        for (const searchQuery of searchModes) {
          try {
            const channels = await this.searchByKeyword(searchQuery, region, Math.min(10, maxResults), originalTopic);
            
            channels.forEach(channel => {
              if (!allChannels.has(channel.channelId)) {
                allChannels.set(channel.channelId, channel);
              } else {
                // Update relevance score if this channel appears in multiple searches
                const existing = allChannels.get(channel.channelId)!;
                existing.relevanceScore = Math.min(100, existing.relevanceScore + 15);
              }
            });
          } catch (error) {
            console.warn(`Failed to search for query: ${searchQuery}`, error);
          }
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
    maxResults: number,
    originalTopic?: string
  ): Promise<InfluencerResult[]> {
    try {
      // 直接搜索策略，使用精确的搜索查询
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      // 使用传入的关键词进行精确搜索（已经在上层处理了不同的搜索模式）
      searchUrl.searchParams.set('q', keyword);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('regionCode', region);
      searchUrl.searchParams.set('maxResults', (maxResults * 2).toString()); // 适度增加搜索结果数量
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('publishedAfter', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
      searchUrl.searchParams.set('key', this.apiKey);

      console.log(`🔍 Searching YouTube for: "${keyword}"`);
      console.log(`📡 API URL: ${searchUrl.toString().replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      const searchResponse = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!searchResponse.ok) {
        let errorMessage = `YouTube API Error ${searchResponse.status}`;
        let userMessage = '';
        
        try {
          const errorData = await searchResponse.json();
          console.error('📱 YouTube API Error Details:', errorData);
          
          if (searchResponse.status === 403) {
            const error = errorData?.error;
            if (error?.message?.includes('quotaExceeded')) {
              userMessage = '🚫 YouTube API 配额已用完，请稍后重试或检查API密钥限制。';
              errorMessage = 'YouTube API quota exceeded';
            } else if (error?.message?.includes('accessNotConfigured')) {
              userMessage = '🔧 YouTube Data API v3 未启用，请在Google Cloud Console中启用该API。';
              errorMessage = 'YouTube Data API v3 not enabled';
            } else if (error?.message?.includes('keyInvalid')) {
              userMessage = '🔑 YouTube API密钥无效，请检查设置中的API密钥是否正确。';
              errorMessage = 'Invalid YouTube API key';
            } else {
              userMessage = '🚫 YouTube API访问被拒绝，请检查API密钥权限设置。';
              errorMessage = 'YouTube API access forbidden';
            }
          } else if (searchResponse.status === 400) {
            userMessage = '❌ 搜索参数无效，请尝试不同的关键词。';
            errorMessage = 'Invalid search parameters';
          } else {
            userMessage = `🌐 YouTube API请求失败 (${searchResponse.status})，请稍后重试。`;
          }
        } catch (e) {
          userMessage = `🌐 YouTube API请求失败 (${searchResponse.status})，请稍后重试。`;
        }
        
        // 详细的403错误诊断
        if (searchResponse.status === 403) {
          console.error('🚨 YouTube API 403错误详细诊断:');
          console.error('📍 检查清单:');
          console.error('1. API密钥是否有效？');
          console.error('2. YouTube Data API v3是否已启用？');
          console.error('3. API密钥是否有YouTube API权限？');
          console.error('4. 是否设置了正确的HTTP引用来源？');
          console.error('5. API配额是否已用完？');
          console.error('🔗 请访问: https://console.cloud.google.com/apis/dashboard');
        }
        
        const error = new Error(userMessage || errorMessage);
        (error as any).status = searchResponse.status;
        (error as any).userMessage = userMessage;
        throw error;
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

      const channelsResponse = await fetch(channelsUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      if (!channelsResponse.ok) {
        let errorMessage = `YouTube Channels API Error ${channelsResponse.status}`;
        let userMessage = '';
        
        try {
          const errorData = await channelsResponse.json();
          console.error('📱 YouTube Channels API Error Details:', errorData);
          
          if (channelsResponse.status === 403) {
            const error = errorData?.error;
            if (error?.message?.includes('quotaExceeded')) {
              userMessage = '🚫 YouTube API 配额已用完，请稍后重试或检查API密钥限制。';
              errorMessage = 'YouTube API quota exceeded';
            } else if (error?.message?.includes('accessNotConfigured')) {
              userMessage = '🔧 YouTube Data API v3 未启用，请在Google Cloud Console中启用该API。';
              errorMessage = 'YouTube Data API v3 not enabled';
            } else if (error?.message?.includes('keyInvalid')) {
              userMessage = '🔑 YouTube API密钥无效，请检查设置中的API密钥是否正确。';
              errorMessage = 'Invalid YouTube API key';
            } else {
              userMessage = '🚫 YouTube API访问被拒绝，请检查API密钥权限设置。';
              errorMessage = 'YouTube API access forbidden';
            }
          } else if (channelsResponse.status === 400) {
            userMessage = '❌ 频道查询参数无效，请尝试不同的搜索条件。';
            errorMessage = 'Invalid channel parameters';
          } else {
            userMessage = `🌐 YouTube频道API请求失败 (${channelsResponse.status})，请稍后重试。`;
          }
        } catch (e) {
          userMessage = `🌐 YouTube频道API请求失败 (${channelsResponse.status})，请稍后重试。`;
        }
        
        const error = new Error(userMessage || errorMessage);
        (error as any).status = channelsResponse.status;
        (error as any).userMessage = userMessage;
        throw error;
      }

      const channelsData: YouTubeApiResponse = await channelsResponse.json();

      if (!channelsData.items) {
        return [];
      }

      // Process channels
      const channels: InfluencerResult[] = [];
      
      for (const channel of channelsData.items) {
        try {
          const channelData = await this.processChannel(channel, keyword, originalTopic);
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

  private async processChannel(channel: any, searchKeyword: string, originalTopic?: string): Promise<InfluencerResult | null> {
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
        recentVideos,
        originalTopic
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

      const searchResponse = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
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

      const videosResponse = await fetch(videosUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      if (!videosResponse.ok) {
        console.warn(`YouTube Videos API error ${videosResponse.status} for channel ${channelId}`);
        
        try {
          const errorData = await videosResponse.json();
          console.error('📱 YouTube Videos API Error Details:', errorData);
          
          if (videosResponse.status === 403) {
            const error = errorData?.error;
            if (error?.message?.includes('quotaExceeded')) {
              console.warn('🚫 API quota exceeded while fetching videos');
            } else if (error?.message?.includes('accessNotConfigured')) {
              console.warn('🔧 YouTube Data API v3 not enabled');
            } else if (error?.message?.includes('keyInvalid')) {
              console.warn('🔑 Invalid API key while fetching videos');
            }
          }
        } catch (e) {
          console.warn('Failed to parse video API error response');
        }
        
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
        .filter(video => video.relevanceScore > 0.5) // 提高相关性过滤标准
        .sort((a, b) => {
          // 综合考虑相关性分数和播放量，提高相关性权重
          const scoreA = a.relevanceScore * 0.8 + Math.log10(a.viewCount + 1) * 0.2;
          const scoreB = b.relevanceScore * 0.8 + Math.log10(b.viewCount + 1) * 0.2;
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
    recentVideos: RecentVideo[],
    originalTopic?: string
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

    // 原始产品topic额外评分 (最多20分额外加分)
    if (originalTopic) {
      const originalTopicLower = originalTopic.toLowerCase();
      const originalWords = originalTopicLower.split(' ').filter(word => word.length > 2);
      
      // 频道标题包含完整原始topic名称 - 最高优先级
      if (titleLower.includes(originalTopicLower)) {
        score += 20;
        console.log(`🎯 Channel "${channelTitle}" contains original topic "${originalTopic}" - bonus +20`);
      } else {
        // 频道标题包含原始topic中的重要词汇
        let wordMatches = 0;
        originalWords.forEach(word => {
          if (titleLower.includes(word)) {
            wordMatches++;
          }
        });
        if (wordMatches > 0) {
          const wordBonus = Math.min(15, (wordMatches / originalWords.length) * 15);
          score += wordBonus;
          console.log(`🎯 Channel "${channelTitle}" matches ${wordMatches}/${originalWords.length} topic words - bonus +${wordBonus.toFixed(1)}`);
        }
      }
      
      // 视频标题包含原始topic的额外加分
      let videoTopicMatches = 0;
      recentVideos.forEach(video => {
        if (video.title.toLowerCase().includes(originalTopicLower)) {
          videoTopicMatches++;
        }
      });
      if (videoTopicMatches > 0) {
        const videoBonus = Math.min(10, videoTopicMatches * 3);
        score += videoBonus;
        console.log(`🎯 Channel has ${videoTopicMatches} videos about "${originalTopic}" - bonus +${videoBonus}`);
      }
    }

    return Math.min(120, Math.round(score)); // 提高上限到120分，因为有原始topic加分
  }

  private calculateVideoRelevanceScore(videoTitle: string, searchKeyword: string): number {
    const titleLower = videoTitle.toLowerCase();
    const keywordLower = searchKeyword.toLowerCase();
    
    // 精确匹配 - 最高分
    if (titleLower.includes(keywordLower)) {
      return 1.0;
    }
    
    // 单词匹配 - 更严格的匹配逻辑
    const keywordWords = keywordLower.split(' ').filter(word => word.length > 2);
    const titleWords = titleLower.split(/[\s\-_\(\)\[\]]+/).filter(word => word.length > 1);
    
    let exactMatchCount = 0;
    let partialMatchCount = 0;
    
    keywordWords.forEach(keyword => {
      titleWords.forEach(titleWord => {
        if (titleWord === keyword) {
          exactMatchCount++;
        } else if (titleWord.includes(keyword) || keyword.includes(titleWord)) {
          partialMatchCount++;
        }
      });
    });
    
    // 计算匹配得分：精确匹配权重更高
    const exactRatio = exactMatchCount / Math.max(keywordWords.length, 1);
    const partialRatio = partialMatchCount / Math.max(keywordWords.length, 1);
    let score = exactRatio * 0.8 + partialRatio * 0.3;
    
    // 加分项：包含常见评测和相关词汇
    const relevantWords = ['review', 'test', 'unboxing', 'setup', 'comparison', 'vs', 'tutorial', 'guide', 'hands-on', 'first look', 'impressions'];
    const hasRelevantWords = relevantWords.some(word => titleLower.includes(word));
    
    if (hasRelevantWords) {
      score += 0.15;
    }
    
    // 关键词在标题开头的额外加分
    const titleStart = titleLower.substring(0, Math.min(50, titleLower.length));
    if (keywordWords.some(word => titleStart.includes(word))) {
      score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  private generateCacheKey(prefix: string, params: any): string {
    // 创建更稳定的缓存key，避免hash冲突
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    
    // 使用更好的hash函数避免冲突
    let hash = 0;
    for (let i = 0; i < paramsStr.length; i++) {
      const char = paramsStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    // 使用完整的hash而不是截断，减少冲突概率
    return `${prefix}_${Math.abs(hash).toString(36)}`;
  }

  // 新方法：直接搜索视频（以视频为主体）
  async searchVideos(
    keywords: string[], 
    filters: SearchFilters,
    originalTopic?: string
  ): Promise<VideoResult[]> {
    const {
      region = 'US',
      minViews = 10000,
      maxResults = 50
    } = filters;

    // Generate cache key that includes API key identifier
    const cacheKey = this.generateCacheKey('videos_search', { keywords, filters, apiKeyHash: this.getApiKeyHash() });
    
    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      console.log(`Returning cached video search results for keywords: ${keywords.join(', ')}`);
      return cachedResult;
    }

    try {
      console.log(`🎥 Searching YouTube videos with keywords: ${keywords.join(', ')}`);
      if (originalTopic) {
        console.log(`🎯 Original topic: "${originalTopic}" - prioritizing related videos`);
      }

      const allVideos = new Map<string, VideoResult>();

      // 对单个关键词进行多种搜索模式
      for (const keyword of keywords.slice(0, 1)) { // 只处理第一个关键词（用户输入）
        console.log(`🎯 Performing comprehensive video search for: "${keyword}"`);
        
        // 使用不同的搜索模式来获取更全面的结果
        const searchModes = [
          keyword, // 原始关键词
          `${keyword} review`, // 评测视频
          `${keyword} unboxing`, // 开箱视频
          `${keyword} test`, // 测试视频
          `${keyword} hands on` // 上手体验
        ];
        
        for (const searchQuery of searchModes) {
          try {
            const videos = await this.searchVideosByKeyword(searchQuery, region, Math.min(15, maxResults), originalTopic);
            
            videos.forEach(video => {
              if (!allVideos.has(video.videoId)) {
                allVideos.set(video.videoId, video);
              } else {
                // Update relevance score if this video appears in multiple searches
                const existing = allVideos.get(video.videoId)!;
                existing.relevanceScore = Math.min(100, existing.relevanceScore + 15);
              }
            });
          } catch (error) {
            console.warn(`Failed to search for video query: ${searchQuery}`, error);
          }
        }
      }

      // Filter results based on criteria
      let results = Array.from(allVideos.values())
        .filter(video => video.viewCount >= minViews);

      // Sort by relevance score and view count
      results = results
        .sort((a, b) => {
          const relevanceDiff = b.relevanceScore - a.relevanceScore;
          if (Math.abs(relevanceDiff) < 5) {
            return b.viewCount - a.viewCount;
          }
          return relevanceDiff;
        })
        .slice(0, maxResults);

      // Cache the results for 30 minutes
      this.setCache(cacheKey, results, 30 * 60 * 1000);

      console.log(`Found ${results.length} videos matching criteria`);
      return results;

    } catch (error) {
      console.error('YouTube video search error:', error);
      throw new Error('Failed to search YouTube videos');
    }
  }

  private async searchVideosByKeyword(
    keyword: string, 
    region: string, 
    maxResults: number,
    originalTopic?: string
  ): Promise<VideoResult[]> {
    try {
      // 直接搜索视频
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', keyword);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('regionCode', region);
      searchUrl.searchParams.set('maxResults', maxResults.toString());
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('publishedAfter', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
      searchUrl.searchParams.set('key', this.apiKey);

      console.log(`🔍 Searching YouTube videos for: "${keyword}"`);
      
      const searchResponse = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!searchResponse.ok) {
        console.error(`YouTube API Error ${searchResponse.status} for video search: ${keyword}`);
        return [];
      }

      const searchData: YouTubeApiResponse = await searchResponse.json();

      if (!searchData.items) {
        return [];
      }

      // Extract video IDs
      const videoIds = searchData.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];

      if (videoIds.length === 0) {
        return [];
      }

      // Get detailed video information
      const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videosUrl.searchParams.set('part', 'snippet,statistics,contentDetails');
      videosUrl.searchParams.set('id', videoIds.join(','));
      videosUrl.searchParams.set('key', this.apiKey);

      const videosResponse = await fetch(videosUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!videosResponse.ok) {
        console.warn(`YouTube Videos API error ${videosResponse.status} for videos`);
        return [];
      }

      const videosData: YouTubeApiResponse = await videosResponse.json();

      if (!videosData.items) {
        return [];
      }

      // Get channel information for all videos
      const channelIds = [...new Set(
        videosData.items
          .map(item => item.snippet?.channelId)
          .filter(Boolean) as string[]
      )];

      const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      channelsUrl.searchParams.set('part', 'snippet,statistics');
      channelsUrl.searchParams.set('id', channelIds.join(','));
      channelsUrl.searchParams.set('key', this.apiKey);

      const channelsResponse = await fetch(channelsUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      const channelsData: YouTubeApiResponse = channelsResponse.ok ? await channelsResponse.json() : { items: [] };
      const channelMap = new Map(
        (channelsData.items || []).map(channel => [channel.id, channel])
      );

      // Process videos into VideoResult format
      const videos: VideoResult[] = [];
      
      for (const video of videosData.items) {
        try {
          const videoData = await this.processVideoData(video, channelMap, keyword, originalTopic);
          if (videoData) {
            videos.push(videoData);
          }
        } catch (error) {
          console.warn(`Failed to process video ${video.id}:`, error);
        }
      }

      return videos;

    } catch (error) {
      console.error(`Search videos by keyword error for "${keyword}":`, error);
      return [];
    }
  }

  private async processVideoData(
    video: any,
    channelMap: Map<string, any>,
    searchKeyword: string,
    originalTopic?: string
  ): Promise<VideoResult | null> {
    try {
      const snippet = video.snippet;
      const statistics = video.statistics;
      const contentDetails = video.contentDetails;

      if (!snippet || !statistics) {
        return null;
      }

      const channelData = channelMap.get(snippet.channelId);
      if (!channelData) {
        return null;
      }

      const viewCount = parseInt(statistics.viewCount || '0');
      const likeCount = parseInt(statistics.likeCount || '0');
      const commentCount = parseInt(statistics.commentCount || '0');

      // Calculate relevance score for this video
      const relevanceScore = this.calculateVideoRelevanceScore(
        snippet.title || '',
        searchKeyword
      );

      return {
        videoId: video.id,
        title: snippet.title || 'Unknown Title',
        description: snippet.description || '',
        publishedAt: snippet.publishedAt || '',
        viewCount,
        likeCount,
        commentCount,
        duration: contentDetails?.duration || '',
        thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        channel: {
          channelId: snippet.channelId,
          channelTitle: snippet.channelTitle || 'Unknown Channel',
          channelUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
          subscriberCount: parseInt(channelData.statistics?.subscriberCount || '0'),
          thumbnailUrl: channelData.snippet?.thumbnails?.medium?.url || '',
          country: channelData.snippet?.country || 'Unknown'
        },
        relevanceScore: Math.round(relevanceScore * 100)
      };

    } catch (error) {
      console.warn('Process video data error:', error);
      return null;
    }
  }

  // 生成API key的安全哈希值用于缓存key
  private getApiKeyHash(): string {
    // 使用API key的前8位和后4位创建唯一标识，避免泄露完整key
    return `${this.apiKey.substring(0, 8)}_${this.apiKey.substring(-4)}`;
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

  // 关键词优先级排序 - 包含原始产品名称的关键词优先
  private prioritizeKeywords(keywords: string[], originalTopic?: string): string[] {
    if (!originalTopic) {
      return keywords; // 如果没有原始topic，返回原数组
    }

    const topicLower = originalTopic.toLowerCase();
    const topicWords = topicLower.split(' ').filter(word => word.length > 2);
    
    // 计算每个关键词与原始topic的相关性分数
    const keywordScores = keywords.map(keyword => {
      const keywordLower = keyword.toLowerCase();
      let score = 0;
      
      // 精确匹配原始topic得最高分
      if (keywordLower.includes(topicLower)) {
        score += 100;
      }
      
      // 包含原始topic中的重要词汇
      topicWords.forEach(word => {
        if (keywordLower.includes(word)) {
          score += 20;
        }
      });
      
      // 以原始topic开头的关键词额外加分
      if (keywordLower.startsWith(topicLower)) {
        score += 50;
      }
      
      return { keyword, score };
    });
    
    // 按分数降序排序，然后提取关键词
    const sortedKeywords = keywordScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.keyword);
    
    console.log(`🎯 Keyword prioritization for "${originalTopic}":`, 
      sortedKeywords.map((kw, i) => `${i + 1}. ${kw} (score: ${keywordScores.find(k => k.keyword === kw)?.score})`));
    
    return sortedKeywords;
  }
}