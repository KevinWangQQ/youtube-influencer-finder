import { PromptSelector } from '../config/prompts';

interface KeywordExpansionRequest {
  topic: string;
  maxKeywords?: number;
  language?: string;
  scenario?: 'general' | 'tplink' | 'tech' | 'smart_home';
}

interface KeywordExpansionResponse {
  originalTopic: string;
  expandedKeywords: string[];
  confidence: number;
}

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = apiKey;
  }

  async expandKeywords(request: KeywordExpansionRequest): Promise<KeywordExpansionResponse> {
    const { topic, maxKeywords = 10, language = 'en', scenario } = request;

    // 使用智能场景检测和对应的prompt
    const detectedScenario = scenario || PromptSelector.detectScenario(topic);
    
    // Check cache first - 包含scenario以避免不同场景使用相同缓存
    const cacheKey = `keywords_${topic}_${maxKeywords}_${language}_${detectedScenario}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`Returning cached keywords for topic: ${topic} (scenario: ${detectedScenario})`);
      return cached;
    }

    try {
      console.log(`Expanding keywords for topic: ${topic}`);

      const prompt = PromptSelector.getPrompt(topic, detectedScenario);
      
      console.log(`Using ${detectedScenario} scenario for topic: ${topic}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
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

      // Cache the result for 24 hours
      this.setCache(cacheKey, result, 24 * 60 * 60 * 1000);

      console.log(`Successfully expanded ${expandedKeywords.length} keywords for topic: ${topic}`);
      return result;

    } catch (error) {
      console.error('OpenAI keyword expansion error:', error);
      
      // Fallback to basic keyword expansion
      const fallbackKeywords = this.generateFallbackKeywords(topic);
      return {
        originalTopic: topic,
        expandedKeywords: fallbackKeywords,
        confidence: 0.5 // Lower confidence for fallback
      };
    }
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