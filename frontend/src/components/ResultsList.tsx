import { useState } from 'react';
import type { InfluencerResult, SortOption } from '../types';
import { InfluencerCard } from './InfluencerCard';
import { InfluencerListItem } from './InfluencerListItem';

interface ResultsListProps {
  results: InfluencerResult[];
  onExport: () => void;
  loading: boolean;
}

type ViewMode = 'card' | 'list';

export const ResultsList = ({ results, onExport, loading }: ResultsListProps) => {
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'subscribers':
        return b.subscriberCount - a.subscriberCount;
      case 'views':
        return b.viewCount - a.viewCount;
      case 'recent':
        const aLatest = a.recentVideos[0]?.publishedAt || '';
        const bLatest = b.recentVideos[0]?.publishedAt || '';
        return new Date(bLatest).getTime() - new Date(aLatest).getTime();
      case 'relevance':
      default:
        return b.relevanceScore - a.relevanceScore;
    }
  });

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'subscribers', label: 'Subscribers' },
    { value: 'views', label: 'Total Views' },
    { value: 'recent', label: 'Most Recent' },
  ];

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results
            </h2>
            <p className="text-sm text-gray-600">
              Found {results.length} influencer{results.length !== 1 ? 's' : ''} matching your criteria
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                title="Card View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={onExport}
              disabled={loading}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Exporting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export CSV</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Grid/List */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedResults.map((influencer) => (
            <InfluencerCard key={influencer.channelId} influencer={influencer} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedResults.map((influencer) => (
            <InfluencerListItem key={influencer.channelId} influencer={influencer} />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="card bg-gray-50">
          <div className="text-center text-sm text-gray-600">
            <p>
              Showing {results.length} results • 
              Sorted by {sortOptions.find(opt => opt.value === sortBy)?.label.toLowerCase()}
            </p>
            <p className="mt-1 text-xs">
              💡 Tip: Use the export button to download all results as a CSV file for further analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
};