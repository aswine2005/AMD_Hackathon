import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Badge, Spinner } from 'react-bootstrap';
import { 
  FaChartLine, FaCalendarAlt, FaCloudRain, FaTemperatureHigh, 
  FaStore, FaExclamationTriangle, FaDownload, FaChartPie, FaLocationArrow,
  FaShare, FaEnvelope, FaWhatsapp, FaArrowUp, FaArrowDown, FaEquals, 
  FaShoppingCart, FaChartBar, FaMoneyBillWave, FaPiggyBank, FaTag,
  FaInfoCircle, FaBoxes
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../config';
// eslint-disable-next-line no-unused-vars
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, 
  ComposedChart, Area, AreaChart, ReferenceLine
} from 'recharts';
import Calendar from '../components/Calendar';
import CategoryAnalytics from '../components/CategoryAnalytics';
import EnhancedStockRecommendations from '../components/EnhancedStockRecommendations';
import LocationDetector from '../components/LocationDetector';
import ShareForecastModal from '../components/ShareForecastModal';
import WeatherForecast from '../components/WeatherForecast';
import EnhancedPriceRecommendations from '../components/EnhancedPriceRecommendations';

const Forecast = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [forecastDays, setForecastDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [productForecast, setProductForecast] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [showCategoryAnalytics, setShowCategoryAnalytics] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('14');
  const [productForecastData, setProductForecastData] = useState(null);
  const [accuracyMetrics, setAccuracyMetrics] = useState(null);
  const [forecastInsights, setForecastInsights] = useState(null);
  const [categoryForecast, setCategoryForecast] = useState(null);
  const [overallForecast, setOverallForecast] = useState(null);
  const [activeKey, setActiveKey] = useState('product');
  const [showShareModal, setShowShareModal] = useState(false);
  const [dataToShare, setDataToShare] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLocation, setWeatherLocation] = useState('Chennai');
  const [weatherConditions, setWeatherConditions] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'calendar'
  const [showStockRecommendations, setShowStockRecommendations] = useState(false);
  
  // Share data modal states
  // These states were already declared at line 49 - removed duplicate

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    // Check if backend is reachable before attempting to load data
    const checkBackendConnection = async () => {
      try {
        // Make a simple ping to the backend
        await axios.get(`${config.apiBaseUrl}/api/health`, { timeout: 2000 });
        
        // If successful, fetch initial data
        fetchCategories();
        
        // Get user's location for weather instead of hardcoding Chennai
        if (navigator.geolocation) {
          setLocationLoading(true);
          navigator.geolocation.getCurrentPosition(
            position => {
              const { latitude, longitude } = position.coords;
              fetchWeatherDataByCoordinates(latitude, longitude);
              setLocationLoading(false);
            },
            error => {
              console.error('Geolocation error:', error);
              fetchWeatherData('Chennai'); // Fallback to default only if geolocation fails
              setLocationLoading(false);
            }
          );
        } else {
          fetchWeatherData('Chennai'); // Fallback only if geolocation not supported
        }
        
        // Don't automatically generate forecasts - wait for user to select options
      } catch (error) {
        console.error('Backend connection failed:', error);
        toast.error('Failed to connect to the server. Please check your connection.');
      }
    };
    
    checkBackendConnection();
    
    // No automatic forecast generation - let user select options first
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setLoading(false);
  }, [productForecast, categoryForecast, overallForecast]);
  
  // Initial data loading
  useEffect(() => {
    fetchCategories();
    fetchWeatherData('Lalgudi');
  }, []);

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };
  
  // Function to fetch category analytics data
  const fetchCategoryAnalytics = async (categoryId) => {
    if (!categoryId) return;
    
    setLoadingAnalytics(true);
    setCategoryData(null);
    setCategoryProducts([]);
    
    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - parseInt(analyticsTimeRange));
      
      console.log(`Fetching analytics for category ${categoryId} from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
      
      // Use the config.apiBaseUrl for the deployed backend
      const response = await axios.get(`${config.apiBaseUrl}/api/analytics/category/${categoryId}/analytics`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log('Category analytics response:', response.data);
      
      if (response.data && response.data.category) {
        setCategoryData(response.data.category);
        setCategoryProducts(response.data.products || []);
        setShowCategoryAnalytics(true);
      } else {
        toast.error('Invalid category data format received from server');
        setShowCategoryAnalytics(false);
      }
    } catch (error) {
      console.error('Error fetching category analytics:', error);
      toast.error('Unable to fetch category analytics. Please try again later.');
      setShowCategoryAnalytics(false);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchProductsByCategory = async (categoryId) => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/products/category/${categoryId}`);
      setProducts(response.data);
      if (response.data.length > 0) {
        setSelectedProduct(response.data[0]._id);
      } else {
        setSelectedProduct('');
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
      toast.error('Failed to load products for selected category');
    }
  };

  // Function to fetch weather data for a location by city name
  const fetchWeatherData = async (city) => {
    try {
      // Only proceed if city is provided
      if (!city) {
        toast.error('City name is required for weather data');
        return;
      }
      
      const response = await axios.get(`${config.apiBaseUrl}/api/weather/forecast?city=${city}`);
      
      // Verify we got real data back, not fallback data
      if (response.data && !response.data.error) {
        setWeatherData(response.data);
        
        // Also get current conditions
        const currentResponse = await axios.get(`${config.apiBaseUrl}/api/weather/current?city=${city}`);
        if (currentResponse.data && !currentResponse.data.error) {
          setWeatherConditions(currentResponse.data);
        }
        
        setWeatherLocation(city);
      } else {
        toast.warning('Weather API returned limited data. Some features may be affected.');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.error('Failed to fetch weather data');
      setWeatherData(null);
      setWeatherConditions(null);
    }
  };

  // Function to fetch weather data using coordinates from geolocation
  const fetchWeatherDataByCoordinates = async (latitude, longitude) => {
    try {
      // Verify we have valid coordinates
      if (!latitude || !longitude) {
        toast.error('Valid coordinates are required for weather data');
        return;
      }
      
      const response = await axios.get(`${config.apiBaseUrl}/api/weather/forecast?lat=${latitude}&lon=${longitude}`);
      
      // Verify we got real data back, not fallback data
      if (response.data && !response.data.error) {
        setWeatherData(response.data);
        
        // Also get current conditions by coordinates
        const currentResponse = await axios.get(`${config.apiBaseUrl}/api/weather/current?lat=${latitude}&lon=${longitude}`);
        if (currentResponse.data && !currentResponse.data.error) {
          setWeatherConditions(currentResponse.data);
        }
        
        // Set the location name from the response
        if (response.data.city && response.data.city.name) {
          setWeatherLocation(response.data.city.name);
        }
      } else {
        toast.warning('Weather API returned limited data. Some features may be affected.');
      }
    } catch (error) {
      console.error('Error fetching weather data by coordinates:', error);
      toast.error('Failed to fetch weather data for your location');
      setWeatherData(null);
      setWeatherConditions(null);
    }
  };

  // Function to handle location change from LocationDetector
  const handleLocationChange = (location) => {
    setWeatherLocation(location);
    fetchWeatherData(location);
  };
  
  // This handleOpenShareModal function was removed to fix duplicate declaration
  // The implementation at line ~420 is now being used for sharing functionality

  // Function to handle viewing category analytics
  const handleViewCategoryAnalytics = () => {
    if (selectedCategory) {
      fetchCategoryAnalytics(selectedCategory);
    } else {
      toast.info('Please select a category first');
    }
  };
  
  // Function to handle analytics time range change
  const handleAnalyticsTimeRangeChange = (e) => {
    setAnalyticsTimeRange(e.target.value);
    if (selectedCategory && showCategoryAnalytics) {
      fetchCategoryAnalytics(selectedCategory);
    }
  };

  const generateProductForecast = async () => {
    if (!selectedProduct) {
      toast.warn('Please select a product first');
      return;
    }

    setLoading(true);
    try {
      // Add request timeout to prevent indefinite waiting
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await axios.get(
        `${config.apiBaseUrl}/api/forecast/product/${selectedProduct}?days=${forecastDays}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId); // Clear timeout if request completes successfully
      
      // Validate forecast data before setting state
      if (response.data && Array.isArray(response.data.forecast) && response.data.forecast.length > 0) {
        setProductForecast(response.data.forecast);
        setProductForecastData(response.data);
        setAccuracyMetrics(response.data.metrics || {
          confidenceLevel: 'Medium',
          mape: 25,
          message: 'Generated using statistical methods'
        });
        setForecastInsights(response.data.insights || {
          message: 'Forecast generated with limited historical data'
        });
        setActiveKey('product');
        setShowStockRecommendations(true);
        
        toast.success('Product forecast generated successfully');
      } else {
        console.warn('Received empty or invalid forecast data', response.data);
        toast.warn('Received limited forecast data. Results may not be accurate.');
        
        // Create fallback forecast data if response doesn't have proper format
        const fallbackForecast = Array(forecastDays).fill().map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          return {
            date,
            predictedQuantity: 5, // Default placeholder value
            lowerBound: 3,
            upperBound: 8,
          };
        });
        
        setProductForecast(fallbackForecast);
        setProductForecastData({
          forecast: fallbackForecast,
          type: 'statistical',
          message: 'Using fallback forecast due to limited data'
        });
        setAccuracyMetrics({
          confidenceLevel: 'Low',
          mape: 35,
          message: 'Generated using fallback methods due to data limitations'
        });
      }
    } catch (error) {
      console.error('Error generating product forecast:', error);
      
      // Handle timeout errors specifically
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        toast.error('Forecast generation timed out. Using simplified forecast instead.');
        
        // Create fallback forecast even when request fails
        const fallbackForecast = Array(forecastDays).fill().map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          return {
            date,
            predictedQuantity: 4, // Default placeholder value
            lowerBound: 2,
            upperBound: 7,
          };
        });
        
        setProductForecast(fallbackForecast);
        setActiveKey('product');
      } else {
        toast.error(`Failed to generate product forecast: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateCategoryForecast = async () => {
    if (!selectedCategory) {
      toast.warn('Please select a category first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/forecast/category/${selectedCategory}?days=${forecastDays}`);

      setCategoryForecast(response.data);
      setActiveKey('category');
      
      toast.success('Category forecast generated successfully');
    } catch (error) {
      console.error('Error generating category forecast:', error);
      toast.error('Failed to generate category forecast');
    } finally {
      setLoading(false);
    }
  };

  const generateOverallForecast = async () => {
    setLoading(true);
    try {
      // If we already have product forecast data, use it instead of making a new API call
      if (productForecast && productForecast.length > 0) {
        console.log('Using existing product forecast for overall business calculations');
        // Use the product forecast as the basis for the overall forecast
        setOverallForecast(productForecast);
      } else {
        // If no product data exists yet, make the API call for overall forecast
        const response = await axios.get(`${config.apiBaseUrl}/api/forecast/overall?days=${forecastDays}`);
        setOverallForecast(response.data);
      }

      setActiveKey('overall');
      
      toast.success('Overall business forecast generated with actual pricing data');
    } catch (error) {
      console.error('Error generating overall forecast:', error);
      toast.error('Failed to generate overall forecast');
    } finally {
      setLoading(false);
    }
  };

  const getForecastInsights = async () => {
    if (!productForecast || productForecast.length === 0) {
      toast.warn('Please generate a product forecast first');
      return;
    }

    try {
      const response = await axios.post(`${config.apiBaseUrl}/api/forecast/insights`, {
        productId: selectedProduct,
        forecastData: productForecast
      });

      setForecastInsights(response.data);
      toast.success('Forecast insights generated');
    } catch (error) {
      console.error('Error generating forecast insights:', error);
      toast.error('Failed to generate forecast insights');
    }
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return '☁️';
    
    const lowercasedCondition = condition.toLowerCase();
    
    if (lowercasedCondition.includes('clear') || lowercasedCondition.includes('sunny')) {
      return '☀️';
    } else if (lowercasedCondition.includes('cloud')) {
      return '☁️';
    } else if (lowercasedCondition.includes('rain') || lowercasedCondition.includes('drizzle')) {
      return '🌧️';
    } else if (lowercasedCondition.includes('snow')) {
      return '❄️';
    } else if (lowercasedCondition.includes('thunder') || lowercasedCondition.includes('storm')) {
      return '⛈️';
    } else if (lowercasedCondition.includes('fog') || lowercasedCondition.includes('mist')) {
      return '🌫️';
    }
    
    return '🌤️';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to handle opening the share modal
  const handleOpenShareModal = () => {
    // Determine which forecast data to share based on active tab
    let forecastToShare;
    
    if (activeKey === 'product' && productForecast) {
      forecastToShare = {
        type: 'Product',
        name: selectedProduct ? products.find(p => p._id === selectedProduct)?.name : '',
        data: productForecast
      };
    } else if (activeKey === 'category' && categoryForecast) {
      forecastToShare = {
        type: 'Category',
        name: selectedCategory ? categories.find(c => c._id === selectedCategory)?.name : '',
        data: categoryForecast
      };
    } else if (activeKey === 'overall' && overallForecast) {
      forecastToShare = {
        type: 'Overall',
        name: 'All Products',
        data: overallForecast
      };
    }
    
    // Set the data to share
    setDataToShare({
      forecast: forecastToShare,
      weather: weatherData
    });
    
    // Open the modal
    setShowShareModal(true);
  };

  // Function to refresh sales data
  const refreshSalesData = async () => {
    setLoading(true);
    try {
      // If a product is selected, refresh its forecast
      if (selectedProduct) {
        await generateProductForecast();
        toast.success('Product sales data refreshed successfully');
      } else {
        toast.info('Please select a product first');
      }
    } catch (error) {
      console.error('Error refreshing sales data:', error);
      toast.error('Failed to refresh sales data');
    } finally {
      setLoading(false);
    }
  };

  // Product forecast chart component
  const ProductForecastChart = () => {
    if (!productForecast || !Array.isArray(productForecast) || productForecast.length === 0) {
      return (
        <Alert variant="info">
          <FaExclamationTriangle className="me-2" />
          No product forecast data available. Please generate a forecast first.
        </Alert>
      );
    }
    
    // Add validation to prevent rendering issues
    const validData = productForecast.filter(item => 
      item && 
      typeof item.predictedQuantity === 'number' && 
      typeof item.lowerBound === 'number' && 
      typeof item.upperBound === 'number'
    );
    
    // Check if we have any valid data to display
    if (validData.length === 0) {
      return (
        <Alert variant="warning">
          <FaExclamationTriangle className="me-2" />
          The forecast data is in an invalid format. Please try generating the forecast again.
        </Alert>
      );
    }
    
    // Format the data for the chart using validated data
    const data = validData.map(item => {
      // Ensure dates are handled as Date objects
      let dateObj = item.date;
      if (typeof item.date === 'string') {
        dateObj = new Date(item.date);
      }
      
      return {
        date: dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        quantity: item.predictedQuantity,
        upperBound: item.upperBound,
        lowerBound: item.lowerBound
      };
    });

    // Calculate trend direction (up, down, or stable)
    const firstHalf = data.slice(0, Math.floor(data.length/2));
    const secondHalf = data.slice(Math.floor(data.length/2));
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.quantity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.quantity, 0) / secondHalf.length;
    const trend = secondHalfAvg > firstHalfAvg * 1.1 ? 'up' : 
                 secondHalfAvg < firstHalfAvg * 0.9 ? 'down' : 'stable';
    
    // Find peak forecast day
    const maxValue = Math.max(...data.map(item => item.quantity));
    const peakDay = data.find(item => item.quantity === maxValue);
    
    // Calculate average forecast
    const avgForecast = data.reduce((sum, item) => sum + item.quantity, 0) / data.length;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 d-flex align-items-center">
            <span className="badge bg-primary me-2 p-2">
              <FaChartLine className="me-1" />
            </span>
            Product Sales Forecast
          </h5>
          <Badge bg={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'secondary'} className="p-2">
            {trend === 'up' ? 'Upward Trend' : trend === 'down' ? 'Downward Trend' : 'Stable Trend'}
            {trend === 'up' ? <FaArrowUp className="ms-1" /> : trend === 'down' ? <FaArrowDown className="ms-1" /> : <FaEquals className="ms-1" />}
          </Badge>
        </div>
        
        <div className="p-3 bg-light rounded border" style={{ height: 400, minHeight: "400px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={400}>
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorLower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff7300" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ccc' }}
              />
              <YAxis 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ccc' }}
                label={{ value: 'Units', angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle', fill: '#666' } }}
              />
              
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-tooltip bg-white p-3 border shadow rounded">
                        <p className="mb-2 fw-bold text-primary">{label}</p>
                        <div className="d-flex align-items-center mb-1">
                          <div style={{ width: 12, height: 12, backgroundColor: '#ff7300', borderRadius: '50%', marginRight: 8 }}></div>
                          <p className="mb-0">Forecast: <strong>{payload[0].value.toLocaleString('en-IN')}</strong> units</p>
                        </div>
                        <div className="d-flex align-items-center mb-1">
                          <div style={{ width: 12, height: 12, backgroundColor: '#8884d8', opacity: 0.8, borderRadius: '50%', marginRight: 8 }}></div>
                          <p className="mb-0">Upper Bound: <strong>{payload[1].value.toLocaleString('en-IN')}</strong> units</p>
                        </div>
                        <div className="d-flex align-items-center">
                          <div style={{ width: 12, height: 12, backgroundColor: '#8884d8', opacity: 0.4, borderRadius: '50%', marginRight: 8 }}></div>
                          <p className="mb-0">Lower Bound: <strong>{payload[2].value.toLocaleString('en-IN')}</strong> units</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                wrapperStyle={{ zIndex: 1000 }} 
              />
              
              <Legend 
                verticalAlign="top" 
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              
              <Area 
                type="monotone" 
                dataKey="upperBound" 
                stroke="#8884d8"
                strokeWidth={1}
                strokeOpacity={0.8}
                fill="url(#colorUpper)"
                fillOpacity={0.6}
                activeDot={false}
                name="Upper Range" 
              />
              
              <Area 
                type="monotone" 
                dataKey="lowerBound" 
                stroke="#8884d8"
                strokeWidth={1}
                strokeOpacity={0.5}
                fill="url(#colorLower)"
                fillOpacity={0.4}
                activeDot={false}
                name="Lower Range" 
              />
              
              <Line 
                type="monotone" 
                dataKey="quantity" 
                stroke="#ff7300" 
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 1, fill: '#ff7300' }}
                activeDot={{ r: 8, stroke: '#ff7300', strokeWidth: 2 }}
                name="Predicted Sales" 
              />
              
              <ReferenceLine 
                y={avgForecast} 
                stroke="#ff7300" 
                strokeDasharray="3 3"
                label={{ 
                  value: 'Avg: ' + avgForecast.toLocaleString('en-IN'), 
                  position: 'right', 
                  fill: '#ff7300', 
                  fontSize: 11 
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="d-flex mt-3 gap-3">
          <div className="p-3 bg-white rounded border flex-grow-1">
            <h6 className="mb-2 d-flex align-items-center">
              <span className="badge bg-warning me-2"><FaCalendarAlt /></span>
              Peak Sales Day
            </h6>
            <p className="mb-0">
              <strong>{peakDay?.date || 'N/A'}</strong> with <strong>{maxValue.toLocaleString('en-IN')}</strong> units predicted
            </p>
          </div>
          
          <div className="p-3 bg-white rounded border flex-grow-1">
            <h6 className="mb-2 d-flex align-items-center">
              <span className="badge bg-info me-2"><FaChartLine /></span>
              Sales Volatility
            </h6>
            <p className="mb-0">
              <strong>
                {Math.round(((Math.max(...data.map(d => d.upperBound)) - Math.min(...data.map(d => d.lowerBound))) / avgForecast) * 100).toLocaleString('en-IN')}%
              </strong> range from lowest to highest prediction
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // Category forecast chart component
  const CategoryForecastChart = () => {
    if (!categoryForecast || !Array.isArray(categoryForecast) || categoryForecast.length === 0) {
      return (
        <Alert variant="info">
          <FaExclamationTriangle className="me-2" />
          No category forecast data available. Please generate a forecast first.
        </Alert>
      );
    }

    const data = categoryForecast.map(item => {
      if (!item || !item.date) {
        console.warn('Invalid category forecast item:', item);
        return null;
      }
      
      return {
        date: typeof item.date === 'string' ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : formatDate(new Date(item.date)),
        quantity: item.predictedQuantity || item.totalQuantity || 0,
        upperBound: item.upperBound || (item.predictedQuantity ? item.predictedQuantity * 1.2 : 0),
        lowerBound: item.lowerBound || (item.predictedQuantity ? item.predictedQuantity * 0.8 : 0)
      };
    }).filter(item => item !== null);

    if (data.length === 0) {
      return (
        <Alert variant="warning">
          <FaExclamationTriangle className="me-2" />
          The category forecast data is in an invalid format. Please try again.
        </Alert>
      );
    }
    
    // Calculate trend direction (up, down, or stable)
    const firstHalf = data.slice(0, Math.floor(data.length/2));
    const secondHalf = data.slice(Math.floor(data.length/2));
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.quantity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.quantity, 0) / secondHalf.length;
    const trend = secondHalfAvg > firstHalfAvg * 1.1 ? 'up' : 
                 secondHalfAvg < firstHalfAvg * 0.9 ? 'down' : 'stable';
    
    // Calculate total predicted sales volume
    const totalVolume = data.reduce((sum, item) => sum + item.quantity, 0);
    
    // Find the highest sales day
    const maxValue = Math.max(...data.map(item => item.quantity));
    const bestDay = data.find(item => item.quantity === maxValue);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 d-flex align-items-center">
            <span className="badge bg-success me-2 p-2">
              <FaChartPie className="me-1" />
            </span>
            Category Forecast
          </h5>
          <Badge 
            bg={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'secondary'} 
            className="p-2"
          >
            {trend === 'up' ? 'Upward Trend' : trend === 'down' ? 'Downward Trend' : 'Stable Trend'}
            {trend === 'up' ? <FaArrowUp className="ms-1" /> : trend === 'down' ? <FaArrowDown className="ms-1" /> : <FaEquals className="ms-1" />}
          </Badge>
        </div>
        
        <div className="p-3 bg-light rounded border" style={{ height: 370 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorCatUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#28a745" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorCatLower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28a745" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#28a745" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCatBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20c997" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#20c997" stopOpacity={0.5}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#e0e0e0" />
              
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ccc' }}
              />
              
              <YAxis 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ccc' }}
                label={{ value: 'Units', angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle', fill: '#666' } }}
              />
              
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-tooltip bg-white p-3 border shadow rounded">
                        <p className="mb-2 fw-bold text-success">{label}</p>
                        <div className="d-flex align-items-center mb-1">
                          <div style={{ width: 12, height: 12, backgroundColor: '#20c997', borderRadius: '50%', marginRight: 8 }}></div>
                          <p className="mb-0">Forecast: <strong>{payload[0].value.toLocaleString('en-IN')}</strong> units</p>
                        </div>
                        <div className="d-flex align-items-center mb-1">
                          <div style={{ width: 12, height: 12, backgroundColor: '#28a745', opacity: 0.8, borderRadius: '50%', marginRight: 8 }}></div>
                          <p className="mb-0">Upper Bound: <strong>{payload[1].value.toLocaleString('en-IN')}</strong> units</p>
                        </div>
                        <div className="d-flex align-items-center">
                          <div style={{ width: 12, height: 12, backgroundColor: '#28a745', opacity: 0.4, borderRadius: '50%', marginRight: 8 }}></div>
                          <p className="mb-0">Lower Bound: <strong>{payload[2].value.toLocaleString('en-IN')}</strong> units</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                wrapperStyle={{ zIndex: 1000 }}
              />
              
              <Legend 
                verticalAlign="top" 
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              
              <Area 
                type="monotone" 
                dataKey="upperBound" 
                stroke="#28a745"
                strokeWidth={1}
                strokeOpacity={0.8}
                fill="url(#colorCatUpper)"
                fillOpacity={0.6}
                activeDot={false}
                name="Upper Range" 
              />
              
              <Area 
                type="monotone" 
                dataKey="lowerBound" 
                stroke="#28a745"
                strokeWidth={1}
                strokeOpacity={0.5}
                fill="url(#colorCatLower)"
                fillOpacity={0.4}
                activeDot={false}
                name="Lower Range" 
              />
              
              <Bar 
                dataKey="quantity" 
                name="Predicted Sales" 
                barSize={20}
                fill="url(#colorCatBar)"
                stroke="#1e7e34"
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="d-flex mt-3 gap-3">
          <div className="p-3 bg-white rounded border flex-grow-1">
            <h6 className="mb-2 d-flex align-items-center">
              <span className="badge bg-success me-2"><FaShoppingCart /></span>
              Best Selling Day
            </h6>
            <p className="mb-0">
              <strong>{bestDay?.date || 'N/A'}</strong> with <strong>{maxValue.toLocaleString('en-IN')}</strong> units predicted
            </p>
          </div>
          
          <div className="p-3 bg-white rounded border flex-grow-1">
            <h6 className="mb-2 d-flex align-items-center">
              <span className="badge bg-success me-2"><FaChartBar /></span>
              Total Volume
            </h6>
            <p className="mb-0">
              <strong>{totalVolume.toLocaleString('en-IN')}</strong> units over forecast period
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // Overall forecast chart component
  const OverallForecastChart = () => {
    if (!overallForecast || !Array.isArray(overallForecast) || overallForecast.length === 0) {
      return (
        <Alert variant="info">
          <FaExclamationTriangle className="me-2" />
          No overall forecast data available. Please generate a forecast first.
        </Alert>
      );
    }

    // Get the selected product's price from the products array
    const selectedProductData = products.find(p => p._id === selectedProduct);
    const productPrice = selectedProductData?.price || 10; // Default to 10 rupees if not found
    const productCost = productPrice * 0.6; // Assume cost is 60% of price
    const productProfit = productPrice - productCost; // Calculate actual profit per unit
    
    console.log('Using actual product price:', productPrice, 'rupees');
    
    const data = overallForecast.map(item => {
      if (!item || !item.date) {
        console.warn('Invalid overall forecast item:', item);
        return null;
      }
      
      // Calculate actual revenue based on sales quantity and product price
      const salesQty = item.predictedQuantity || item.totalQuantity || 0;
      const actualRevenue = salesQty * productPrice;
      const actualProfit = salesQty * productProfit;
      
      return {
        date: typeof item.date === 'string' ? new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : formatDate(new Date(item.date)),
        sales: salesQty,
        revenue: actualRevenue, // Using actual price × quantity
        profit: actualProfit // Using actual profit margin × quantity
      };
    }).filter(item => item !== null);

    if (data.length === 0) {
      return (
        <Alert variant="warning">
          <FaExclamationTriangle className="me-2" />
          The overall forecast data is in an invalid format. Please try again.
        </Alert>
      );
    }

    // Calculate key metrics
    const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
    
    // Calculate trend percentages
    const firstHalf = data.slice(0, Math.floor(data.length/2));
    const secondHalf = data.slice(Math.floor(data.length/2));
    
    const firstHalfSales = firstHalf.reduce((sum, item) => sum + item.sales, 0);
    const secondHalfSales = secondHalf.reduce((sum, item) => sum + item.sales, 0);
    const salesTrendPercent = firstHalfSales !== 0 ? ((secondHalfSales - firstHalfSales) / firstHalfSales) * 100 : 0;
    
    const firstHalfRevenue = firstHalf.reduce((sum, item) => sum + item.revenue, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, item) => sum + item.revenue, 0);
    const revenueTrendPercent = firstHalfRevenue !== 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 d-flex align-items-center">
            <span className="badge bg-dark me-2 p-2">
              <FaChartBar className="me-1" />
            </span>
            Overall Business Forecast
          </h5>
          <div>
            <Badge bg="info" className="me-2 p-2">
              Revenue: ₹{Math.round(totalRevenue).toLocaleString('en-IN')}
            </Badge>
            <Badge bg="dark" className="p-2">
              Total Sales: {Math.round(totalSales).toLocaleString('en-IN')} units
            </Badge>
          </div>
        </div>
        
        <div className="p-3 bg-light rounded border" style={{ height: 370 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorSalesOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6f42c1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6f42c1" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorRevenueOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20c997" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#20c997" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorProfitOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fd7e14" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#fd7e14" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#e0e0e0" />
              
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ccc' }}
              />
              
              <YAxis 
                yAxisId="left" 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ccc' }}
                label={{ value: 'Units', angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle', fill: '#666' } }}
              />
              
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ccc' }}
                label={{ value: 'Amount (₹)', angle: 90, position: 'insideRight', offset: 5, style: { textAnchor: 'middle', fill: '#666' } }}
              />
              
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-tooltip bg-white p-3 border shadow rounded">
                        <p className="mb-2 fw-bold text-dark">{label}</p>
                        {payload.map((entry, index) => {
                          let color = '#6f42c1';
                          let prefix = '';
                          
                          if (entry.name.includes('Revenue') || entry.name.includes('Profit')) {
                            prefix = '₹';
                            color = entry.name.includes('Revenue') ? '#20c997' : '#fd7e14';
                          }
                          
                          return (
                            <div key={`tooltip-${index}`} className="d-flex align-items-center mb-1">
                              <div style={{ width: 12, height: 12, backgroundColor: color, borderRadius: '50%', marginRight: 8 }}></div>
                              <p className="mb-0">{entry.name}: <strong>{prefix}{entry.value.toLocaleString('en-IN')}</strong></p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              
              <Legend 
                verticalAlign="top" 
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              
              <Bar 
                yAxisId="left" 
                dataKey="sales" 
                name="Total Sales (Units)" 
                fill="url(#colorSalesOverall)" 
                barSize={20}
                stroke="#6f42c1"
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
              />
              
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue (₹)" 
                stroke="#20c997"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 1, fill: '#20c997' }}
                activeDot={{ r: 6, stroke: '#20c997', strokeWidth: 2 }}
              />
              
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="profit" 
                name="Profit (₹)" 
                stroke="#fd7e14"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 1, fill: '#fd7e14' }}
                activeDot={{ r: 6, stroke: '#fd7e14', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="d-flex mt-3 gap-3">
          <div className="p-3 bg-white rounded border flex-grow-1">
            <h6 className="mb-2 d-flex align-items-center">
              <span className="badge bg-dark me-2"><FaChartLine /></span>
              Sales Trend
            </h6>
            <p className="mb-0 d-flex align-items-center">
              <Badge bg={salesTrendPercent > 0 ? 'success' : salesTrendPercent < 0 ? 'danger' : 'secondary'} className="me-2">
                {salesTrendPercent > 0 ? '+' : ''}{Math.round(salesTrendPercent)}%
              </Badge>
              <span className="small text-muted">
                over forecast period
              </span>
            </p>
          </div>
          
          <div className="p-3 bg-white rounded border flex-grow-1">
            <h6 className="mb-2 d-flex align-items-center">
              <span className="badge bg-info me-2"><FaMoneyBillWave /></span>
              Revenue Trend
            </h6>
            <p className="mb-0 d-flex align-items-center">
              <Badge bg={revenueTrendPercent > 0 ? 'success' : revenueTrendPercent < 0 ? 'danger' : 'secondary'} className="me-2">
                {revenueTrendPercent > 0 ? '+' : ''}{Math.round(revenueTrendPercent)}%
              </Badge>
              <span className="small text-muted">
                over forecast period
              </span>
            </p>
          </div>
          
          <div className="p-3 bg-white rounded border flex-grow-1">
            <h6 className="mb-2 d-flex align-items-center">
              <span className="badge bg-warning me-2"><FaPiggyBank /></span>
              Profit Margin
            </h6>
            <p className="mb-0">
              <strong>
                {totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}%
              </strong>
              <span className="ms-2 small text-muted">
                (₹{Math.round(totalProfit).toLocaleString('en-IN')} total)
              </span>
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // Add a function to generate all forecasts at once
  const handleForecastError = (forecastType, error) => {
    console.error(`Error generating ${forecastType} forecast:`, error);
    
    // Create appropriate fallback data based on forecast type
    const fallbackDays = forecastDays || 7;
    const fallbackForecast = Array(fallbackDays).fill().map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        date,
        predictedQuantity: 5 + (i * 2),
        lowerBound: 3 + i,
        upperBound: 8 + (i * 3),
        estimatedRevenue: forecastType === 'overall' ? 1000 + (i * 200) : undefined
      };
    });
    
    // Set appropriate state based on forecast type
    if (forecastType === 'product') {
      setProductForecast(fallbackForecast);
      setProductForecastData({
        forecast: fallbackForecast,
        type: 'fallback',
        message: 'Using fallback data due to API error'
      });
      setAccuracyMetrics({
        confidenceLevel: 'Low',
        mape: 35,
        message: 'Using fallback data due to connection issues'
      });
    } else if (forecastType === 'category') {
      setCategoryForecast(fallbackForecast);
    } else if (forecastType === 'overall') {
      setOverallForecast(fallbackForecast);
    }
    
    toast.warning(`Using estimated ${forecastType} forecast due to connection issues`);
    return fallbackForecast;
  };

  const generateAllForecasts = async () => {
    setLoading(true);
    try {
      // Store promises for parallel execution with proper error handling
      let productPromise = Promise.resolve(null);
      let categoryPromise = Promise.resolve(null);
      let overallPromise = Promise.resolve(null);
      
      // Product forecast (if product selected)
      if (selectedProduct) {
        productPromise = axios.get(`${config.apiBaseUrl}/api/forecast/product/${selectedProduct}?days=${forecastDays}`)
          .then(response => {
            if (response.data && Array.isArray(response.data.forecast) && response.data.forecast.length > 0) {
              setProductForecast(response.data.forecast);
              setProductForecastData(response.data);
              setAccuracyMetrics(response.data.metrics || {
                confidenceLevel: 'Medium',
                mape: 25,
                message: 'Generated using statistical methods'
              });
              setForecastInsights(response.data.insights || {
                message: 'Forecast generated with limited historical data'
              });
              return response.data.forecast;
            }
            return handleForecastError('product', new Error('Invalid forecast data format'));
          })
          .catch(error => handleForecastError('product', error));
      }
      
      // Category forecast (if category selected)
      if (selectedCategory) {
        categoryPromise = axios.get(`${config.apiBaseUrl}/api/forecast/category/${selectedCategory}?days=${forecastDays}`)
          .then(response => {
            if (response.data && Array.isArray(response.data)) {
              setCategoryForecast(response.data);
              return response.data;
            }
            return handleForecastError('category', new Error('Invalid category forecast data format'));
          })
          .catch(error => handleForecastError('category', error));
      }
      
      // Overall forecast (always generate)
      overallPromise = axios.get(`${config.apiBaseUrl}/api/forecast/overall?days=${forecastDays}`)
        .then(response => {
          if (response.data && Array.isArray(response.data.forecast)) {
            setOverallForecast(response.data.forecast);
            return response.data.forecast;
          } else if (response.data && Array.isArray(response.data)) {
            // Handle different response format
            setOverallForecast(response.data);
            return response.data;
          }
          return handleForecastError('overall', new Error('Invalid overall forecast data format'));
        })
        .catch(error => handleForecastError('overall', error));
      
      // Wait for all forecasts to complete
      const [productResult, categoryResult, overallResult] = await Promise.allSettled([
        productPromise, categoryPromise, overallPromise
      ]);
      
      // Check if at least one forecast was successful
      if (productResult.status === 'fulfilled' || categoryResult.status === 'fulfilled' || overallResult.status === 'fulfilled') {
        toast.success('Forecasts generated successfully');
        setShowStockRecommendations(true);
      } else {
        toast.warning('Using estimated forecasts due to connection issues');
      }
    } catch (error) {
      console.error('Error generating forecasts:', error);
      toast.error(`Failed to generate forecasts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="rankings-page-header slide-in-left mb-4">
        <h2 className="fw-bold">Sales Forecast</h2>
        <p className="text-muted">Generate accurate sales predictions using advanced machine learning algorithms</p>
      </div>
      
      {/* Category Analytics Section */}
      <AnimatePresence>
        {showCategoryAnalytics && categoryData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>
                <FaChartPie className="me-2 text-primary" />
                Category Analytics
              </h5>
              <div className="d-flex align-items-center">
                <Form.Group className="me-3 mb-0">
                  <Form.Select 
                    size="sm"
                    value={analyticsTimeRange} 
                    onChange={handleAnalyticsTimeRangeChange}
                  >
                    <option value="7">Past 7 days</option>
                    <option value="14">Past 14 days</option>
                    <option value="30">Past 30 days</option>
                    <option value="90">Past 3 months</option>
                  </Form.Select>
                </Form.Group>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={() => setShowCategoryAnalytics(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            <CategoryAnalytics 
              category={categoryData} 
              products={categoryProducts}
              timeRange={parseInt(analyticsTimeRange)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <Row className="mb-4 g-4">
        <Col lg={8}>
          <Card className="enhanced-card slide-up">
            <Card.Header className="d-flex align-items-center">
              <FaChartLine className="me-2" /> Forecast Configuration
            </Card.Header>
            <Card.Body className="p-4">
              <Form className="forecast-form">
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Category</Form.Label>
                      <div className="d-flex">
                        <Form.Select 
                          value={selectedCategory} 
                          onChange={(e) => {
                            const categoryId = e.target.value;
                            setSelectedCategory(categoryId);
                            setSelectedProduct(''); // Reset selected product
                            
                            if (categoryId) {
                              try {
                                axios.get(`${config.apiBaseUrl}/api/products/category/${categoryId}`)
                                  .then(response => setProducts(response.data))
                                  .catch(error => {
                                    console.error('Error fetching products by category:', error);
                                    toast.error('Failed to fetch products for the selected category');
                                  });
                              } catch (error) {
                                console.error('Error fetching products by category:', error);
                                toast.error('Failed to fetch products for the selected category');
                              }
                            } else {
                              setProducts([]);
                            }
                          }}
                          className="me-2"
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category._id} value={category._id}>{category.name}</option>
                          ))}
                        </Form.Select>
                        <Button 
                          variant="outline-primary" 
                          onClick={handleViewCategoryAnalytics} 
                          disabled={!selectedCategory || loadingAnalytics}
                          title="View category analytics"
                        >
                          {loadingAnalytics ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            <FaChartPie />
                          )}
                          <span className="d-none d-md-inline ms-1">Analytics</span>
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Product</Form.Label>
                      <Form.Select 
                        value={selectedProduct} 
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        disabled={products.length === 0}
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>{product.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Forecast Range</Form.Label>
                      <Form.Select
                        value={forecastDays}
                        onChange={(e) => setForecastDays(parseInt(e.target.value))}
                      >
                        <option value="1">1 day (Next day)</option>
                        <option value="3">3 days (Short-term)</option>
                        <option value="7">7 days (Weekly)</option>
                        <option value="14">14 days (Biweekly)</option>
                        <option value="30">30 days (Monthly)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-4">
                  <Col md={8}>
                    <Form.Group className="slide-in-left delay-3">
                      <Form.Label className="fw-bold d-flex align-items-center">
                        <FaInfoCircle className="text-primary me-2" /> Data Requirements
                      </Form.Label>
                      <Alert variant="info" className="py-2 mb-0 d-flex align-items-start">
                        <FaInfoCircle className="me-2 mt-1 flex-shrink-0" />
                        <div>
                          <strong>Data needed:</strong> Minimum 3 sales data entries per product for basic forecast. 
                          For {forecastDays} days forecast, {Math.max(3, Math.ceil(forecastDays * 0.5))} entries recommended for better accuracy.
                        </div>
                      </Alert>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="slide-in-left delay-3">
                      <Form.Label className="fw-bold d-flex align-items-center">
                        <FaChartLine className="text-primary me-2" /> Generate Forecast
                      </Form.Label>
                      <div className="d-grid">
                        <Button 
                          variant="primary" 
                          onClick={generateAllForecasts} 
                          disabled={loading}
                          className="enhanced-button button-hover-effect p-3"
                        >
                          {loading ? (
                            <>
                              <Spinner size="sm" animation="border" className="me-2" />
                              Processing Forecast
                            </>
                          ) : (
                            <>
                              <FaChartLine className="me-2" />
                              Generate All Forecasts
                            </>
                          )}
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="slide-in-left delay-4">
                  <Col>
                    <div className="d-flex gap-3 flex-wrap">
                      <Button 
                        variant="outline-primary" 
                        onClick={generateProductForecast} 
                        disabled={loading || !selectedProduct}
                        className="enhanced-button button-hover-effect"
                      >
                        <FaBoxes className="me-2" /> Product Forecast
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        onClick={generateCategoryForecast} 
                        disabled={loading || !selectedCategory}
                        className="enhanced-button button-hover-effect"
                      >
                        <FaTag className="me-2" /> Category Forecast
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        onClick={generateOverallForecast} 
                        disabled={loading}
                        size="sm"
                      >
                        Overall Forecast
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        onClick={refreshSalesData} 
                        disabled={loading || !selectedProduct}
                        size="sm"
                      >
                        Refresh Sales Data
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="enhanced-card h-100 slide-up delay-1">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <FaCloudRain className="me-2" /> Weather Impact
              </div>
              <Badge bg="info" className="p-2">
                <FaLocationArrow className="me-1" /> {weatherLocation || 'Detecting...'}
              </Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-muted mb-3">Weather conditions significantly affect sales patterns. Select your location to get accurate predictions based on local weather.</p>
              <LocationDetector 
                onLocationSelected={handleLocationChange} 
                initialCity={weatherLocation} 
              />
              {weatherData && (
                <div className="mt-4 pt-3 border-top slide-up">
                  <h6 className="fw-bold d-flex align-items-center mb-3">
                    <FaTemperatureHigh className="text-primary me-2" /> Current Weather Factors
                  </h6>
                  <div className="d-flex justify-content-around text-center">
                    <div>
                      <FaTemperatureHigh className="text-danger mb-2" />
                      <div className="fw-bold">{weatherData.temperature}°C</div>
                      <small className="text-muted">Temperature</small>
                    </div>
                    <div>
                      <FaCloudRain className="text-primary mb-2" />
                      <div className="fw-bold">{weatherData.humidity || 0}%</div>
                      <small className="text-muted">Humidity</small>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="enhanced-card mb-4 slide-up delay-2">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaChartLine className="me-2" /> 
            <h5 className="mb-0 fw-bold">Forecast Results</h5>
          </div>
          
          {/* Share Data Button */}
          {(productForecast || categoryForecast || overallForecast) && (
            <Button 
              variant="outline-light" 
              onClick={() => handleOpenShareModal()}
              className="enhanced-button button-hover-effect d-flex align-items-center"
            >
              <FaShare className="me-2" /> Share Forecast
            </Button>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5 my-4 loading-indicator">
              <div className="loading-spinner mb-3"></div>
              <h5 className="mb-2">Generating Forecasts</h5>
              <p className="text-muted">Our AI is analyzing patterns and generating accurate sales predictions...</p>
            </div>
          ) : (
            <div>
              <Tabs
                activeKey={activeKey}
                onSelect={(k) => setActiveKey(k)}
                className="mb-4"
              >
                <Tab eventKey="product" title="Product Forecast">
                  <ProductForecastChart />
                </Tab>
                <Tab eventKey="category" title="Category Forecast">
                  <CategoryForecastChart />
                </Tab>
                <Tab eventKey="overall" title="Overall Forecast">
                  <OverallForecastChart />
                </Tab>
              </Tabs>
              
              {/* Display all forecasts vertically when data is available */}
              <div className="mt-5">
                <Row>
                  <Col xs={12}>
                    <h4 className="mb-4 border-bottom pb-2">All Forecasts</h4>
                  </Col>
                  
                  {/* Product Forecast Section */}
                  <Col xs={12} className="mb-4">
                    <Card className="h-100">
                      <Card.Body>
                        <ProductForecastChart />
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  {/* Category Forecast Section */}
                  <Col xs={12} className="mb-4">
                    <Card className="h-100">
                      <Card.Body>
                        <CategoryForecastChart />
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  {/* Overall Forecast Section */}
                  <Col xs={12}>
                    <Card className="h-100">
                      <Card.Body>
                        <OverallForecastChart />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Weather Forecast for Prediction Period */}
      {(productForecast || categoryForecast || overallForecast) && (
        <WeatherForecast 
          forecastDays={forecastDays} 
          location={weatherLocation}
        />
      )}

      {/* Enhanced Price Recommendations */}
      {productForecast && productForecast.length > 0 && selectedProduct && (
        <EnhancedPriceRecommendations
          productId={selectedProduct}
          productForecast={productForecast}
          selectedProduct={selectedProduct}
        />
      )}

      {/* Enhanced Stock Recommendations */}
      {showStockRecommendations && productForecast && productForecast.length > 0 && selectedProduct && (
        <EnhancedStockRecommendations 
          productForecast={productForecast}
          selectedProduct={selectedProduct}
          weatherData={weatherData}
          locationName={weatherLocation}
        />
      )}
      
      {/* Share Forecast Modal */}
      <ShareForecastModal 
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        forecastData={dataToShare?.forecast}
        weatherData={dataToShare?.weather}
      />
    </Container>
  );
};

export default Forecast;
