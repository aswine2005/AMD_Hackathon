import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaChartLine, FaBoxes, FaTags, FaDatabase, FaCloudSun, 
  FaThermometerHalf, FaWind, FaWater, FaTachometerAlt, 
  FaArrowRight, FaInfoCircle, FaCalendarDay
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import config from '../config';
import '../animations.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    salesEntries: 0
  });
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch categories count
      const categoriesRes = await axios.get(`${config.apiBaseUrl}/api/categories`);
      // Fetch products count
      const productsRes = await axios.get(`${config.apiBaseUrl}/api/products`);
      
      setStats({
        categories: categoriesRes.data.length,
        products: productsRes.data.length,
        salesEntries: 0 // We'll update this when we implement the sales data endpoint
      });
      
      // Fetch current weather (using a default city)
      const weatherRes = await axios.get(`${config.apiBaseUrl}/api/weather/current?city=Chennai`);
      setWeather(weatherRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, color, link }) => {
    const navigate = useNavigate();
    
    // Function to handle button click and navigate programmatically
    const handleNavigate = () => {
      navigate(link);
    };
    
    return (
      <Card className="enhanced-card stat-card h-100 hover-lift">
        <Card.Body className="d-flex flex-column align-items-center text-center p-4">
          <div className={`icon-bg bg-gradient-${color} p-3 rounded-circle mb-3 float`} style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <Card.Title className="fw-bold mb-1">{title}</Card.Title>
          <h2 className="stat-value fw-bold mb-4">{value}</h2>
          <div className="w-100 mt-auto">
            <Button 
              onClick={handleNavigate}
              variant={color} 
              className="enhanced-button button-hover-effect w-100"
            >
              <span>View Details</span> <FaArrowRight className="ms-2" />
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="dashboard">
      <div className="rankings-page-header slide-in-left mb-4">
        <h1 className="fw-bold">Sales Forecasting Dashboard</h1>
        <p className="text-muted">Overview of your sales metrics, analytics, and forecasting tools</p>
      </div>
      
      <Row className="mb-4 g-4">
        <Col md={8}>
          <Card className="enhanced-card slide-up">
            <Card.Header className="d-flex align-items-center">
              <FaTachometerAlt className="me-2" /> Dashboard Overview
            </Card.Header>
            <Card.Body className="p-4">
              <div className="bg-pattern position-absolute"></div>
              <h2 className="fw-bold mb-3 slide-in-left">Welcome to Sales Forecasting ML</h2>
              <p className="lead mb-4 slide-in-left delay-1">
                This application helps you predict sales based on various factors including
                people detection, weather conditions, and historical data using advanced machine learning algorithms.
              </p>
              <div className="slide-in-left delay-2">
                <Button 
                  as={Link} 
                  to="/forecast" 
                  variant="primary" 
                  className="enhanced-button me-2 button-hover-effect"
                >
                  <FaChartLine className="me-2" />
                  Generate Forecasts
                </Button>
                <Button 
                  as={Link} 
                  to="/rankings" 
                  variant="outline-primary" 
                  className="enhanced-button button-hover-effect"
                >
                  <FaChartLine className="me-2" />
                  View Rankings
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="enhanced-card h-100 slide-up delay-1">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <FaCloudSun className="me-2" /> Weather Impact
              </div>
              <small className="text-nowrap">
                <FaCalendarDay className="me-1" />
                {new Date().toLocaleDateString()}
              </small>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading weather data...</p>
                </div>
              ) : weather ? (
                <div className="text-center py-2">
                  <h3 className="fw-bold slide-up">{weather.city}</h3>
                  <div className="d-flex justify-content-center gap-4 my-3 slide-up delay-1">
                    <div className="text-center">
                      <FaThermometerHalf className="text-danger mb-2" size={24} />
                      <h4 className="mb-0">{weather.temperature}°C</h4>
                      <small>Temperature</small>
                    </div>
                    {weather.humidity && (
                      <div className="text-center">
                        <FaWater className="text-info mb-2" size={24} />
                        <h4 className="mb-0">{weather.humidity}%</h4>
                        <small>Humidity</small>
                      </div>
                    )}
                    {weather.windSpeed && (
                      <div className="text-center">
                        <FaWind className="text-primary mb-2" size={24} />
                        <h4 className="mb-0">{weather.windSpeed}</h4>
                        <small>Wind</small>
                      </div>
                    )}
                  </div>
                  <p className="badge bg-light text-dark p-2 slide-up delay-2">{weather.description}</p>
                  
                  <div className="mt-4 pt-2 border-top slide-up delay-3">
                    <h6 className="text-primary d-flex align-items-center">
                      <FaInfoCircle className="me-2" /> Business Impact
                    </h6>
                    <div className="weather-suggestions mt-3 text-start p-3 bg-light rounded">
                      {weather.temperature > 30 ? (
                        <p><strong>Hot weather alert!</strong> Consider promoting cold beverages and summer items. Expect increased foot traffic but shorter shopping sessions.</p>
                      ) : weather.temperature < 15 ? (
                        <p><strong>Cold weather alert!</strong> Promote hot beverages and comfort foods. Expect longer customer browse times.</p>
                      ) : weather.rainfall > 2 ? (
                        <p><strong>Rainy day!</strong> Expect reduced foot traffic. Consider online promotions and delivery incentives.</p>
                      ) : (
                        <p>Weather conditions are favorable for normal business operations.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaCloudSun className="text-muted mb-3" size={42} />
                  <p>Weather data unavailable</p>
                  <Button variant="outline-primary" size="sm" className="mt-2" onClick={() => fetchStats()}>
                    Retry
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <h3 className="slide-in-left delay-2 mb-4 mt-4 fw-bold">Key Metrics</h3>
      <Row className="g-4 mb-5 slide-up delay-3">
        <Col lg={3} md={6} className="mb-4">
          <StatCard 
            title="Categories" 
            value={stats.categories} 
            icon={<FaTags className="text-white" size={24} />} 
            color="success" 
            link="/categories"
          />
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <StatCard 
            title="Products" 
            value={stats.products} 
            icon={<FaBoxes className="text-white" size={28} style={{display: 'block'}} />} 
            color="info" 
            link="/products"
          />
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <StatCard 
            title="Sales Data" 
            value={stats.salesEntries} 
            icon={<FaDatabase className="text-white" size={24} />} 
            color="warning" 
            link="/sales-data"
          />
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <StatCard 
            title="Rankings" 
            value="View" 
            icon={<FaChartLine className="text-white" size={24} />} 
            color="danger" 
            link="/rankings"
          />
        </Col>
      </Row>
      
      <Row className="mt-5 slide-up delay-4">
        <Col>
          <Card className="enhanced-card">
            <Card.Header>
              <FaInfoCircle className="me-2" /> Getting Started Guide
            </Card.Header>
            <Card.Body className="p-4">
              <h3 className="fw-bold mb-4">Quick Start Guide</h3>
              
              <div className="getting-started-steps">
                <div className="step d-flex mb-4 align-items-start">
                  <div className="step-number me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px', flexShrink: 0}}>1</div>
                  <div>
                    <h5 className="fw-bold">Add Categories</h5>
                    <p>Start by adding product categories using the <Link to="/categories" className="fw-bold">Categories</Link> page. Categories help organize your products and provide better forecasting insights.</p>
                  </div>
                </div>
                
                <div className="step d-flex mb-4 align-items-start">
                  <div className="step-number me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px', flexShrink: 0}}>2</div>
                  <div>
                    <h5 className="fw-bold">Add Products</h5>
                    <p>Next, add products to your categories from the <Link to="/products" className="fw-bold">Products</Link> page. Include relevant details like price, cost, and inventory levels.</p>
                  </div>
                </div>
                
                <div className="step d-flex mb-4 align-items-start">
                  <div className="step-number me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px', flexShrink: 0}}>3</div>
                  <div>
                    <h5 className="fw-bold">Enter Sales Data</h5>
                    <p>Enter historical sales data either manually or by uploading a CSV file in the <Link to="/sales-data" className="fw-bold">Sales Data</Link> page. More historical data leads to more accurate forecasts.</p>
                  </div>
                </div>
                
                <div className="step d-flex align-items-start">
                  <div className="step-number me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px', flexShrink: 0}}>4</div>
                  <div>
                    <h5 className="fw-bold">Generate Forecasts</h5>
                    <p>Finally, generate accurate sales forecasts using our machine learning algorithms on the <Link to="/forecast" className="fw-bold">Forecast</Link> page, or check product performance on the <Link to="/rankings" className="fw-bold">Rankings</Link> page.</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-3">Need additional help with the application?</p>
                <Button as={Link} to="/ai-assistant" variant="outline-primary" className="enhanced-button">
                  <FaInfoCircle className="me-2" /> Contact AI Assistant
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
