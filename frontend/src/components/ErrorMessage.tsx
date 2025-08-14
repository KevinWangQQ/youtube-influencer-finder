interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
  details?: {
    status?: number;
    error?: any;
    userMessage?: string;
  };
  showDebugInfo?: boolean;
}

export const ErrorMessage = ({ message, onDismiss, details, showDebugInfo = false }: ErrorMessageProps) => {
  const getErrorIcon = () => {
    if (details?.status === 403) return '🚫';
    if (details?.status === 401) return '🔑';
    if (details?.status === 429) return '⏱️';
    if (details?.status && details.status >= 500) return '🌐';
    return '⚠️';
  };

  const getErrorTitle = () => {
    if (details?.status === 403) return 'Access Denied';
    if (details?.status === 401) return 'Authentication Failed';
    if (details?.status === 429) return 'Rate Limited';
    if (details?.status && details.status >= 500) return 'Server Error';
    return 'Error';
  };

  const getSuggestions = () => {
    if (details?.status === 403) {
      return [
        '检查API密钥是否有正确的权限设置',
        '确认YouTube Data API v3已在Google Cloud Console中启用',
        '检查API配额是否已用完'
      ];
    }
    if (details?.status === 401) {
      return [
        '验证API密钥是否正确输入',
        '检查API密钥是否已过期',
        '确认API密钥格式正确（sk-...或AIza...）'
      ];
    }
    if (details?.status === 429) {
      return [
        '等待几分钟后重试',
        '检查API配额和使用限制',
        '考虑升级API计划以获得更高配额'
      ];
    }
    return [
      '检查网络连接是否正常',
      '稍后重试操作',
      '验证API服务是否可用'
    ];
  };

  return (
    <div className="card border-red-200 bg-red-50 mb-8">
      <div className="flex items-start space-x-3">
        <div className="text-red-500 text-2xl">{getErrorIcon()}</div>
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold mb-2">{getErrorTitle()}</h3>
          <p className="text-red-700 text-sm mb-3">{message}</p>
          
          {details?.status && (
            <div className="mb-3">
              <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs rounded-md font-mono">
                HTTP {details.status}
              </span>
            </div>
          )}

          <div className="mb-3">
            <h4 className="text-red-800 font-medium text-sm mb-1">💡 解决建议：</h4>
            <ul className="text-red-700 text-xs space-y-1">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {showDebugInfo && details?.error && (
            <details className="mt-3">
              <summary className="text-red-700 text-xs cursor-pointer hover:text-red-800">
                🔍 显示调试信息
              </summary>
              <div className="mt-2 p-2 bg-red-100 rounded border text-xs font-mono text-red-800 max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(details.error, null, 2)}</pre>
              </div>
            </details>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss error"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};