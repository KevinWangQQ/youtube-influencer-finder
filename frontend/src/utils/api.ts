import type { SearchRequest, SearchResponse, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  public code: string;
  public statusCode: number;
  
  constructor(
    code: string,
    message: string,
    statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    throw new ApiError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An unknown error occurred',
      response.status
    );
  }
  
  return data.data!;
}

export const api = {
  async searchInfluencers(request: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(`${API_BASE_URL}/search/influencers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleResponse<SearchResponse>(response);
  },

  async expandKeywords(topic: string): Promise<{ expandedKeywords: string[] }> {
    const response = await fetch(`${API_BASE_URL}/keywords/expand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    return handleResponse<{ expandedKeywords: string[] }>(response);
  },

  async exportToCsv(results: any[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ results }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.code || 'EXPORT_ERROR',
        errorData.error?.message || 'Failed to export data',
        response.status
      );
    }

    return response.blob();
  },

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<{ status: string; timestamp: string }>(response);
  }
};