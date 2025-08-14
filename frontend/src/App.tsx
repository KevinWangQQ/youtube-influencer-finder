import { useState, useEffect } from 'react';
import { SearchForm } from './components/SearchForm';
import { VideoResultsList } from './components/VideoResultsList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { SearchProgress } from './components/SearchProgress';
import { api, ApiError } from './utils/api';
import { SettingsService } from './services/settings.service';
import { YouTubeService } from './services/youtube.service';
import { PromptSelector } from './config/prompts';
import type { VideoResult, SearchFilters } from './types';

function App() {
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasValidKeys, setHasValidKeys] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [searchStep, setSearchStep] = useState<'idle' | 'searching' | 'processing' | 'complete'>('idle');

  useEffect(() => {
    // Check if user has valid API keys on app load
    setHasValidKeys(SettingsService.hasRequiredKeys());
    
    // 清理过期和损坏的缓存数据
    YouTubeService.clearExpiredCache();
    
    // 清理过期缓存（保留此逻辑用于清理过期的缓存项）
  }, []);

  const handleSearch = async (topic: string, filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSearchStep('searching');
    // 搜索时自动关闭设置面板
    setShowSettings(false);

    // 检测品牌并设置推荐内容
    const detectedBrand = PromptSelector.detectBrand(topic);
    console.log(`🔍 Direct searching for: "${topic}"`);
    console.log(`🏷️ Detected brand: ${detectedBrand || 'none'}`);
    
    if (detectedBrand) {
      const brandRecommendations = PromptSelector.getBrandRecommendations(detectedBrand);
      setRecommendations(brandRecommendations);
      console.log(`💡 Brand recommendations:`, brandRecommendations);
    } else {
      setRecommendations([]);
    }

    try {
      console.log(`🎯 Step: Direct YouTube search for "${topic}"...`);
      
      const searchRequest = {
        topic,
        filters: {
          region: filters.region,
          minSubscribers: filters.minSubscribers,
          minViews: filters.minViews,
          maxResults: filters.maxResults
        }
      };

      const response = await api.searchInfluencers(searchRequest);
      
      setSearchStep('processing');
      console.log(`⚡ Step: Processing results...`);
      
      setResults(response.results);
      setExpandedKeywords(response.expandedKeywords);
      setSearchStep('complete');
      
      if (response.results.length === 0) {
        setError('No influencers found matching your criteria. Try adjusting your filters or using different keywords.');
      } else {
        console.log(`✅ Search completed! Found ${response.results.length} influencers`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.userMessage || err.message);
        setErrorDetails({
          status: err.statusCode,
          error: err.details,
          userMessage: err.userMessage
        });
      } else {
        setError('An unexpected error occurred. Please try again.');
        setErrorDetails(null);
      }
      setResults([]);
    } finally {
      setLoading(false);
      setSearchStep('idle');
    }
  };

  const handleExport = async () => {
    if (results.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      setLoading(true);
      const blob = await api.exportToCsv(results);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `youtube-influencers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Export failed: ${err.userMessage || err.message}`);
        setErrorDetails({
          status: err.statusCode,
          error: err.details,
          userMessage: err.userMessage
        });
      } else {
        setError('Failed to export data. Please try again.');
        setErrorDetails(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = () => {
    console.log('🔄 Settings change triggered');
    
    // 重新检查API key状态
    const newHasValidKeys = SettingsService.hasRequiredKeys();
    console.log(`🔑 API keys validation: ${newHasValidKeys ? 'VALID' : 'INVALID'}`);
    
    setHasValidKeys(newHasValidKeys);
    
    // 清理现有结果，强制重新搜索以使用新API key
    setResults([]);
    setExpandedKeywords([]);
    setError(null);
    setHasSearched(false);
    
    // 验证设置是否正确加载
    const currentSettings = SettingsService.getSettings();
    console.log('🔍 Current settings after change:', {
      keyCount: currentSettings.youtubeApiKeys.length,
      activeKeys: currentSettings.youtubeApiKeys.filter(k => k.status === 'active').length
    });
    
    console.log('🔄 Settings updated - cleared results and forced refresh');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSettingsClick={() => setShowSettings(!showSettings)}
        hasValidKeys={hasValidKeys}
        showSettings={showSettings}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          <SearchForm onSearch={handleSearch} loading={loading} />
          
          {expandedKeywords.length > 0 && expandedKeywords[0] !== '' && (
            <div className="mb-8 card">
              <h3 className="text-lg font-semibold mb-3">🎯 精确搜索关键词</h3>
              <div className="flex flex-wrap gap-2">
                {expandedKeywords.map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                直接使用您输入的机型进行精确搜索，确保最高相关度
              </p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mb-8 card">
              <h3 className="text-lg font-semibold mb-3">相关机型推荐</h3>
              <p className="text-sm text-gray-600 mb-3">
                基于您搜索的内容，这些相关机型可能也值得关注：
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {recommendations.map((recommendation, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(recommendation, {
                      region: 'US',
                      minSubscribers: 1000,
                      minViews: 10000,
                      maxResults: 50
                    })}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg transition-colors duration-200 border border-gray-200 hover:border-gray-300"
                    disabled={loading}
                  >
                    {recommendation}
                  </button>
                ))}
              </div>
            </div>
          )}

          <SearchProgress 
            currentStep={searchStep} 
            visible={loading} 
          />

          {loading && <LoadingSpinner />}
          
          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => {
                setError(null);
                setErrorDetails(null);
              }}
              details={errorDetails}
              showDebugInfo={true}
            />
          )}
          
          {!loading && hasSearched && results.length > 0 && (
            <VideoResultsList 
              results={results} 
              onExport={handleExport}
              loading={loading}
            />
          )}
          
          {!loading && !error && !hasSearched && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Find Your Perfect YouTube Influencers
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                {hasValidKeys 
                  ? '输入机型名称以精确搜索相关的YouTube评测视频，直接找到最相关的内容和博主。'
                  : '请在设置中配置YouTube API密钥开始搜索视频。现在只需要YouTube API密钥即可！'
                }
              </p>
              {!hasValidKeys && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn-primary mt-4"
                >
                  Configure API Keys
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsChange}
      />
    </div>
  );
}

export default App;