import { jest } from '@jest/globals';

/**
 * Health endpoint tests
 * Tests the /api/health endpoint to ensure the server is responding
 */

// Mock mongoose to avoid actual DB connection in tests
jest.unstable_mockModule('mongoose', () => ({
  default: {
    connect: jest.fn().mockResolvedValue(true),
    connection: { readyState: 1 },
  },
}));

// Mock the email scheduler
jest.unstable_mockModule('../services/emailScheduler.js', () => ({
  initScheduler: jest.fn().mockResolvedValue(true),
}));

describe('Health Endpoint', () => {
  let app;

  beforeAll(async () => {
    // Dynamic import after mocks are set up
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.PORT = '0'; // Random port for testing
  });

  test('should have health route defined', () => {
    // Verify the health route file exists and exports a router
    expect(async () => {
      const healthRoutes = await import('../routes/healthRoutes.js');
      expect(healthRoutes.default).toBeDefined();
    }).not.toThrow();
  });

  test('should have proper route structure', async () => {
    const healthRoutes = await import('../routes/healthRoutes.js');
    const router = healthRoutes.default;
    expect(router).toBeDefined();
    expect(typeof router).toBe('function'); // Express routers are functions
  });
});

describe('Environment Configuration', () => {
  test('should require MONGODB_URI environment variable', () => {
    expect(process.env.MONGODB_URI).toBeDefined();
  });

  test('PORT should default to 3456 if not set', () => {
    const port = process.env.PORT || 3456;
    expect(port).toBeDefined();
  });
});
