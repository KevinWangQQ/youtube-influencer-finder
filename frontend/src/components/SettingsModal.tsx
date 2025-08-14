import { useState, useEffect } from 'react';
import { SettingsService, type AppSettings } from '../services/settings.service';
import { OpenAIService } from '../services/openai.service';
import { YouTubeService } from '../services/youtube.service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal = ({ isOpen, onClose, onSave }: SettingsModalProps) => {
  const [settings, setSettings] = useState<AppSettings>({
    openaiApiKey: '',
    youtubeApiKey: ''
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    youtube: false
  });
  const [testStatus, setTestStatus] = useState({
    openai: { testing: false, result: null as { success: boolean; message: string } | null },
    youtube: { testing: false, result: null as { success: boolean; message: string } | null }
  });

  useEffect(() => {
    if (isOpen) {
      setSettings(SettingsService.getSettings());
    }
  }, [isOpen]);

  const handleSave = () => {
    console.log('💾 Saving API key settings...');
    console.log('🔧 Current settings before save:', settings);
    
    // 强制清理所有缓存确保新key生效
    SettingsService.forceClearAllCache();
    
    SettingsService.saveSettings(settings);
    
    // 验证保存后的设置
    const savedSettings = SettingsService.getSettings();
    console.log('🔍 Verification - settings after save:', savedSettings);
    
    console.log('✅ Settings saved and ALL cache cleared for new API keys');
    onSave();
    onClose();
  };

  const handleInputChange = (key: keyof AppSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleKeyVisibility = (key: 'openai' | 'youtube') => {
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const testApiConnection = async (api: 'openai' | 'youtube') => {
    const apiKey = api === 'openai' ? settings.openaiApiKey : settings.youtubeApiKey;
    
    if (!apiKey.trim()) {
      setTestStatus(prev => ({
        ...prev,
        [api]: {
          testing: false,
          result: { success: false, message: '请先输入API密钥' }
        }
      }));
      return;
    }

    setTestStatus(prev => ({
      ...prev,
      [api]: { testing: true, result: null }
    }));

    try {
      let result;
      if (api === 'openai') {
        const openaiService = new OpenAIService(apiKey);
        result = await openaiService.testApiConnection();
      } else {
        const youtubeService = new YouTubeService(apiKey);
        result = await youtubeService.testApiConnection();
      }
      
      setTestStatus(prev => ({
        ...prev,
        [api]: { testing: false, result }
      }));
    } catch (error) {
      setTestStatus(prev => ({
        ...prev,
        [api]: {
          testing: false,
          result: {
            success: false,
            message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        }
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">API Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key (可选 - 不再需要)
            </label>
            <div className="relative">
              <input
                type={showKeys.openai ? 'text' : 'password'}
                value={settings.openaiApiKey}
                onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                placeholder="sk-..."
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility('openai')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showKeys.openai ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">不再需要 - 应用现在直接搜索用户输入的机型，提高准确率</span>
              </p>
              <button
                onClick={() => testApiConnection('openai')}
                disabled={testStatus.openai.testing || !settings.openaiApiKey.trim()}
                className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testStatus.openai.testing ? '测试中...' : '测试连接'}
              </button>
            </div>
            {testStatus.openai.result && (
              <div className={`mt-2 p-2 rounded-md text-xs ${
                testStatus.openai.result.success 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {testStatus.openai.result.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Data API Key
            </label>
            <div className="relative">
              <input
                type={showKeys.youtube ? 'text' : 'password'}
                value={settings.youtubeApiKey}
                onChange={(e) => handleInputChange('youtubeApiKey', e.target.value)}
                placeholder="AIza..."
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility('youtube')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showKeys.youtube ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Get your API key from{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Google Cloud Console
                </a>
              </p>
              <button
                onClick={() => testApiConnection('youtube')}
                disabled={testStatus.youtube.testing || !settings.youtubeApiKey.trim()}
                className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testStatus.youtube.testing ? '测试中...' : '测试连接'}
              </button>
            </div>
            {testStatus.youtube.result && (
              <div className={`mt-2 p-2 rounded-md text-xs ${
                testStatus.youtube.result.success 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {testStatus.youtube.result.message}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">🔒 Privacy Notice</h3>
            <p className="text-xs text-gray-600">
              Your API keys are stored locally in your browser and never sent to our servers. 
              They are used only to make direct API calls to OpenAI and YouTube.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={!settings.youtubeApiKey}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};