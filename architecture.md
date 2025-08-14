# YouTube 影响者搜索工具 - 技术架构文档

## 1. 整体架构概述

### 1.1 架构模式
采用**前后端分离架构**，确保职责清晰和扩展性：
- **前端**：单页面应用(SPA)，负责用户交互和数据展示
- **后端**：RESTful API服务，负责业务逻辑和外部API集成
- **缓存层**：提升性能和减少API调用成本

### 1.2 技术架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │───▶│   后端 (Node.js) │───▶│  外部 API 服务   │
│                 │    │                 │    │                 │
│ • 用户界面       │    │ • 业务逻辑       │    │ • OpenAI API    │
│ • 数据展示       │    │ • API 集成      │    │ • YouTube API   │
│ • 交互逻辑       │    │ • 数据处理       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   缓存层 (Redis)  │
                       │                 │
                       │ • 搜索结果缓存   │
                       │ • API 响应缓存   │
                       └─────────────────┘
```

## 2. 技术栈选择

### 2.1 前端技术栈
```json
{
  "框架": "React 18",
  "状态管理": "React Context / Zustand",
  "UI组件库": "Ant Design / Material-UI",
  "HTTP客户端": "Axios",
  "构建工具": "Vite",
  "样式方案": "Tailwind CSS",
  "类型系统": "TypeScript"
}
```

**选择理由**：
- React生态成熟，组件化开发效率高
- TypeScript提供类型安全，减少运行时错误
- Vite构建速度快，开发体验好
- Tailwind CSS快速构建现代化UI

### 2.2 后端技术栈
```json
{
  "运行时": "Node.js 18+",
  "框架": "Express.js",
  "语言": "TypeScript",
  "HTTP客户端": "Axios",
  "缓存": "node-cache / Redis",
  "环境配置": "dotenv",
  "API文档": "Swagger",
  "日志": "Winston"
}
```

**选择理由**：
- Node.js与前端技术栈统一，开发效率高
- Express.js轻量级，适合MVP快速开发
- TypeScript确保代码质量和维护性

### 2.3 部署和基础设施
```json
{
  "容器化": "Docker",
  "部署": "Vercel (前端) + Railway/Render (后端)",
  "缓存": "Redis Cloud (生产) / node-cache (开发)",
  "环境变量": ".env文件 + 平台环境变量",
  "监控": "基础日志 + 错误追踪"
}
```

## 3. 数据存储方案

### 3.1 MVP版本存储策略
由于MVP版本需求简单，采用**无持久化存储**的设计：
- **搜索结果**：仅缓存30分钟，无长期存储
- **用户数据**：无用户账户，无需存储用户信息
- **配置数据**：通过环境变量管理

### 3.2 缓存设计
```typescript
// 缓存结构设计
interface CacheEntry {
  key: string;           // 搜索条件的hash值
  data: SearchResult[];  // 搜索结果
  timestamp: number;     // 缓存时间戳
  expiry: number;        // 过期时间(30分钟)
}

// 缓存键命名规范
const cacheKey = `search:${hash(searchParams)}`;
```

### 3.3 未来扩展预留
为后续版本预留数据库设计：
```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 搜索历史表
CREATE TABLE search_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  search_params JSONB,
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 影响者收藏表
CREATE TABLE saved_influencers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  channel_id VARCHAR(255),
  channel_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 4. API设计

### 4.1 RESTful API 规范
```typescript
// 基础响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// 主要API端点
POST /api/search/influencers     // 搜索影响者
GET  /api/search/status/:id      // 获取搜索状态
POST /api/keywords/expand        // 关键词扩展
GET  /api/export/csv/:searchId   // 导出CSV
GET  /api/health                 // 健康检查
```

### 4.2 核心API详细设计

#### 4.2.1 影响者搜索API
```typescript
// 请求体
interface SearchRequest {
  topic: string;                    // 主题关键词
  filters: {
    region?: string;                // 地区 (默认US)
    minSubscribers?: number;        // 最低订阅数
    minViews?: number;              // 最低播放量
    maxResults?: number;            // 最大结果数 (默认50)
  };
}

// 响应体
interface SearchResponse {
  searchId: string;                 // 搜索ID
  results: InfluencerResult[];      // 搜索结果
  expandedKeywords: string[];       // 扩展的关键词
  totalFound: number;               // 总找到数量
}

interface InfluencerResult {
  channelId: string;                // 频道ID
  channelTitle: string;             // 频道名称
  channelUrl: string;               // 频道链接
  thumbnailUrl: string;             // 头像URL
  subscriberCount: number;          // 订阅人数
  viewCount: number;                // 总播放量
  videoCount: number;               // 视频数量
  country: string;                  // 国家
  recentVideos: RecentVideo[];      // 最近视频
  relevanceScore: number;           // 相关性评分 (0-100)
}
```

