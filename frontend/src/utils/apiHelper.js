import axios from 'axios';
import config from '../config';

/**
 * Centralized API helper with response caching and error handling
 */

// Simple in-memory GET cache
const cache = new Map();
const DEFAULT_CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Creates an axios instance pre-configured with the API base URL
 */
const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error(`API Error [${error.response?.status || 'NETWORK'}]: ${message}`);
    return Promise.reject(error);
  }
);

/**
 * GET request with optional caching
 * @param {string} url - API endpoint
 * @param {object} options - { params, cacheTTL (ms), skipCache }
 */
export const apiGet = async (url, { params, cacheTTL = DEFAULT_CACHE_TTL, skipCache = false } = {}) => {
  const cacheKey = `${url}?${JSON.stringify(params || {})}`;

  if (!skipCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return cached.data;
    }
  }

  const response = await api.get(url, { params });
  cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response.data;
};

/**
 * POST request
 */
export const apiPost = async (url, data, config = {}) => {
  const response = await api.post(url, data, config);
  return response.data;
};

/**
 * PUT request
 */
export const apiPut = async (url, data) => {
  const response = await api.put(url, data);
  return response.data;
};

/**
 * DELETE request
 */
export const apiDelete = async (url) => {
  const response = await api.delete(url);
  return response.data;
};

/**
 * Clear the API cache (useful after mutations)
 */
export const clearApiCache = () => cache.clear();

export default api;
