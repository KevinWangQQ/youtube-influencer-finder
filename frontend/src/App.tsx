import { useState, useEffect } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultsList } from './components/ResultsList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { api, ApiError } from './utils/api';
import { SettingsService } from './services/settings.service';
import type { InfluencerResult, SearchFilters } from './types';

function App() {
  const [results, setResults] = useState<InfluencerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasValidKeys, setHasValidKeys] = useState(false);

  useEffect(() => {
    // Check if user has valid API keys on app load
    setHasValidKeys(SettingsService.hasRequiredKeys());
  }, []);

  const handleSearch = async (topic: string, filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
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
      
      setResults(response.results);
      setExpandedKeywords(response.expandedKeywords);
      
      if (response.results.length === 0) {
        setError('No influencers found matching your criteria. Try adjusting your filters or using different keywords.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setResults([]);
    } finally {
      setLoading(false);
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
        setError(`Export failed: ${err.message}`);
      } else {
        setError('Failed to export data. Please try again.');
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

          {loading && <LoadingSpinner />}
          
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          
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