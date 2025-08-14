import { useState } from 'react';
import type { SearchFilters } from '../types';

interface SearchFormProps {
  onSearch: (topic: string, filters: SearchFilters) => void;
  loading: boolean;
}

export const SearchForm = ({ onSearch, loading }: SearchFormProps) => {
  const [topic, setTopic] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    region: 'US',
    minSubscribers: 1000,
    minViews: 10000,
    maxResults: 50
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSearch(topic.trim(), filters);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const regions = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
  ];

  return (
    <div className="card mb-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Search Input */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Search Topic
          </label>
          <div className="flex space-x-3">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., fitness, cooking, tech reviews, beauty, gaming..."
              className="input-field flex-1"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                id="region"
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="input-field"
                disabled={loading}
              >
                {regions.map(region => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="minSubscribers" className="block text-sm font-medium text-gray-700 mb-1">
                Min Subscribers
              </label>
              <select
                id="minSubscribers"
                value={filters.minSubscribers}
                onChange={(e) => handleFilterChange('minSubscribers', parseInt(e.target.value))}
                className="input-field"
                disabled={loading}
              >
                <option value={0}>Any</option>
                <option value={1000}>1K+</option>
                <option value={10000}>10K+</option>
                <option value={100000}>100K+</option>
                <option value={1000000}>1M+</option>
              </select>
            </div>

            <div>
              <label htmlFor="minViews" className="block text-sm font-medium text-gray-700 mb-1">
                Min Video Views
              </label>
              <select
                id="minViews"
                value={filters.minViews}
                onChange={(e) => handleFilterChange('minViews', parseInt(e.target.value))}
                className="input-field"
                disabled={loading}
              >
                <option value={0}>Any</option>
                <option value={1000}>1K+</option>
                <option value={10000}>10K+</option>
                <option value={100000}>100K+</option>
                <option value={1000000}>1M+</option>
              </select>
            </div>

            <div>
              <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-1">
                Max Results
              </label>
              <select
                id="maxResults"
                value={filters.maxResults}
                onChange={(e) => handleFilterChange('maxResults', parseInt(e.target.value))}
                className="input-field"
                disabled={loading}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};