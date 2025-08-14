export interface AppSettings {
  openaiApiKey: string;
  youtubeApiKey: string;
}

export class SettingsService {
  private static readonly STORAGE_KEY = 'youtube_influencer_finder_settings';

  static getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    return {
      openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY || ''
    };
  }

  static saveSettings(settings: AppSettings): void {
    try {
      const previousSettings = this.getSettings();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      
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
    return Boolean(settings.openaiApiKey && settings.youtubeApiKey);
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
      const cacheKeys = keys.filter(key => 
        key.startsWith('search_') || 
        key.startsWith('keywords_') ||
        key.startsWith('openai_') ||
        key.startsWith('youtube_')
      );
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleared cache: ${key}`);
      });
      
      console.log(`🧹 Cleared ${cacheKeys.length} cache entries related to API keys`);
    } catch (error) {
      console.error('Failed to clear related cache:', error);
    }
  }
}