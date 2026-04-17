import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Alert, Spinner, ProgressBar, Button, Badge } from 'react-bootstrap';
import { 
  FaMoneyBillWave, FaShoppingCart, FaExclamationTriangle, FaTags, 
  FaBoxes, FaShare, FaEnvelope, FaChartLine, FaCalendarDay, 
  FaSync, FaPiggyBank, FaPercent, FaStoreAlt, FaRegClock, FaThumbsUp
} from 'react-icons/fa';
import ShareAdminDataModal from '../components/ShareAdminDataModal';
import config from '../config';
import './Admin.css';
import '../animations.css';

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaySales, setTodaySales] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    orders: 0,
    topCategories: [],
    topProducts: [],
    notSellingCategories: [],
    notSellingProducts: []
  });

  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get current date formatted for display
  const getTodayDate = () => {
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-IN', options);
  };
  
  // Get current time for "Last updated at" display
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  const [lastUpdated, setLastUpdated] = useState(getCurrentTime());
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchTodaySales = async () => {
      setLoading(true);
      try {
        // Get today's date at midnight for query
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const response = await axios.get(`${config.apiBaseUrl}/api/admin/today-sales`);
        setTodaySales(response.data);
        setLastUpdated(getCurrentTime());
        setError(null);
      } catch (err) {
        console.error('Error fetching today\'s sales:', err);
        setError('Could not load today\'s sales data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodaySales();
    
    // Refresh data every 5 minutes
    const refreshInterval = setInterval(fetchTodaySales, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  if (loading) {
    return (
      <div className="loading-indicator my-5">
        <div className="loading-spinner mb-3"></div>
        <h4 className="mb-2">Loading Dashboard Data</h4>
        <p className="text-muted">Retrieving today's sales metrics and performance data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger" className="my-4 p-4 d-flex align-items-start">
        <FaExclamationTriangle className="me-3 mt-1 fs-3 flex-shrink-0" />
        <div>
          <Alert.Heading>Error Loading Data</Alert.Heading>
          <p>{error}</p>
          <p className="mb-0">Please try refreshing the page or contact support if this problem persists.</p>
          <Button variant="outline-danger" className="mt-3" onClick={() => window.location.reload()}>
            <FaSync className="me-2" /> Refresh Page
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="rankings-page-header slide-in-left mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h1 className="fw-bold">Today's Business Dashboard</h1>
          <Button 
            variant="primary" 
            className="enhanced-button button-hover-effect d-flex align-items-center" 
            onClick={() => setShowShareModal(true)}
          >
            <FaEnvelope className="me-2" /> Share Report
          </Button>
        </div>
        <div className="d-flex justify-content-between">
          <p className="text-muted mb-0">
            <FaCalendarDay className="me-2" />
            {getTodayDate()}
          </p>
          <p className="text-muted mb-0">
            <FaRegClock className="me-2" />
            Last updated at {lastUpdated}
          </p>
        </div>
      </div>
      
      {/* Share Modal */}
      <ShareAdminDataModal 
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        adminData={todaySales}
      />
      
      {/* Main Sales Metrics */}
      <Row className="g-4 mb-4">
        <Col md={6} lg={3}>
          <Card className="enhanced-card stat-card hover-lift sales-card slide-up">
            <Card.Body className="p-4 text-center">
              <div className="metric-icon bg-gradient-primary p-3 rounded-circle mb-3 float mx-auto">
                <FaMoneyBillWave className="text-white" size={24} />
              </div>
              <h5 className="fw-bold mb-1">Today's Sales</h5>
              <div className="metric-value stat-value fw-bold mb-2">{formatCurrency(todaySales.totalRevenue)}</div>
              <div className="text-muted small">
                <Badge bg="light" text="dark" className="p-2">
                  <FaStoreAlt className="me-1" /> Total amount collected today
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3}>
          <Card className="enhanced-card stat-card hover-lift profit-card slide-up delay-1">
            <Card.Body className="p-4 text-center">
              <div className="metric-icon bg-gradient-success p-3 rounded-circle mb-3 float mx-auto">
                <FaPiggyBank className="text-white" size={24} />
              </div>
              <h5 className="fw-bold mb-1">Today's Profit</h5>
              <div className="metric-value stat-value fw-bold mb-2">{formatCurrency(todaySales.totalProfit)}</div>
              <div className="text-muted small">
                <Badge bg="light" text="dark" className="p-2">
                  <FaPercent className="me-1" /> {(todaySales.totalProfit / todaySales.totalRevenue * 100).toFixed(1)}% margin
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3}>
          <Card className="enhanced-card stat-card hover-lift orders-card slide-up delay-2">
            <Card.Body className="p-4 text-center">
              <div className="metric-icon bg-gradient-warning p-3 rounded-circle mb-3 float mx-auto">
                <FaShoppingCart className="text-white" size={24} />
              </div>
              <h5 className="fw-bold mb-1">Orders</h5>
              <div className="metric-value stat-value fw-bold mb-2">{todaySales.orders}</div>
              <div className="text-muted small">
                <Badge bg="light" text="dark" className="p-2">
                  <FaThumbsUp className="me-1" /> Total orders processed today
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3}>
          <Card className="enhanced-card stat-card hover-lift units-card slide-up delay-3">
            <Card.Body className="p-4 text-center">
              <div className="metric-icon bg-gradient-danger p-3 rounded-circle mb-3 float mx-auto">
                <FaBoxes className="text-white" size={24} />
              </div>
              <h5 className="fw-bold mb-1">Units Sold</h5>
              <div className="metric-value stat-value fw-bold mb-2">{todaySales.totalSales}</div>
              <div className="text-muted small">
                <Badge bg="light" text="dark" className="p-2">
                  <FaBoxes className="me-1" /> Total units sold today
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Top Products and Categories */}
      <Row className="g-4">
        <Col md={6}>
          <Card className="enhanced-card h-100 slide-up delay-2">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold"><FaBoxes className="me-2" /> Top Selling Products</h5>
                <Badge bg="success" className="pulse p-2">
                  TODAY
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {todaySales.topProducts.length > 0 ? (
                <div className="top-products">
                  {todaySales.topProducts.map((product, index) => (
                    <div key={index} className={`product-item table-row-animate mb-4 ${index < 3 ? 'top-rank-item' : ''}`}>
                      <div className="product-info d-flex justify-content-between align-items-center mb-2">
                        <div>
                          {index < 3 && (
                            <Badge bg={index === 0 ? "warning" : index === 1 ? "secondary" : "info"} className="me-2 position-relative" style={{top: "-2px"}}>
                              #{index+1}
                            </Badge>
                          )}
                          <span className="fw-bold">{product.name}</span>
                        </div>
                        <div className="d-flex gap-3">
                          <Badge bg="light" text="dark" className="p-2">
                            <FaBoxes className="me-1" /> {product.quantity} units
                          </Badge>
                          <Badge bg="light" text="primary" className="p-2 fw-bold">
                            {formatCurrency(product.revenue)}
                          </Badge>
                        </div>
                      </div>
                      <ProgressBar 
                        now={product.percentage} 
                        variant={index === 0 ? "success" : index === 1 ? "primary" : "info"} 
                        className="progress-enhanced" 
                        style={{height: "10px", borderRadius: "5px"}}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 my-4">
                  <FaExclamationTriangle className="text-warning mb-3" size={48} />
                  <h4 className="fw-bold">No Products Sold Today!</h4>
                  <p className="text-muted">Consider having a sales person promote your products to increase sales.</p>
                  <Button variant="outline-primary" className="enhanced-button mt-3">
                    <FaShoppingCart className="me-2" /> View Products
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="enhanced-card h-100 slide-up delay-3">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold"><FaTags className="me-2" /> Top Selling Categories</h5>
                <Badge bg="success" className="pulse p-2">
                  TODAY
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {todaySales.topCategories.length > 0 ? (
                <div className="top-categories">
                  {todaySales.topCategories.map((category, index) => (
                    <div key={index} className={`category-item table-row-animate mb-4 ${index < 3 ? 'top-rank-item' : ''}`}>
                      <div className="category-info d-flex justify-content-between align-items-center mb-2">
                        <div>
                          {index < 3 && (
                            <Badge bg={index === 0 ? "warning" : index === 1 ? "secondary" : "info"} className="me-2 position-relative" style={{top: "-2px"}}>
                              #{index+1}
                            </Badge>
                          )}
                          <span className="fw-bold">{category.name}</span>
                        </div>
                        <div className="d-flex gap-3">
                          <Badge bg="light" text="dark" className="p-2">
                            <FaBoxes className="me-1" /> {category.quantity} units
                          </Badge>
                          <Badge bg="light" text="primary" className="p-2 fw-bold">
                            {formatCurrency(category.revenue)}
                          </Badge>
                        </div>
                      </div>
                      <ProgressBar 
                        now={category.percentage} 
                        variant={index === 0 ? "success" : index === 1 ? "primary" : "info"} 
                        className="progress-enhanced" 
                        style={{height: "10px", borderRadius: "5px"}}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 my-4">
                  <FaExclamationTriangle className="text-warning mb-3" size={48} />
                  <h4 className="fw-bold">No Categories Sold Today!</h4>
                  <p className="text-muted">Try promoting your products to increase today's sales.</p>
                  <Button variant="outline-primary" className="enhanced-button mt-3">
                    <FaTags className="me-2" /> View Categories
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Not selling categories and products */}
      {(todaySales.notSellingCategories.length > 0 || todaySales.notSellingProducts.length > 0) && (
        <Row className="mt-4 g-4">
          {todaySales.notSellingCategories.length > 0 && (
            <Col md={6}>
              <Card className="shadow h-100 attention-card">
                <Card.Header className="bg-warning">
                  <h2 className="h5 mb-0"><FaExclamationTriangle className="me-2" /> Categories Not Selling Today</h2>
                </Card.Header>
                <Card.Body>
                  <div className="not-selling-items">
                    {todaySales.notSellingCategories.map((category, index) => (
                      <div key={index} className="not-selling-item">
                        <h4>{category.name}</h4>
                        <p>Last sale: {new Date(category.lastSaleDate).toLocaleDateString('en-IN')}</p>
                        <div className="action-suggestion">
                          <FaExclamationTriangle className="text-warning me-2" />
                          <span>Suggestion: Assign a sales person to promote this category today</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
          
          {todaySales.notSellingProducts.length > 0 && (
            <Col md={6}>
              <Card className="shadow h-100 attention-card">
                <Card.Header className="bg-warning">
                  <h2 className="h5 mb-0"><FaExclamationTriangle className="me-2" /> Products Not Selling Today</h2>
                </Card.Header>
                <Card.Body>
                  <div className="not-selling-items">
                    {todaySales.notSellingProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="not-selling-item">
                        <h4>{product.name}</h4>
                        <p>Last sale: {new Date(product.lastSaleDate).toLocaleDateString('en-IN')}</p>
                        <div className="action-suggestion">
                          <FaExclamationTriangle className="text-warning me-2" />
                          <span>Suggestion: Consider a special discount or bundle offer</span>
                        </div>
                      </div>
                    ))}
                    {todaySales.notSellingProducts.length > 5 && (
                      <div className="text-center mt-3">
                        <p>+{todaySales.notSellingProducts.length - 5} more products not selling today</p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default Admin;
