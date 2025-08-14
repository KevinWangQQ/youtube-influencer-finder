export const LoadingSpinner = () => {
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Searching for Influencers</h3>
        <div className="text-sm text-gray-500 text-center max-w-md">
          <div className="mb-2">🤖 Expanding keywords with AI...</div>
          <div className="mb-2">🔍 Searching YouTube database...</div>
          <div>📊 Analyzing and ranking results...</div>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          This may take 15-30 seconds
        </div>
      </div>
    </div>
  );
};