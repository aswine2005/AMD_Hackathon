import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge, Button, 
         Tabs, Tab, Form, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import axios from 'axios';
import { 
  FaTrophy, FaMedal, FaAward, FaBoxOpen, FaChartLine, FaShoppingCart, 
  FaExclamationTriangle, FaCalendarAlt, FaFilter, FaDownload, FaSync,
  FaArrowUp, FaArrowDown, FaMinus, FaInfoCircle, FaLightbulb
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import config from '../config';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  ArcElement 
} from 'chart.js';

// Import CSS for animations
import './Rankings.css';
import '../animations.css'; // Import enhanced animations

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  ChartTooltip, 
  Legend,
  ArcElement
);

/**
 * Enhanced Rankings page component with trend analysis and improvement suggestions
 */
const Rankings = () => {
  // State for rankings data
  const [rankingsData, setRankingsData] = useState({
    productRankings: [],
    categoryRankings: [],
    overallMetrics: null,
    improvementSuggestions: [],
    timestamp: null
  });
  
  // State for historical data
  const [historyData, setHistoryData] = useState({
    dates: [],
    categories: []
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [timeRange, setTimeRange] = useState('30');
  const [backendConnected, setBackendConnected] = useState(true);
  const [productSortMetric, setProductSortMetric] = useState('sales');
  const [categorySortMetric, setCategorySortMetric] = useState('sales');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modal state
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSuggestions, setProductSuggestions] = useState([]);
  
  // Reference for previous rankings (for animations)
  const prevRankingsRef = useRef(null);
  
  // UI Constants
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
  const chartColors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(153, 102, 255, 0.8)'
  ];
  
  // Initial data loading
  useEffect(() => {
    checkBackendConnection();
  }, [refreshKey]);
  
  // Effect to handle time range changes
  useEffect(() => {
    if (backendConnected) {
      fetchRankingsData(timeRange);
      fetchHistoricalData(timeRange);
    }
  }, [timeRange, backendConnected]);
  
  // Store previous rankings for animations
  useEffect(() => {
    if (rankingsData.productRankings?.length > 0) {
      prevRankingsRef.current = {
        products: [...rankingsData.productRankings],
        categories: [...rankingsData.categoryRankings]
      };
    }
  }, [rankingsData]);
  
  // Check backend connectivity
  const checkBackendConnection = async () => {
    try {
      const healthResponse = await axios.get(`${config.apiBaseUrl}/api/health`, { timeout: 3000 });
      
      if (!healthResponse.data || healthResponse.data.status !== 'ok') {
        throw new Error('Backend health check failed');
      }
      
      setBackendConnected(true);
      fetchRankingsData(timeRange);
      fetchHistoricalData(timeRange);
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendConnected(false);
      setLoading(false);
      setHistoryLoading(false);
      setError('Failed to connect to the server. Please check your connection.');
      toast.error('Failed to connect to the server. Please check your connection.');
    }
  };
  
  // Fetch main rankings data
  const fetchRankingsData = async (days) => {
    if (!backendConnected) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await axios.get(`${config.apiBaseUrl}/api/rankings?days=${days}&_t=${timestamp}`);
      const data = response.data;
      
      if (!data) {
        throw new Error('Invalid data received from server');
      }
      
      setRankingsData({
        productRankings: data.productRankings || [],
        categoryRankings: data.categoryRankings || [],
        overallMetrics: data.overallMetrics || null,
        improvementSuggestions: data.improvementSuggestions || [],
        timestamp: data.timestamp || new Date().toISOString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rankings data:', error);
      setError('Failed to load rankings data: ' + (error.message || 'Please try again later.'));
      setLoading(false);
    }
  };
  
  // Fetch historical trend data
  const fetchHistoricalData = async (days) => {
    if (!backendConnected) return;
    
    try {
      setHistoryLoading(true);
      
      const response = await axios.get(`${config.apiBaseUrl}/api/rankings/history?days=${days}`);
      const data = response.data;
      
      if (!data) {
        throw new Error('Invalid historical data received');
      }
      
      setHistoryData({
        dates: data.dates || [],
        categories: data.categories || []
      });
      
      setHistoryLoading(false);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setHistoryLoading(false);
    }
  };
  
  // Fetch product rankings by specific metric
  const fetchProductsByMetric = async (metric) => {
    try {
      setProductSortMetric(metric);
      const response = await axios.get(`${config.apiBaseUrl}/api/rankings/products/by/${metric}?days=${timeRange}`);
      
      if (response.data && response.data.rankings) {
        setRankingsData(prev => ({
          ...prev,
          productRankings: response.data.rankings
        }));
      }
    } catch (error) {
      console.error(`Error fetching products by ${metric}:`, error);
      toast.error(`Could not load products ranked by ${metric}`);
    }
  };
  
  // Fetch category rankings by specific metric
  const fetchCategoriesByMetric = async (metric) => {
    try {
      setCategorySortMetric(metric);
      const response = await axios.get(`${config.apiBaseUrl}/api/rankings/categories/by/${metric}?days=${timeRange}`);
      
      if (response.data && response.data.rankings) {
        setRankingsData(prev => ({
          ...prev,
          categoryRankings: response.data.rankings
        }));
      }
    } catch (error) {
      console.error(`Error fetching categories by ${metric}:`, error);
      toast.error(`Could not load categories ranked by ${metric}`);
    }
  };
  
  // Get improvement suggestions for a product
  const fetchProductSuggestions = async (productId) => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/rankings/suggestions/${productId}`);
      
      setSelectedProduct(response.data.product);
      setProductSuggestions(response.data.suggestions);
      setShowSuggestionsModal(true);
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
      toast.error('Could not load improvement suggestions');
    }
  };
  
  // Force refresh rankings data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.info('Refreshing rankings data...');
  };
  
  // Handle time range change
  const handleTimeRangeChange = (e) => {
    const days = e.target.value;
    setTimeRange(days);
    toast.info(`Updating rankings for the last ${days} days...`);
  };
  
  // Format currency with Rupee symbol
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    return '₹' + value.toLocaleString('en-IN');
  };
  
  // Get chart data for top products
  const getProductChartData = () => {
    const topProducts = [...rankingsData.productRankings].slice(0, 5);
    
    return {
      labels: topProducts.map(p => p.productName),
      datasets: [
        {
          label: 'Revenue',
          data: topProducts.map(p => p.totalRevenue),
          backgroundColor: chartColors.slice(0, topProducts.length),
          borderWidth: 1
        }
      ],
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Top Products by Revenue'
          }
        }
      }
    };
  };
  
  // Get chart data for categories
  const getCategoryChartData = () => {
    return {
      labels: rankingsData.categoryRankings.map(c => c.categoryName),
      datasets: [
        {
          label: 'Sales Volume',
          data: rankingsData.categoryRankings.map(c => c.totalQuantity),
          backgroundColor: chartColors.slice(0, rankingsData.categoryRankings.length),
          borderWidth: 1
        }
      ],
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Category Sales Distribution'
          }
        }
      }
    };
  };
  
  // Get historical trend chart data
  const getHistoricalChartData = () => {
    return {
      labels: historyData.dates,
      datasets: historyData.categories.map((category, index) => ({
        label: category.categoryName,
        data: category.data,
        borderColor: chartColors[index % chartColors.length],
        backgroundColor: 'transparent',
        tension: 0.3
      })),
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Category Sales Trends Over Time'
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Sales Volume'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    };
  };
  
  /**
   * Render rank with animation for position changes
   */
  const renderRankWithChange = (index, item) => {
    // Highlight rank changes with animations
    const prevRankings = prevRankingsRef.current;
    if (!prevRankings) return renderRank(index);
    
    const isProduct = 'productId' in item;
    const prevList = isProduct ? prevRankings.products : prevRankings.categories;
    const idField = isProduct ? 'productId' : 'categoryId';
    
    if (!prevList) return renderRank(index);
    
    const prevItem = prevList.find(p => p && p[idField] === item[idField]);
    const prevIndex = prevItem ? prevList.indexOf(prevItem) : -1;
    
    let rankChangeIcon = null;
    let rankChangeClass = '';
    
    if (prevIndex !== -1 && prevIndex !== index) {
      if (prevIndex > index) {
        // Improved rank
        rankChangeIcon = <FaArrowUp className="text-success ms-1" />;
        rankChangeClass = 'rank-improved';
      } else {
        // Decreased rank
        rankChangeIcon = <FaArrowDown className="text-danger ms-1" />;
        rankChangeClass = 'rank-decreased';
      }
    }
    
    return (
      <div className={`rank-container ${rankChangeClass}`}>
        {renderRank(index)}
        {rankChangeIcon}
      </div>
    );
  };

  /**
   * Render medal or ranking number
   */
  const renderRank = (index) => {
    if (index === 0) {
      return <FaTrophy style={{ color: medalColors[0] }} />;
    } else if (index === 1) {
      return <FaMedal style={{ color: medalColors[1] }} />;
    } else if (index === 2) {
      return <FaAward style={{ color: medalColors[2] }} />;
    } else {
      return <span>{index + 1}</span>;
    }
  };

  /**
   * Render stock status badge
   */
  const renderStockStatus = (status) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;
    
    let variant;
    switch (status) {
      case 'Low':
        variant = 'danger';
        break;
      case 'Medium':
        variant = 'warning';
        break;
      case 'Good':
        variant = 'success';
        break;
      default:
        variant = 'secondary';
    }
    
    return <Badge bg={variant}>{status}</Badge>;
  };

  /**
   * Render trend badge
   */
  const renderTrend = (trend) => {
    if (!trend) return <Badge bg="secondary">Unknown</Badge>;
    
    let badgeText, variant;
    
    switch (trend) {
      case 'top_performer':
        badgeText = 'Top Performer';
        variant = 'success';
        break;
      case 'strong':
        badgeText = 'Strong';
        variant = 'info';
        break;
      case 'average':
        badgeText = 'Average';
        variant = 'secondary';
        break;
      case 'needs_improvement':
        badgeText = 'Needs Improvement';
        variant = 'danger';
        break;
      default:
        badgeText = trend;
        variant = 'secondary';
    }
    
    return <Badge bg={variant}>{badgeText}</Badge>;
  };

  /**
   * Render product suggestion badge based on impact
   */
  const renderSuggestionImpact = (impact) => {
    let variant;
    switch (impact) {
      case 'high':
        variant = 'danger';
        break;
      case 'medium':
        variant = 'warning';
        break;
      case 'low':
        variant = 'info';
        break;
      default:
        variant = 'secondary';
    }
    
    return <Badge bg={variant}>{impact}</Badge>;
  };

  // Main render
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Sales Rankings & Analytics</h1>
        <div>
          <Button variant="outline-primary" className="me-2" onClick={handleRefresh}>
            <FaSync className="me-1" /> Refresh
          </Button>
          
          <Form.Select 
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="d-inline-block ms-2"
            style={{ width: 'auto' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 180 days</option>
          </Form.Select>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading real-time rankings data...</p>
        </div>
      ) : (
        <>
          {/* Overall Metrics */}
          {rankingsData.overallMetrics && (
            <Row className="mb-4">
              <Col md={3}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="text-center">
                    <h6 className="text-muted">Total Sales</h6>
                    <h3>{rankingsData.overallMetrics.totalSales || 0}</h3>
                    <p className="text-muted mb-0">Units sold in {rankingsData.overallMetrics.period}</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="text-center">
                    <h6 className="text-muted">Total Revenue</h6>
                    <h3>{formatCurrency(rankingsData.overallMetrics.totalRevenue || 0)}</h3>
                    <p className="text-muted mb-0">in {rankingsData.overallMetrics.period}</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="text-center">
                    <h6 className="text-muted">Daily Average</h6>
                    <h3>{rankingsData.overallMetrics.averageSalePerDay || 0}</h3>
                    <p className="text-muted mb-0">Units per day</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="text-center">
                    <h6 className="text-muted">Unique Products</h6>
                    <h3>{rankingsData.overallMetrics.uniqueProductCount || 0}</h3>
                    <p className="text-muted mb-0">With sales activity</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          {/* Historical Trends - Enhanced and Larger */}
          <Card className="rankings-card mb-4 slide-up">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><FaChartLine className="me-2" /> Historical Sales Trends</h5>
              <div className="d-flex align-items-center">
                {historyLoading && <Spinner animation="border" size="sm" className="me-2" />}
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>View your sales performance over time to identify patterns and trends</Tooltip>}
                >
                  <span><FaInfoCircle className="text-info ms-2" /></span>
                </OverlayTrigger>
              </div>
            </Card.Header>
            <Card.Body>
              {!historyLoading && historyData.dates.length > 0 && historyData.categories.length > 0 ? (
                <div className="historical-chart-container chart-line">
                  <Line 
                    data={getHistoricalChartData()} 
                    options={{
                      ...getHistoricalChartData().options,
                      maintainAspectRatio: false,
                      responsive: true,
                      animation: {
                        duration: 1500,
                        easing: 'easeOutQuart'
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            boxWidth: 15,
                            usePointStyle: true,
                            padding: 20,
                            font: {
                              size: 12,
                              weight: 'bold'
                            }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleFont: {
                            size: 14,
                            weight: 'bold'
                          },
                          bodyFont: {
                            size: 13
                          },
                          padding: 12,
                          cornerRadius: 8,
                          usePointStyle: true
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="rankings-loading">
                  {historyLoading ? (
                    <>
                      <div className="loader mb-3"></div>
                      <p className="text-center text-muted">Loading historical data...</p>
                    </>
                  ) : (
                    <Alert variant="info" className="mb-0 w-100">
                      <div className="d-flex align-items-center">
                        <FaInfoCircle className="me-3 fs-4" />
                        <div>
                          <p className="mb-1 fw-bold">No historical data available</p>
                          <p className="mb-0 small">Try selecting a different time period or check back later when more data is available.</p>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* Current Rankings with Enhanced UI */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="rankings-tabs mb-4"
          >
            <Tab eventKey="products" title={<><FaBoxOpen className="me-2" /> Product Rankings</>}>
              <div className="rankings-page-header slide-in-left">
                <h4>Top Performing Products</h4>
                <p className="text-muted">View and analyze your best-selling products across different metrics</p>
              </div>
              
              {/* Enhanced Product ranking metric selectors */}
              <div className="ranking-filter-buttons mb-4 slide-in-left delay-1">
                <div className="btn-group" role="group">
                  <Button 
                    className={`button-hover-effect ${productSortMetric === 'sales' ? 'active' : ''}`}
                    variant={productSortMetric === 'sales' ? 'primary' : 'outline-primary'} 
                    onClick={() => fetchProductsByMetric('sales')}
                  >
                    <FaShoppingCart className="me-2" /> By Sales
                  </Button>
                  <Button 
                    className={`button-hover-effect ${productSortMetric === 'revenue' ? 'active' : ''}`}
                    variant={productSortMetric === 'revenue' ? 'primary' : 'outline-primary'}
                    onClick={() => fetchProductsByMetric('revenue')}
                  >
                    <FaChartLine className="me-2" /> By Revenue
                  </Button>
                  <Button 
                    className={`button-hover-effect ${productSortMetric === 'profit' ? 'active' : ''}`}
                    variant={productSortMetric === 'profit' ? 'primary' : 'outline-primary'}
                    onClick={() => fetchProductsByMetric('profit')}
                  >
                    <FaChartLine className="me-2" /> By Profit
                  </Button>
                  <Button 
                    className={`button-hover-effect ${productSortMetric === 'engagement' ? 'active' : ''}`}
                    variant={productSortMetric === 'engagement' ? 'primary' : 'outline-primary'}
                    onClick={() => fetchProductsByMetric('engagement')}
                  >
                    <FaChartLine className="me-2" /> By Engagement
                  </Button>
                </div>
              </div>
              
              {/* Charts for top products with enhanced styling */}
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="rankings-card slide-in-left delay-2">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0"><FaChartLine className="me-2" /> Top Products Performance</h5>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Visual comparison of your top performing products</Tooltip>}
                      >
                        <span><FaInfoCircle className="text-info" /></span>
                      </OverlayTrigger>
                    </Card.Header>
                    <Card.Body className="chart-container">
                      {rankingsData.productRankings && rankingsData.productRankings.length > 0 ? (
                        <Bar 
                          data={getProductChartData()} 
                          options={{
                            ...getProductChartData().options,
                            animation: {
                              duration: 1200,
                              easing: 'easeOutQuart'
                            },
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleFont: {
                                  size: 14,
                                  weight: 'bold'
                                },
                                bodyFont: {
                                  size: 13
                                },
                                padding: 12,
                                cornerRadius: 8
                              }
                            }
                          }} 
                        />
                      ) : (
                        <div className="rankings-loading">
                          {loading ? (
                            <div className="loader"></div>
                          ) : (
                            <Alert variant="warning" className="d-flex align-items-center">
                              <FaExclamationTriangle className="me-3 fs-4" />
                              <div>
                                <p className="mb-1 fw-bold">No product data available</p>
                                <p className="mb-0 small">Try selecting a different time period or check if products have sales data.</p>
                              </div>
                            </Alert>
                          )}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Enhanced Product rankings table */}
              <Card className="rankings-card mb-4 slide-in-left delay-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaTrophy className="me-2" /> Top Performing Products</h5>
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    onClick={handleRefresh} 
                    className="btn-enhanced"
                  >
                    <FaSync className="me-1" /> Refresh
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="rankings-table table-enhanced">
                    <thead>
                      <tr>
                        <th width="70">Rank</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-end">Revenue</th>
                        <th className="text-end">Profit</th>
                        <th className="text-center">Stock</th>
                        <th className="text-center">Trend</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingsData.productRankings.map((product, index) => (
                        <tr 
                          key={product.productId || index} 
                          className={`product-row table-row-animate ${index < 3 ? 'top-rank-row' : ''}`}
                        >
                          <td className="text-center">
                            {index < 3 ? (
                              <div className={`medal-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                                {renderRankWithChange(index, product)}
                              </div>
                            ) : (
                              renderRankWithChange(index, product)
                            )}
                          </td>
                          <td>
                            <div className="fw-bold">{product.productName}</div>
                            <small className="text-muted">ID: {product.productId}</small>
                          </td>
                          <td>{product.categoryName}</td>
                          <td className="text-end fw-bold">{product.totalQuantity}</td>
                          <td className="text-end fw-bold">{formatCurrency(product.totalRevenue)}</td>
                          <td className="text-end fw-bold">{formatCurrency(product.profit)}</td>
                          <td className="text-center">{renderStockStatus(product.stockStatus)}</td>
                          <td className="text-center">{renderTrend(product.trend)}</td>
                          <td className="text-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="btn-enhanced me-1"
                              onClick={() => window.location.href = `/forecast?productId=${product.productId}`}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => fetchProductSuggestions(product.productId)}
                            >
                              <FaLightbulb />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!rankingsData.productRankings || rankingsData.productRankings.length === 0) && (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            <Alert variant="warning" className="mb-0">
                              <FaExclamationTriangle className="me-2" />
                              No product sales data available. Please upload sales data to see rankings.
                            </Alert>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
              
              {/* Improvement suggestions panel */}
              {rankingsData.improvementSuggestions && rankingsData.improvementSuggestions.length > 0 && (
                <Card className="shadow-sm mb-4">
                  <Card.Header className="bg-white">
                    <h5 className="mb-0"><FaLightbulb className="me-2" /> Improvement Suggestions</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {rankingsData.improvementSuggestions.map((item, index) => (
                        <Col md={6} key={index} className="mb-3">
                          <div className="suggestions-panel">
                            <h6>{item.productName}</h6>
                            <div>
                              {item.suggestions.map((suggestion, i) => (
                                <div key={i} className={`suggestion-item suggestion-${suggestion.impact}`}>
                                  <div className="d-flex justify-content-between">
                                    <strong>{suggestion.title}</strong>
                                    {renderSuggestionImpact(suggestion.impact)}
                                  </div>
                                  <p className="mb-0 small text-muted">{suggestion.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </Tab>
            
            <Tab eventKey="categories" title={<><FaShoppingCart className="me-2" /> Category Rankings</>}>
              <div className="rankings-page-header slide-in-left">
                <h4>Category Performance Analysis</h4>
                <p className="text-muted">Analyze how your product categories are performing across different metrics</p>
              </div>
              
              {/* Enhanced Category ranking metric selectors */}
              <div className="ranking-filter-buttons mb-4 slide-in-left delay-1">
                <div className="btn-group" role="group">
                  <Button 
                    className={`button-hover-effect ${categorySortMetric === 'sales' ? 'active' : ''}`}
                    variant={categorySortMetric === 'sales' ? 'primary' : 'outline-primary'} 
                    onClick={() => fetchCategoriesByMetric('sales')}
                  >
                    <FaShoppingCart className="me-2" /> By Sales
                  </Button>
                  <Button 
                    className={`button-hover-effect ${categorySortMetric === 'revenue' ? 'active' : ''}`}
                    variant={categorySortMetric === 'revenue' ? 'primary' : 'outline-primary'}
                    onClick={() => fetchCategoriesByMetric('revenue')}
                  >
                    <FaChartLine className="me-2" /> By Revenue
                  </Button>
                  <Button 
                    className={`button-hover-effect ${categorySortMetric === 'engagement' ? 'active' : ''}`}
                    variant={categorySortMetric === 'engagement' ? 'primary' : 'outline-primary'}
                    onClick={() => fetchCategoriesByMetric('engagement')}
                  >
                    <FaChartLine className="me-2" /> By Engagement
                  </Button>
                </div>
              </div>
              
              {/* Enhanced Category pie chart with better styling */}
              <Row className="mb-4">
                <Col lg={7} md={10} className="mx-auto">
                  <Card className="rankings-card slide-in-left delay-2">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0"><FaChartLine className="me-2" /> Category Distribution</h5>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Visual breakdown of your category performance</Tooltip>}
                      >
                        <span><FaInfoCircle className="text-info" /></span>
                      </OverlayTrigger>
                    </Card.Header>
                    <Card.Body className="py-4">
                      {rankingsData.categoryRankings && rankingsData.categoryRankings.length > 0 ? (
                        <div className="chart-container" style={{height: '350px'}}>
                          <Pie 
                            data={getCategoryChartData()} 
                            options={{
                              ...getCategoryChartData().options,
                              animation: {
                                duration: 1200,
                                easing: 'easeOutQuart'
                              },
                              plugins: {
                                legend: {
                                  position: 'right',
                                  labels: {
                                    boxWidth: 15,
                                    usePointStyle: true,
                                    padding: 20,
                                    font: {
                                      size: 12
                                    }
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  titleFont: {
                                    size: 14,
                                    weight: 'bold'
                                  },
                                  bodyFont: {
                                    size: 13
                                  },
                                  padding: 12,
                                  cornerRadius: 8
                                }
                              }
                            }} 
                          />
                        </div>
                      ) : (
                        <div className="rankings-loading">
                          {loading ? (
                            <div className="loader"></div>
                          ) : (
                            <Alert variant="warning" className="d-flex align-items-center">
                              <FaExclamationTriangle className="me-3 fs-4" />
                              <div>
                                <p className="mb-1 fw-bold">No category data available</p>
                                <p className="mb-0 small">Try selecting a different time period or check if categories have sales data.</p>
                              </div>
                            </Alert>
                          )}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Enhanced Category rankings table */}
              <Card className="rankings-card mb-4 slide-in-left delay-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaTrophy className="me-2" /> Category Performance Ranking</h5>
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    onClick={handleRefresh} 
                    className="btn-enhanced"
                  >
                    <FaSync className="me-1" /> Refresh
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="rankings-table table-enhanced">
                    <thead>
                      <tr>
                        <th width="70">Rank</th>
                        <th>Category</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-end">Revenue</th>
                        <th className="text-end">Products</th>
                        <th className="text-end">Engagement</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingsData.categoryRankings?.map((category, index) => (
                        <tr 
                          key={category.categoryId || index} 
                          className={`category-row table-row-animate ${index < 3 ? 'top-rank-row' : ''}`}
                        >
                          <td className="text-center">
                            {index < 3 ? (
                              <div className={`medal-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                                {renderRankWithChange(index, category)}
                              </div>
                            ) : (
                              renderRankWithChange(index, category)
                            )}
                          </td>
                          <td>
                            <div className="fw-bold">{category.categoryName}</div>
                            <small className="text-muted">ID: {category.categoryId}</small>
                          </td>
                          <td className="text-end fw-bold">{category.totalQuantity}</td>
                          <td className="text-end fw-bold">{formatCurrency(category.totalRevenue)}</td>
                          <td className="text-end fw-bold">{category.productCount}</td>
                          <td className="text-end fw-bold">{category.engagementScore || 'N/A'}</td>
                          <td className="text-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="btn-enhanced me-1"
                              onClick={() => window.location.href = `/forecast/category/${category.categoryId}`}
                            >
                              View Forecast
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!rankingsData.categoryRankings || rankingsData.categoryRankings.length === 0) && (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <Alert variant="warning" className="mb-0">
                              <FaExclamationTriangle className="me-2" />
                              No category sales data available. Please upload sales data to see rankings.
                            </Alert>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </>
      )}
      
      {/* Footer with timestamp */}
      <div className="d-flex justify-content-between mt-4">
        <small className="text-muted">
          Last updated: {rankingsData.timestamp ? new Date(rankingsData.timestamp).toLocaleString() : 'Never'}
        </small>
        <Button 
          variant="outline-secondary" 
          onClick={() => window.location.href = '/dashboard'}
        >
          Back to Dashboard
        </Button>
      </div>
      
      {/* Improvement Suggestions Modal */}
      <Modal 
        show={showSuggestionsModal} 
        onHide={() => setShowSuggestionsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaLightbulb className="me-2 text-warning" />
            Improvement Suggestions for {selectedProduct?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <div className="mb-3">
              <p><strong>Category:</strong> {selectedProduct.category}</p>
              <p><strong>Current Price:</strong> {formatCurrency(selectedProduct.price)}</p>
              <p><strong>Current Stock:</strong> {selectedProduct.currentStock} units</p>
            </div>
          )}
          
          {productSuggestions.length > 0 ? (
            <div>
              <h5>Suggested Actions:</h5>
              {productSuggestions.map((suggestion, index) => (
                <div key={index} className={`suggestion-item suggestion-${suggestion.impact} mb-3`}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">{suggestion.title}</h6>
                    {renderSuggestionImpact(suggestion.impact)}
                  </div>
                  <p>{suggestion.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="info">
              No specific suggestions available for this product.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSuggestionsModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowSuggestionsModal(false);
              window.location.href = `/forecast?productId=${selectedProduct?.productId}`;
            }}
          >
            View Forecast
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Rankings;