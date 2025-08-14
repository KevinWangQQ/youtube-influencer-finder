export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎬</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                YouTube Influencer Finder
              </h1>
              <p className="text-sm text-gray-600">
                AI-powered influencer discovery tool
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Powered by OpenAI & YouTube API</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};