/**
 * Configuration file to manage environment-based settings
 * Uses environment variables with sensible defaults for local development
 */

const config = {
  // API base URL — configurable via REACT_APP_API_URL env var
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3456',

  // Google Analytics Measurement ID
  gaMeasurementId: process.env.REACT_APP_GA_MEASUREMENT_ID || '',
};

export default config;
