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
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
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
}