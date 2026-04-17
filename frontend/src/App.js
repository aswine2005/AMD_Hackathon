import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './animations.css'; // Import enhanced animations and UI styles
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AIChatbotFloatingButton from './components/AIChatbotFloatingButton';
import NotFound from './pages/NotFound';

// Lazy-loaded pages for code splitting — reduces initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Categories = lazy(() => import('./pages/Categories'));
const Products = lazy(() => import('./pages/Products'));
const SalesData = lazy(() => import('./pages/SalesData'));
const Forecast = lazy(() => import('./pages/Forecast'));
const CategoryManagement = lazy(() => import('./pages/CategoryManagement'));
const Rankings = lazy(() => import('./pages/Rankings'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Admin = lazy(() => import('./pages/Admin'));

// Loading fallback component
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
    }}
    role="status"
    aria-label="Loading page"
  >
    <div className="spinner-border text-primary" role="progressbar">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="main-container container-fluid py-4" role="main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category-management" element={<CategoryManagement />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales-data" element={<SalesData />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <AIChatbotFloatingButton />
      <Footer />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        role="alert"
        aria-live="assertive"
      />
    </>
  );
}

export default App;
