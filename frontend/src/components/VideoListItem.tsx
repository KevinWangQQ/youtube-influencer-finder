import type { VideoResult } from '../types';
import { formatNumber, formatDate } from '../utils/format';

interface VideoListItemProps {
  video: VideoResult;
}

export const VideoListItem = ({ video }: VideoListItemProps) => {
  const {
    title,
    description,
    publishedAt,
    viewCount,
    likeCount,
    commentCount,
    duration,
    thumbnailUrl,
    videoUrl,
    channel,
    relevanceScore
  } = video;

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (duration: string) => {
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        {/* Video Thumbnail */}
        <div className="flex-shrink-0 relative">
          <a 
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={thumbnailUrl || '/placeholder-video.png'}
              alt={title}
              className="w-32 h-24 rounded-lg object-cover bg-gray-200 hover:opacity-90 transition-opacity"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-video.png';
              }}
            />
            {duration && (
              <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                {formatDuration(duration)}
              </span>
            )}
          </a>
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight flex-1 mr-2">
              <a 
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 transition-colors"
              >
                {title}
              </a>
            </h3>
            <span 
              className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getRelevanceColor(relevanceScore)}`}
            >
              {relevanceScore}%
            </span>
          </div>
          
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Channel and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={channel.thumbnailUrl || '/placeholder-avatar.png'}
                alt={channel.channelTitle}
                className="w-8 h-8 rounded-full object-cover bg-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-avatar.png';
                }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  <a 
                    href={channel.channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 transition-colors"
                  >
                    {channel.channelTitle}
                  </a>
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatNumber(channel.subscriberCount)} subs</span>
                  <span>•</span>
                  <span>{formatDate(publishedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{formatNumber(viewCount)} views</span>
              <span>{formatNumber(likeCount)} likes</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 flex-shrink-0">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded font-medium transition-colors text-center"
          >
            ▶ Watch
          </a>
          <a
            href={channel.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 hover:text-primary-700 font-medium text-center"
          >
            Channel →
          </a>
        </div>
      </div>
    </div>
  );
};