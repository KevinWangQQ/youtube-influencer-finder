import type { InfluencerResult } from '../types';
import { formatNumber, formatDate, getCountryFlag } from '../utils/format';

interface InfluencerCardProps {
  influencer: InfluencerResult;
}

export const InfluencerCard = ({ influencer }: InfluencerCardProps) => {
  const {
    channelTitle,
    channelUrl,
    thumbnailUrl,
    subscriberCount,
    viewCount,
    videoCount,
    country,
    recentVideos,
    relevanceScore
  } = influencer;

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        <img
          src={thumbnailUrl || '/placeholder-avatar.png'}
          alt={channelTitle}
          className="w-16 h-16 rounded-full object-cover bg-gray-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-avatar.png';
          }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                <a 
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition-colors"
                >
                  {channelTitle}
                </a>
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600">
                  {getCountryFlag(country)} {country}
                </span>
                <span 
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getRelevanceColor(relevanceScore)}`}
                >
                  {relevanceScore}% match
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatNumber(subscriberCount)}
          </div>
          <div className="text-xs text-gray-600">Subscribers</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatNumber(viewCount)}
          </div>
          <div className="text-xs text-gray-600">Total Views</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatNumber(videoCount)}
          </div>
          <div className="text-xs text-gray-600">Videos</div>
        </div>
      </div>

      {/* Recent Videos - 重点展示视频链接 */}
      {recentVideos && recentVideos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">🎥 Recent Related Videos</h4>
          <div className="space-y-2">
            {recentVideos.slice(0, 3).map((video) => (
              <div key={video.videoId} className="flex items-start space-x-3 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <img
                  src={video.thumbnailUrl || '/placeholder-video.png'}
                  alt={video.title}
                  className="w-12 h-9 rounded object-cover bg-gray-200 flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-video.png';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <a 
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-900 line-clamp-2 leading-tight hover:text-primary-600 transition-colors font-medium block"
                  >
                    {video.title}
                  </a>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>{formatNumber(video.viewCount)} views</span>
                    <span>•</span>
                    <span>{formatDate(video.publishedAt)}</span>
                    <span>•</span>
                    <a 
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Watch →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Channel →
          </a>
          <div className="text-xs text-gray-500">
            ID: {influencer.channelId}
          </div>
        </div>
      </div>
    </div>
  );
};