import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock axios to prevent real API calls
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  get: jest.fn().mockResolvedValue({ data: {} }),
}));

// Lazy import after mocks
let Dashboard;

beforeAll(async () => {
  const module = await import('../pages/Dashboard');
  Dashboard = module.default;
});

describe('Dashboard Component', () => {
  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  });

  test('contains heading element', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    // Dashboard should have some heading
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);
  });

  test('renders with proper container structure', () => {
    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeTruthy();
  });
});