#### 4.2.2 关键词扩展API
```typescript
// 请求体
interface KeywordExpansionRequest {
  topic: string;                    // 原始主题
  maxKeywords?: number;             // 最大关键词数 (默认10)
  language?: string;                // 语言 (默认en)
}

// 响应体
interface KeywordExpansionResponse {
  originalTopic: string;            // 原始主题
  expandedKeywords: string[];       // 扩展关键词
  confidence: number;               // 扩展置信度
}
```

## 5. 外部API集成

### 5.1 OpenAI API集成
```typescript
class OpenAIService {
  private client: OpenAI;
  
  async expandKeywords(topic: string): Promise<string[]> {
    const prompt = `
      Based on the topic "${topic}", generate 8-10 related keywords 
      that would help find relevant YouTube influencers. 
      Focus on specific niches, synonyms, and related terms.
      Return only the keywords, separated by commas.
    `;
    
    const response = await this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    });
    
    return this.parseKeywords(response.choices[0].message.content);
  }
}
```

### 5.2 YouTube Data API集成
```typescript
class YouTubeService {
  private apiKey: string;
  
  async searchChannels(keywords: string[], filters: SearchFilters) {
    // 搜索策略：
    // 1. 使用关键词搜索视频
    // 2. 提取频道信息
    // 3. 获取频道统计数据
    // 4. 应用筛选条件
    // 5. 计算相关性评分
  }
  
  async getChannelDetails(channelId: string) {
    // 获取频道详细信息
  }
  
  async getChannelVideos(channelId: string, maxResults: number = 5) {
    // 获取频道最近视频
  }
}
```

### 5.3 API限制和配额管理
```typescript
class RateLimiter {
  private youtubeQuota: QuotaManager;
  private openaiQuota: QuotaManager;
  
  async checkQuota(service: 'youtube' | 'openai'): Promise<boolean> {
    // 检查API配额是否充足
  }
  
  async trackUsage(service: string, cost: number): Promise<void> {
    // 跟踪API使用量
  }
}
```

## 6. 性能优化策略

### 6.1 缓存策略
```typescript
class CacheManager {
  private cache: Redis | NodeCache;
  
  // 多层缓存策略
  async get(key: string): Promise<any> {
    // 1. 内存缓存
    // 2. Redis缓存 (如果有)
    // 3. 源数据获取
  }
  
  // 缓存失效策略
  async invalidate(pattern: string): Promise<void> {
    // 基于时间和内容的缓存失效
  }
}
```

### 6.2 异步处理
```typescript
// 异步搜索处理
class SearchProcessor {
  async processSearch(request: SearchRequest): Promise<string> {
    const searchId = uuid();
    
    // 异步处理搜索任务
    this.processAsync(searchId, request);
    
    return searchId; // 立即返回搜索ID
  }
  
  private async processAsync(searchId: string, request: SearchRequest) {
    try {
      // 1. 扩展关键词
      const keywords = await this.expandKeywords(request.topic);
      
      // 2. 搜索YouTube
      const results = await this.searchYouTube(keywords, request.filters);
      
      // 3. 缓存结果
      await this.cacheResults(searchId, results);
    } catch (error) {
      await this.cacheError(searchId, error);
    }
  }
}
```

## 7. 错误处理和监控

### 7.1 错误处理策略
```typescript
// 统一错误处理
class ErrorHandler {
  static handleApiError(error: any): ApiError {
    if (error.code === 'ENOTFOUND') {
      return new ApiError('NETWORK_ERROR', '网络连接失败');
    }
    
    if (error.response?.status === 403) {
      return new ApiError('API_QUOTA_EXCEEDED', 'API配额已用完');
    }
    
    return new ApiError('UNKNOWN_ERROR', '未知错误');
  }
}

// 重试机制
class RetryHandler {
  async withRetry<T>(
    fn: () => Promise<T>, 
    maxRetries: number = 3
  ): Promise<T> {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries) throw error;
        await this.delay(1000 * Math.pow(2, i)); // 指数退避
      }
    }
  }
}
```

