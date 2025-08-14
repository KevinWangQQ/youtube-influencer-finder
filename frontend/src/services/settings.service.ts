export interface YouTubeApiKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'exhausted' | 'error';
  quotaUsed: number;
  quotaLimit: number;
  lastError?: string;
  lastUsed?: string;
}

export interface AppSettings {
  youtubeApiKeys: YouTubeApiKey[];
  currentKeyIndex: number;
}

export class SettingsService {
  private static readonly STORAGE_KEY = 'youtube_influencer_finder_settings';

  static getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      console.log(`🔍 Loading settings from localStorage:`, stored ? 'Found' : 'Not found');
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 迁移旧格式数据
        if (parsed.youtubeApiKey && !parsed.youtubeApiKeys) {
          console.log(`🔄 Migrating legacy settings format`);
          const migratedSettings: AppSettings = {
            youtubeApiKeys: [{
              id: 'legacy-key',
              name: 'Legacy API Key',
              key: parsed.youtubeApiKey,
              status: 'active',
              quotaUsed: 0,
              quotaLimit: 10000
            }],
            currentKeyIndex: 0
          };
          this.saveSettings(migratedSettings);
          return migratedSettings;
        }
        
        // 验证新格式数据
        if (parsed.youtubeApiKeys && Array.isArray(parsed.youtubeApiKeys)) {
          console.log(`✅ Parsed settings:`, {
            keyCount: parsed.youtubeApiKeys.length,
            currentIndex: parsed.currentKeyIndex,
            activeKey: parsed.youtubeApiKeys[parsed.currentKeyIndex]?.name || 'None'
          });
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    // 创建默认设置
    const defaultKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const defaultSettings: AppSettings = {
      youtubeApiKeys: defaultKey ? [{
        id: 'default-key',
        name: 'Default API Key',
        key: defaultKey,
        status: 'active',
        quotaUsed: 0,
        quotaLimit: 10000
      }] : [],
      currentKeyIndex: 0
    };
    
    console.log(`🏗️ Using default settings:`, {
      keyCount: defaultSettings.youtubeApiKeys.length,
      hasDefaultKey: !!defaultKey
    });
    
    return defaultSettings;
  }

  static saveSettings(settings: AppSettings): void {
    try {
      console.log(`💾 Saving settings to localStorage:`, {
        keyCount: settings.youtubeApiKeys.length,
        currentIndex: settings.currentKeyIndex,
        activeKey: settings.youtubeApiKeys[settings.currentKeyIndex]?.name || 'None'
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
      
      // 如果API keys发生变化，清理相关缓存
      const previousKeys = previousSettings.youtubeApiKeys.map(k => k.key);
      const currentKeys = settings.youtubeApiKeys.map(k => k.key);
      
      if (JSON.stringify(previousKeys) !== JSON.stringify(currentKeys)) {
        this.clearRelatedCache();
        console.log('🗑️ API keys changed - cleared all related cache');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // YouTube API Key管理方法
  static getCurrentYouTubeApiKey(): string | null {
    const settings = this.getSettings();
    const currentKey = settings.youtubeApiKeys[settings.currentKeyIndex];
    return currentKey?.status === 'active' ? currentKey.key : null;
  }

  static addYouTubeApiKey(name: string, key: string): void {
    const settings = this.getSettings();
    const newKey: YouTubeApiKey = {
      id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      key,
      status: 'active',
      quotaUsed: 0,
      quotaLimit: 10000
    };
    
    settings.youtubeApiKeys.push(newKey);
    this.saveSettings(settings);
    console.log(`📝 Added new YouTube API key: ${name}`);
  }

  static removeYouTubeApiKey(keyId: string): void {
    const settings = this.getSettings();
    const keyIndex = settings.youtubeApiKeys.findIndex(k => k.id === keyId);
    
    if (keyIndex >= 0) {
      const removedKey = settings.youtubeApiKeys[keyIndex];
      settings.youtubeApiKeys.splice(keyIndex, 1);
      
      // 调整当前索引
      if (settings.currentKeyIndex >= keyIndex && settings.currentKeyIndex > 0) {
        settings.currentKeyIndex--;
      }
      if (settings.currentKeyIndex >= settings.youtubeApiKeys.length) {
        settings.currentKeyIndex = Math.max(0, settings.youtubeApiKeys.length - 1);
      }
      
      this.saveSettings(settings);
      console.log(`🗑️ Removed YouTube API key: ${removedKey.name}`);
    }
  }

  static switchToNextKey(): boolean {
    const settings = this.getSettings();
    const activeKeys = settings.youtubeApiKeys.filter(k => k.status === 'active');
    
    if (activeKeys.length <= 1) {
      console.warn('🚫 No alternative active keys available');
      return false;
    }

    // 找到下一个可用的key
    let nextIndex = (settings.currentKeyIndex + 1) % settings.youtubeApiKeys.length;
    let attempts = 0;
    
    while (attempts < settings.youtubeApiKeys.length) {
      const nextKey = settings.youtubeApiKeys[nextIndex];
      if (nextKey && nextKey.status === 'active') {
        settings.currentKeyIndex = nextIndex;
        this.saveSettings(settings);
        console.log(`🔄 Switched to API key: ${nextKey.name}`);
        return true;
      }
      nextIndex = (nextIndex + 1) % settings.youtubeApiKeys.length;
      attempts++;
    }
    
    console.error('🚫 No active API keys available');
    return false;
  }

  static markKeyAsExhausted(keyId: string, error?: string): void {
    const settings = this.getSettings();
    const key = settings.youtubeApiKeys.find(k => k.id === keyId);
    
    if (key) {
      key.status = 'exhausted';
      key.lastError = error;
      key.lastUsed = new Date().toISOString();
      this.saveSettings(settings);
      console.log(`🚫 Marked API key as exhausted: ${key.name}`);
    }
  }

  static updateKeyUsage(keyId: string, quotaUsed: number): void {
    const settings = this.getSettings();
    const key = settings.youtubeApiKeys.find(k => k.id === keyId);
    
    if (key) {
      key.quotaUsed = quotaUsed;
      key.lastUsed = new Date().toISOString();
      
      // 如果接近配额限制，标记为exhausted
      if (quotaUsed >= key.quotaLimit * 0.95) {
        key.status = 'exhausted';
        console.log(`⚠️ API key approaching quota limit: ${key.name}`);
      }
      
      this.saveSettings(settings);
    }
  }

  static hasRequiredKeys(): boolean {
    const settings = this.getSettings();
    return settings.youtubeApiKeys.some(key => key.status === 'active');
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