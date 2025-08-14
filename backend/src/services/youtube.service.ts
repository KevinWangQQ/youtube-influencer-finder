import { google } from 'googleapis';
import { InfluencerResult, RecentVideo, SearchRequest } from '../types';
import { logger } from '../utils/logger';
import { cacheManager } from '../utils/cache';

export class YouTubeService {
  private youtube;

  constructor() {
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is required');
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
  }

  async searchInfluencers(
    keywords: string[], 
    filters: SearchRequest['filters']
  ): Promise<InfluencerResult[]> {
    const {
      region = 'US',
      minSubscribers = 1000,
      minViews = 10000,
      maxResults = 50
    } = filters;

    // Generate cache key
    const cacheKey = cacheManager.generateKey('search', { keywords, filters });
    
    // Check cache first
    const cachedResult = await cacheManager.get<InfluencerResult[]>(cacheKey);
    if (cachedResult) {
      logger.info(`Returning cached search results for keywords: ${keywords.join(', ')}`);
      return cachedResult;
    }

    try {
      logger.info(`Searching YouTube influencers with keywords: ${keywords.join(', ')}`);

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
          logger.warn(`Failed to search for keyword: ${keyword}`, error);
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

      // Cache the results
      await cacheManager.set(cacheKey, results, 30 * 60); // Cache for 30 minutes

      logger.info(`Found ${results.length} influencers matching criteria`);
      return results;

    } catch (error) {
      logger.error('YouTube search error:', error);
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
      const searchResponse = await this.youtube.search.list({
        part: ['snippet'],
        q: keyword,
        type: ['video'],
        regionCode: region,
        maxResults: maxResults * 2, // Get more videos to have more channels
        order: 'relevance',
        publishedAfter: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Last year
      });

      if (!searchResponse.data.items) {
        return [];
      }

      // Extract unique channel IDs
      const channelIds = [...new Set(
        searchResponse.data.items
          .map(item => item.snippet?.channelId)
          .filter(Boolean) as string[]
      )];

      if (channelIds.length === 0) {
        return [];
      }

      // Get channel details
      const channelsResponse = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'brandingSettings'],
        id: channelIds.slice(0, maxResults), // Limit to avoid quota issues
      });

      if (!channelsResponse.data.items) {
        return [];
      }

      // Process channels
      const channels: InfluencerResult[] = [];
      
      for (const channel of channelsResponse.data.items) {
        try {
          const channelData = await this.processChannel(channel, keyword);
          if (channelData) {
            channels.push(channelData);
          }
        } catch (error) {
          logger.warn(`Failed to process channel ${channel.id}:`, error);
        }
      }

      return channels;

    } catch (error) {
      logger.error(`Search by keyword error for "${keyword}":`, error);
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

      // Get recent videos
      const recentVideos = await this.getRecentVideos(channel.id, 3);

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
      logger.warn('Process channel error:', error);
      return null;
    }
  }

  private async getRecentVideos(channelId: string, maxResults: number): Promise<RecentVideo[]> {
    try {
      const searchResponse = await this.youtube.search.list({
        part: ['snippet'],
        channelId: channelId,
        type: ['video'],
        order: 'date',
        maxResults: maxResults,
      });

      if (!searchResponse.data.items) {
        return [];
      }

      const videoIds = searchResponse.data.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];

      if (videoIds.length === 0) {
        return [];
      }

      const videosResponse = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: videoIds,
      });

      if (!videosResponse.data.items) {
        return [];
      }

      return videosResponse.data.items.map(video => ({
        videoId: video.id!,
        title: video.snippet?.title || 'Unknown Title',
        publishedAt: video.snippet?.publishedAt || '',
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url || ''
      }));

    } catch (error) {
      logger.warn(`Failed to get recent videos for channel ${channelId}:`, error);
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
}