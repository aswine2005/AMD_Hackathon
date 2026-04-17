/**
 * Simple in-memory cache middleware for GET requests
 * Caches responses with a configurable TTL to reduce database load
 */

const cache = new Map();

/**
 * Creates a caching middleware with the specified TTL
 * @param {number} ttlSeconds - Time-to-live in seconds (default: 300 = 5 minutes)
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl || req.url}`;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
      return res.json(cached.data);
    }

    // Override res.json to capture the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clears the entire cache or a specific key
 * @param {string} [key] - Optional specific key to clear
 */
export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

// Periodically clean expired entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes max
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > maxAge) {
      cache.delete(key);
    }
  }
}, 10 * 60 * 1000);

export default cacheMiddleware;
