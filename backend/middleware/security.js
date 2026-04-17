import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Security middleware configuration
 * Provides HTTP security headers, rate limiting, and input sanitization
 */

// Helmet — sets various HTTP security headers
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disabled for API-only server
  crossOriginEmbedderPolicy: false,
});

// Rate limiter — prevents brute-force / DDoS
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Stricter rate limit for sensitive endpoints (email, admin)
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests to this endpoint. Please try again later.',
  },
});

// MongoDB injection sanitization
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key "${key}" in request from ${req.ip}`);
  },
});
