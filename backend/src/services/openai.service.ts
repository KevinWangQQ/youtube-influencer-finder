import OpenAI from 'openai';
import { KeywordExpansionRequest, KeywordExpansionResponse } from '../types';
import { logger } from '../utils/logger';
import { cacheManager } from '../utils/cache';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async expandKeywords(request: KeywordExpansionRequest): Promise<KeywordExpansionResponse> {
    const { topic, maxKeywords = 10, language = 'en' } = request;

    // Generate cache key
    const cacheKey = cacheManager.generateKey('keywords', { topic, maxKeywords, language });
    
    // Check cache first
    const cachedResult = await cacheManager.get<KeywordExpansionResponse>(cacheKey);
    if (cachedResult) {
      logger.info(`Returning cached keywords for topic: ${topic}`);
      return cachedResult;
    }

    try {
      logger.info(`Expanding keywords for topic: ${topic}`);

      const prompt = this.buildPrompt(topic, maxKeywords, language);

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert in social media marketing and content discovery. Your task is to generate relevant keywords for finding YouTube influencers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const expandedKeywords = this.parseKeywords(content);
      const confidence = this.calculateConfidence(expandedKeywords, topic);

      const result: KeywordExpansionResponse = {
        originalTopic: topic,
        expandedKeywords,
        confidence
      };

      // Cache the result
      await cacheManager.set(cacheKey, result, 24 * 60 * 60); // Cache for 24 hours

      logger.info(`Successfully expanded ${expandedKeywords.length} keywords for topic: ${topic}`);
      return result;

    } catch (error) {
      logger.error('OpenAI keyword expansion error:', error);
      
      // Fallback to basic keyword expansion
      const fallbackKeywords = this.generateFallbackKeywords(topic);
      return {
        originalTopic: topic,
        expandedKeywords: fallbackKeywords,
        confidence: 0.5 // Lower confidence for fallback
      };
    }
  }

  private buildPrompt(topic: string, maxKeywords: number, language: string): string {
    return `
Based on the topic "${topic}", generate ${maxKeywords} highly relevant keywords that would help find YouTube influencers and content creators in this niche.

Requirements:
1. Focus on specific niches, synonyms, and related terms
2. Include both broad and specific keywords
3. Consider different angles and subcategories within this topic
4. Include terms that content creators might use in their channel titles or video descriptions
5. Avoid overly generic terms
6. Language: ${language}

Format: Return only the keywords, separated by commas, no quotes or additional text.

Example for "fitness":
fitness, workout, exercise, gym, bodybuilding, yoga, nutrition, weight loss, muscle building, cardio

Keywords for "${topic}":`;
  }

  private parseKeywords(content: string): string[] {
    return content
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0 && keyword.length <= 50)
      .slice(0, 15) // Limit to 15 keywords max
      .map(keyword => keyword.toLowerCase());
  }

  private calculateConfidence(keywords: string[], originalTopic: string): number {
    // Simple confidence calculation based on keyword relevance
    const topicWords = originalTopic.toLowerCase().split(' ');
    let relevantCount = 0;

    keywords.forEach(keyword => {
      const keywordWords = keyword.split(' ');
      const hasRelevantWord = keywordWords.some(word => 
        topicWords.some(topicWord => 
          word.includes(topicWord) || topicWord.includes(word)
        )
      );
      if (hasRelevantWord) relevantCount++;
    });

    return Math.min(0.9, Math.max(0.3, relevantCount / keywords.length));
  }

  private generateFallbackKeywords(topic: string): string[] {
    const words = topic.toLowerCase().split(' ');
    const fallbackKeywords = [topic.toLowerCase()];

    // Add variations
    words.forEach(word => {
      if (word.length > 3) {
        fallbackKeywords.push(word);
        fallbackKeywords.push(`${word} tutorial`);
        fallbackKeywords.push(`${word} review`);
        fallbackKeywords.push(`${word} tips`);
      }
    });

    // Add common YouTube categories
    const commonSuffixes = ['channel', 'creator', 'influencer', 'vlog', 'guide'];
    commonSuffixes.forEach(suffix => {
      fallbackKeywords.push(`${topic.toLowerCase()} ${suffix}`);
    });

    return fallbackKeywords.slice(0, 8);
  }
}