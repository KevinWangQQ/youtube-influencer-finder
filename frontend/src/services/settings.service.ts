export interface AppSettings {
  openaiApiKey: string;
  youtubeApiKey: string;
}

export class SettingsService {
  private static readonly STORAGE_KEY = 'youtube_influencer_finder_settings';

  static getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      console.log(`🔍 Loading settings from localStorage:`, stored ? 'Found' : 'Not found');
      
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log(`✅ Parsed settings:`, {
          hasOpenAI: !!parsed.openaiApiKey,
          hasYouTube: !!parsed.youtubeApiKey,
          youtubeKeyPreview: parsed.youtubeApiKey ? `${parsed.youtubeApiKey.substring(0, 10)}...` : 'EMPTY'
        });
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    const defaultSettings = {
      openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY || ''
    };
    
    console.log(`🏗️ Using default settings:`, {
      hasOpenAI: !!defaultSettings.openaiApiKey,
      hasYouTube: !!defaultSettings.youtubeApiKey,
      youtubeKeyPreview: defaultSettings.youtubeApiKey ? `${defaultSettings.youtubeApiKey.substring(0, 10)}...` : 'EMPTY'
    });
    
    return defaultSettings;
  }

  static saveSettings(settings: AppSettings): void {
    try {
      console.log(`💾 Saving settings to localStorage:`, {
        hasOpenAI: !!settings.openaiApiKey,
        hasYouTube: !!settings.youtubeApiKey,
        youtubeKeyPreview: settings.youtubeApiKey ? `${settings.youtubeApiKey.substring(0, 10)}...` : 'EMPTY'
      });
      
      const previousSettings = this.getSettings();
      const settingsJson = JSON.stringify(settings);
      
      localStorage.setItem(this.STORAGE_KEY, settingsJson);
      console.log(`✅ Settings saved to localStorage, size: ${settingsJson.length} chars`);
      
      // 验证保存是否成功
      const savedCheck = localStorage.getItem(this.STORAGE_KEY);
      if (savedCheck === settingsJson) {
        console.log(`🔍 Verification: Settings saved successfully`);
      } else {
        console.error(`❌ Verification failed: Settings not saved correctly`);
      }
      
      // 如果API key发生变化，清理相关缓存
      if (previousSettings.openaiApiKey !== settings.openaiApiKey || 
          previousSettings.youtubeApiKey !== settings.youtubeApiKey) {
        this.clearRelatedCache();
        console.log('🗑️ API keys changed - cleared all related cache');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  static updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): void {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
  }

  static hasRequiredKeys(): boolean {
    const settings = this.getSettings();
    // 现在只需要YouTube API key，不再需要OpenAI key
    return Boolean(settings.youtubeApiKey);
  }

  static clearSettings(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear settings:', error);
    }
  }

  // 清理与API key相关的所有缓存数据
  static clearRelatedCache(): void {
    try {
      const keys = Object.keys(localStorage);
      console.log(`🔍 All localStorage keys:`, keys);
      
      const cacheKeys = keys.filter(key => 
        key !== this.STORAGE_KEY && ( // 保留设置，清理其他所有缓存
          key.startsWith('search_') || 
          key.startsWith('keywords_') ||
          key.startsWith('openai_') ||
          key.startsWith('youtube_')
        )
      );
      
      console.log(`🎯 Cache keys to clear:`, cacheKeys);
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleared cache: ${key}`);
      });
      
      console.log(`🧹 Cleared ${cacheKeys.length} cache entries related to API keys`);
    } catch (error) {
      console.error('Failed to clear related cache:', error);
    }
  }

  // 强制清理所有缓存（调试用）
  static forceClearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const nonSettingsKeys = keys.filter(key => key !== this.STORAGE_KEY);
      
      console.log(`🔥 Force clearing ALL cache except settings:`, nonSettingsKeys);
      
      nonSettingsKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Force cleared: ${key}`);
      });
      
      console.log(`🧹 Force cleared ${nonSettingsKeys.length} cache entries`);
    } catch (error) {
      console.error('Failed to force clear cache:', error);
    }
  }
}