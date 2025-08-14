import { PromptSelector } from '../config/prompts';

interface KeywordExpansionRequest {
  topic: string;
  maxKeywords?: number;
  language?: string;
  scenario?: 'general' | 'tplink' | 'tech' | 'smart_home' | 'product_focused';
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

  // 测试OpenAI API连接状态
  async testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔧 Testing OpenAI API connection...');
      
      // 使用简单的聊天请求测试API
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
              role: "user",
              content: "Hello"
            }
          ],
          max_tokens: 5,
          temperature: 0.1
        })
      });

      if (response.ok) {
        console.log('✅ OpenAI API connection successful');
        return {
          success: true,
          message: '✅ OpenAI API连接正常'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ OpenAI API connection failed:', errorData);
        
        let message = '❌ OpenAI API连接失败';
        if (response.status === 401) {
          message = '🔑 OpenAI API密钥无效或已过期';
        } else if (response.status === 429) {
          message = '🚫 OpenAI API请求频率过高或配额用完';
        } else if (response.status === 403) {
          message = '🚫 OpenAI API访问被拒绝';
        } else if (response.status >= 500) {
          message = '🌐 OpenAI服务器错误，请稍后重试';
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
      console.error('❌ OpenAI API test failed:', error);
      return {
        success: false,
        message: '❌ 网络连接失败或API不可用',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async expandKeywords(request: KeywordExpansionRequest): Promise<KeywordExpansionResponse> {
    const { topic, maxKeywords = 10, language = 'en', scenario } = request;

    // 使用智能场景检测和对应的prompt
    const detectedScenario = scenario || PromptSelector.detectScenario(topic);
    
    // Check cache first - 包含scenario和API key标识以避免不同场景和API key使用相同缓存
    const cacheKey = `keywords_${topic}_${maxKeywords}_${language}_${detectedScenario}_${this.getApiKeyHash()}`;
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

  // 生成API key的安全哈希值用于缓存key
  private getApiKeyHash(): string {
    // 使用API key的前8位和后4位创建唯一标识，避免泄露完整key
    return `${this.apiKey.substring(0, 8)}_${this.apiKey.substring(-4)}`;
  }
}