import { useState, useEffect } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultsList } from './components/ResultsList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { SearchProgress } from './components/SearchProgress';
import { api, ApiError } from './utils/api';
import { SettingsService } from './services/settings.service';
import { YouTubeService } from './services/youtube.service';
import { PromptSelector } from './config/prompts';
import type { InfluencerResult, SearchFilters } from './types';

function App() {
  const [results, setResults] = useState<InfluencerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasValidKeys, setHasValidKeys] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [searchStep, setSearchStep] = useState<'idle' | 'expanding' | 'searching' | 'processing' | 'complete'>('idle');

  useEffect(() => {
    // Check if user has valid API keys on app load
    setHasValidKeys(SettingsService.hasRequiredKeys());
    
    // 清理过期和损坏的缓存数据
    YouTubeService.clearExpiredCache();
    
    // 清理所有搜索缓存（临时解决方案，用于修复缓存bug）
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('search_') || key.startsWith('keywords_')) {
        localStorage.removeItem(key);
        console.log(`Cleared cache: ${key}`);
      }
    });
  }, []);

  const handleSearch = async (topic: string, filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSearchStep('expanding');

    // 每次搜索前清理相关缓存，确保重新调用API
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(topic.toLowerCase()) || key.startsWith('search_') || key.startsWith('keywords_')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared cache: ${key}`);
      }
    });

    // 检测品牌并设置推荐内容
    const detectedBrand = PromptSelector.detectBrand(topic);
    console.log(`🔍 Searching for: "${topic}"`);
    console.log(`🏷️ Detected brand: ${detectedBrand || 'none'}`);
    
    if (detectedBrand) {
      const brandRecommendations = PromptSelector.getBrandRecommendations(detectedBrand);
      setRecommendations(brandRecommendations);
      console.log(`💡 Brand recommendations:`, brandRecommendations);
    } else {
      setRecommendations([]);
    }

    try {
      setSearchStep('searching');
      console.log(`🎯 Step: Searching YouTube channels...`);
      
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
    setHasValidKeys(SettingsService.hasRequiredKeys());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSettingsClick={() => setShowSettings(true)}
        hasValidKeys={hasValidKeys}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          <SearchForm onSearch={handleSearch} loading={loading} />
          
          {expandedKeywords.length > 0 && (
            <div className="mb-8 card">
              <h3 className="text-lg font-semibold mb-3">Expanded Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {expandedKeywords.map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
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
            <ResultsList 
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
                  ? 'Enter a topic above to discover relevant influencers using AI-powered keyword expansion and YouTube search.'
                  : 'Configure your API keys in Settings to start discovering YouTube influencers.'
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