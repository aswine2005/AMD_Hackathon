import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock heavy components to keep tests fast
jest.mock('../pages/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard">Dashboard</div>;
  };
});

jest.mock('../pages/Categories', () => {
  return function MockCategories() {
    return <div data-testid="categories">Categories</div>;
  };
});

jest.mock('../pages/Products', () => {
  return function MockProducts() {
    return <div data-testid="products">Products</div>;
  };
});

jest.mock('../pages/SalesData', () => {
  return function MockSalesData() {
    return <div data-testid="sales-data">SalesData</div>;
  };
});

jest.mock('../pages/Forecast', () => {
  return function MockForecast() {
    return <div data-testid="forecast">Forecast</div>;
  };
});

jest.mock('../pages/CategoryManagement', () => {
  return function MockCategoryManagement() {
    return <div data-testid="category-management">CategoryManagement</div>;
  };
});

jest.mock('../pages/Rankings', () => {
  return function MockRankings() {
    return <div data-testid="rankings">Rankings</div>;
  };
});

jest.mock('../pages/AIAssistant', () => {
  return function MockAIAssistant() {
    return <div data-testid="ai-assistant">AIAssistant</div>;
  };
});

jest.mock('../pages/Admin', () => {
  return function MockAdmin() {
    return <div data-testid="admin">Admin</div>;
  };
});

jest.mock('../components/AIChatbotFloatingButton', () => {
  return function MockChatbot() {
    return <div data-testid="chatbot-button">Chatbot</div>;
  };
});

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
  });

  test('renders navbar', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    // Navbar should be present
    const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    expect(nav).toBeInTheDocument();
  });

  test('renders skip-to-content link for accessibility', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('renders main content area with proper role', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('role', 'main');
  });

  test('renders dashboard on root route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    const dashboard = await screen.findByTestId('dashboard');
    expect(dashboard).toBeInTheDocument();
  });

  test('renders NotFound for unknown routes', async () => {
    render(
      <MemoryRouter initialEntries={['/unknown-page']}>
        <App />
      </MemoryRouter>
    );
    // NotFound is not lazy-loaded, so it should render
    const notFound = await screen.findByText(/not found|404|doesn't exist/i);
    expect(notFound).toBeInTheDocument();
  });

  test('renders chatbot floating button', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    const chatbot = screen.getByTestId('chatbot-button');
    expect(chatbot).toBeInTheDocument();
  });
});