### 7.2 日志和监控
```typescript
// 结构化日志
class Logger {
  static info(message: string, context?: any) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  }
  
  static error(message: string, error?: Error, context?: any) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString()
    }));
  }
}
```

## 8. 安全考虑

### 8.1 API密钥安全
```typescript
// 环境变量管理
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY!,
  },
  redis: {
    url: process.env.REDIS_URL,
  }
};

// 运行时检查
if (!config.openai.apiKey) {
  throw new Error('OPENAI_API_KEY is required');
}
```

### 8.2 输入验证
```typescript
// 请求验证中间件
const validateSearchRequest = (req: Request, res: Response, next: NextFunction) => {
  const { topic, filters } = req.body;
  
  if (!topic || topic.length < 2 || topic.length > 100) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TOPIC', message: '主题长度应在2-100字符之间' }
    });
  }
  
  if (filters?.minSubscribers && filters.minSubscribers < 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILTER', message: '订阅人数筛选条件无效' }
    });
  }
  
  next();
};
```

## 9. 部署架构

### 9.1 开发环境
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 9.2 生产环境
```yaml
# 前端部署 (Vercel)
build:
  command: npm run build
  publish: dist/

# 后端部署 (Railway/Render)
services:
  - type: web
    name: youtube-fetch-api
    env: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: OPENAI_API_KEY
        fromSecret: openai-key
      - key: YOUTUBE_API_KEY
        fromSecret: youtube-key
```

## 10. 扩展性设计

### 10.1 架构扩展点
```typescript
// 1. 平台扩展接口
interface PlatformSearcher {
  search(keywords: string[], filters: any): Promise<InfluencerResult[]>;
  getChannelDetails(id: string): Promise<ChannelDetails>;
}

class YouTubeSearcher implements PlatformSearcher { /* ... */ }
class TikTokSearcher implements PlatformSearcher { /* ... */ }

// 2. 关键词扩展器接口
interface KeywordExpander {
  expand(topic: string): Promise<string[]>;
}

class OpenAIExpander implements KeywordExpander { /* ... */ }
class ClaudeExpander implements KeywordExpander { /* ... */ }

// 3. 数据导出接口
interface DataExporter {
  export(data: any[], format: string): Promise<Buffer>;
}

class CSVExporter implements DataExporter { /* ... */ }
class JSONExporter implements DataExporter { /* ... */ }
```

### 10.2 微服务演进路径
```
当前架构 (MVP):
Frontend ←→ Backend API ←→ External APIs

未来架构 (v2.0):
Frontend ←→ API Gateway ←→ [Search Service, Keyword Service, Export Service]
                        ←→ [User Service, Analytics Service]
                        ←→ Database Cluster
```

### 10.3 数据库设计演进
```sql
-- 阶段1: 无数据库 (MVP)
-- 阶段2: 单体数据库 (v1.5)
-- 阶段3: 分库分表 (v2.0)

-- 用户数据库
users: {id, email, plan, created_at}
search_history: {id, user_id, params, results}

-- 影响者数据库  
influencers: {channel_id, platform, data, updated_at}
influencer_metrics: {channel_id, date, subscribers, views}

-- 分析数据库
trending_topics: {topic, platform, score, date}
platform_stats: {platform, total_creators, avg_subscribers}
```

## 11. 技术债务管理

### 11.1 已知技术债务
- **缓存策略**：MVP版本使用简单内存缓存，需要升级到Redis
- **数据持久化**：暂无数据库，后续需要添加
- **用户认证**：暂无用户系统，后续需要完整的认证授权
- **监控体系**：仅有基础日志，需要完整的APM监控

### 11.2 重构计划
```typescript
// 重构优先级
const refactoringPlan = {
  high: [
    '添加用户认证系统',
    '集成Redis缓存',
    '完善错误监控'
  ],
  medium: [
    '代码模块化重构',
    '添加数据库层',
    '性能优化'
  ],
  low: [
    'UI组件库升级',
    '测试覆盖率提升',
    '文档完善'
  ]
};
```

这个架构文档为MVP版本提供了坚实的技术基础，同时为未来的功能扩展预留了充分的空间。重点是保持当前的简洁性，同时确保代码质量和可维护性。