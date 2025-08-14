import type { InfluencerResult } from '../types';
import { formatNumber, formatDate, getCountryFlag } from '../utils/format';

interface InfluencerListItemProps {
  influencer: InfluencerResult;
}

export const InfluencerListItem = ({ influencer }: InfluencerListItemProps) => {
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
      <div className="flex items-start space-x-4">
        {/* Channel Info */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <img
            src={thumbnailUrl || '/placeholder-avatar.png'}
            alt={channelTitle}
            className="w-12 h-12 rounded-full object-cover bg-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-avatar.png';
            }}
          />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
              <a 
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 transition-colors"
              >
                {channelTitle}
              </a>
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">
                {getCountryFlag(country)} {country}
              </span>
              <span 
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRelevanceColor(relevanceScore)}`}
              >
                {relevanceScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-600 flex-shrink-0">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{formatNumber(subscriberCount)}</div>
            <div className="text-xs">Subs</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{formatNumber(viewCount)}</div>
            <div className="text-xs">Views</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{formatNumber(videoCount)}</div>
            <div className="text-xs">Videos</div>
          </div>
        </div>

        {/* Recent Videos - 重点展示视频链接 */}
        <div className="flex-1 min-w-0">
          {recentVideos && recentVideos.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">🎥 Recent Related Videos</h4>
              <div className="space-y-2">
                {recentVideos.slice(0, 2).map((video) => (
                  <div key={video.videoId} className="flex items-start space-x-2">
                    <img
                      src={video.thumbnailUrl || '/placeholder-video.png'}
                      alt={video.title}
                      className="w-16 h-12 rounded object-cover bg-gray-200 flex-shrink-0"
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
                        className="text-sm text-gray-900 line-clamp-2 leading-tight hover:text-primary-600 transition-colors font-medium"
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
          ) : (
            <div className="text-sm text-gray-500 italic">No recent videos found</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Channel →
          </a>
          <div className="text-xs text-gray-400">
            ID: {influencer.channelId.substring(0, 8)}...
          </div>
        </div>
      </div>
    </div>
  );
};