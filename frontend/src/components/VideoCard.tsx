import type { VideoResult } from '../types';
import { formatNumber, formatDate } from '../utils/format';

interface VideoCardProps {
  video: VideoResult;
}

export const VideoCard = ({ video }: VideoCardProps) => {
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
      {/* Video Thumbnail and Info */}
      <div className="flex flex-col space-y-3">
        <div className="relative">
          <a 
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={thumbnailUrl || '/placeholder-video.png'}
              alt={title}
              className="w-full h-48 rounded-lg object-cover bg-gray-200 hover:opacity-90 transition-opacity"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-video.png';
              }}
            />
            {duration && (
              <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(duration)}
              </span>
            )}
          </a>
        </div>
        
        {/* Video Title and Description */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                <a 
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition-colors"
                >
                  {title}
                </a>
              </h3>
            </div>
            <span 
              className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getRelevanceColor(relevanceScore)}`}
            >
              {relevanceScore}% match
            </span>
          </div>
          
          {description && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
              {description}
            </p>
          )}
        </div>

        {/* Video Stats */}
        <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900">
              {formatNumber(viewCount)}
            </div>
            <div className="text-xs text-gray-600">Views</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900">
              {formatNumber(likeCount)}
            </div>
            <div className="text-xs text-gray-600">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900">
              {formatNumber(commentCount)}
            </div>
            <div className="text-xs text-gray-600">Comments</div>
          </div>
        </div>

        {/* Channel Info */}
        <div className="flex items-center space-x-3 pt-3 border-t border-gray-100">
          <img
            src={channel.thumbnailUrl || '/placeholder-avatar.png'}
            alt={channel.channelTitle}
            className="w-10 h-10 rounded-full object-cover bg-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-avatar.png';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
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
                  <span>{formatNumber(channel.subscriberCount)} subscribers</span>
                  <span>•</span>
                  <span>{formatDate(publishedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-medium transition-colors"
          >
            ▶ Watch Video
          </a>
          <a
            href={channel.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Channel →
          </a>
        </div>
      </div>
    </div>
  );
};