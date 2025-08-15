import { useState, useEffect } from 'react';
import { SettingsService, type AppSettings, type YouTubeApiKey } from '../services/settings.service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal = ({ isOpen, onClose, onSave }: SettingsModalProps) => {
  const [settings, setSettings] = useState<AppSettings>({
    youtubeApiKeys: [],
    currentKeyIndex: 0
  });
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<{ [keyId: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      const currentSettings = SettingsService.getSettings();
      setSettings(currentSettings);
      setShowNewKeyForm(false);
      setNewKeyName('');
      setNewKeyValue('');
    }
  }, [isOpen]);

  const handleAddKey = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      alert('请输入API Key名称和值');
      return;
    }

    SettingsService.addYouTubeApiKey(newKeyName.trim(), newKeyValue.trim());
    setSettings(SettingsService.getSettings());
    setNewKeyName('');
    setNewKeyValue('');
    setShowNewKeyForm(false);
    console.log(`✅ Added new YouTube API key: ${newKeyName}`);
  };

  const handleRemoveKey = (keyId: string) => {
    if (confirm('确定要删除此API Key吗？')) {
      SettingsService.removeYouTubeApiKey(keyId);
      setSettings(SettingsService.getSettings());
      console.log(`🗑️ Removed YouTube API key: ${keyId}`);
    }
  };

  const handleTestKey = async (apiKey: YouTubeApiKey) => {
    setTestingKeyId(apiKey.id);
    try {
      console.log(`🧪 Testing API key: ${apiKey.name}`);
      
      // 简单的测试：尝试搜索一个视频
      const testResult = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${apiKey.key}`);
      
      if (testResult.ok) {
        console.log(`✅ API key test successful: ${apiKey.name}`);
        alert(`✅ API Key "${apiKey.name}" 测试成功！`);
      } else {
        const errorData = await testResult.json();
        console.error(`❌ API key test failed: ${apiKey.name}`, errorData);
        alert(`❌ API Key "${apiKey.name}" 测试失败: ${errorData.error?.message || '未知错误'}`);
      }
    } catch (error) {
      console.error(`❌ API key test error: ${apiKey.name}`, error);
      alert(`❌ API Key "${apiKey.name}" 测试出错: ${error}`);
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleClose = () => {
    onSave(); // 通知父组件设置可能已更改
    onClose();
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const getStatusColor = (status: YouTubeApiKey['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'exhausted': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: YouTubeApiKey['status']) => {
    switch (status) {
      case 'active': return '活跃';
      case 'exhausted': return '已用尽';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">🔑 API Key 管理</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* YouTube API Keys 区域 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">YouTube API Keys</h3>
              <button
                onClick={() => setShowNewKeyForm(true)}
                className="btn-primary text-sm"
              >
                + 添加新Key
              </button>
            </div>

            {/* 添加新Key表单 */}
            {showNewKeyForm && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">添加新的YouTube API Key</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key名称
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="例如: 主Key, 备用Key1"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="AIza..."
                      className="input-field"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddKey}
                      className="btn-primary text-sm"
                    >
                      添加
                    </button>
                    <button
                      onClick={() => setShowNewKeyForm(false)}
                      className="btn-secondary text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* API Keys 列表 */}
            <div className="space-y-3">
              {settings.youtubeApiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔑</div>
                  <p>还没有添加YouTube API Key</p>
                  <p className="text-sm">点击上方按钮添加您的第一个API Key</p>
                </div>
              ) : (
                settings.youtubeApiKeys.map((apiKey, index) => (
                  <div
                    key={apiKey.id}
                    className={`p-4 border rounded-lg ${
                      index === settings.currentKeyIndex 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                          {index === settings.currentKeyIndex && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              当前使用
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(apiKey.status)}`}>
                            {getStatusText(apiKey.status)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {showKeys[apiKey.id] 
                              ? apiKey.key 
                              : `${apiKey.key.substring(0, 8)}...${apiKey.key.slice(-4)}`
                            }
                          </span>
                          <button
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showKeys[apiKey.id] ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          配额使用: {apiKey.quotaUsed.toLocaleString()} / {apiKey.quotaLimit.toLocaleString()}
                          {apiKey.lastUsed && (
                            <span className="ml-2">
                              最后使用: {new Date(apiKey.lastUsed).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {apiKey.lastError && (
                          <div className="mt-2 text-xs text-red-600">
                            错误: {apiKey.lastError}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestKey(apiKey)}
                          disabled={testingKeyId === apiKey.id}
                          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          {testingKeyId === apiKey.id ? '测试中...' : '测试'}
                        </button>
                        <button
                          onClick={() => handleRemoveKey(apiKey.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 使用说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 使用说明</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 您可以添加多个YouTube API Key作为备用</li>
              <li>• 当前使用的Key配额用尽时，系统会自动切换到下一个可用Key</li>
              <li>• 建议添加2-3个API Key以避免配额限制</li>
              <li>• 每个API Key每日免费配额为10,000单位</li>
              <li>• 红色状态表示Key出现错误，橙色表示配额已用尽</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="btn-primary"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};