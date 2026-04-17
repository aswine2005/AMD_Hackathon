import React from 'react';
import { Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { 
  FaCloudRain, FaSun, FaSnowflake, FaCloudShowersHeavy, 
  FaCloud, FaSmog, FaThermometerHalf, FaWind, 
  FaExclamationTriangle, FaCalendarAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const WeatherForecast = ({ forecastDays, location }) => {
  const [weatherForecast, setWeatherForecast] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    if (location && forecastDays) {
      fetchWeatherForecast();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, forecastDays]);
  
  const fetchWeatherForecast = async () => {
    setLoading(true);
    try {
      // OpenWeatherMap API for 5-day forecast
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=8d2de98e089f1c28e1a22fc19a24ef04&units=metric&cnt=${Math.min(forecastDays * 8, 40)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather forecast');
      }
      
      const data = await response.json();
      
      // Process the forecast data - 3-hour intervals, group by day
      const dailyData = processWeatherData(data);
      setWeatherForecast(dailyData);
      setError(null);
    } catch (err) {
      console.error('Error fetching weather forecast:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Process weather data to group by day
  const processWeatherData = (data) => {
    const dailyData = {};
    
    // Group by date (day)
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          temps: [],
          precipProbability: 0,
          conditions: [],
          windSpeed: [],
          alerts: []
        };
      }
      
      // Add data points
      dailyData[date].temps.push(item.main.temp);
      
      if (item.rain && item.rain['3h'] > 0) {
        dailyData[date].precipProbability += 1;
      }
      
      if (item.snow && item.snow['3h'] > 0) {
        dailyData[date].conditions.push('snow');
      } else if (item.rain && item.rain['3h'] > 5) {
        dailyData[date].conditions.push('heavy_rain');
      } else if (item.rain && item.rain['3h'] > 0) {
        dailyData[date].conditions.push('rain');
      } else if (item.weather[0].main === 'Clouds' && item.clouds.all > 80) {
        dailyData[date].conditions.push('cloudy');
      } else if (item.weather[0].main === 'Clear') {
        dailyData[date].conditions.push('clear');
      } else {
        dailyData[date].conditions.push(item.weather[0].main.toLowerCase());
      }
      
      dailyData[date].windSpeed.push(item.wind.speed);
      
      // Check for extreme weather
      if (item.main.temp > 35) {
        dailyData[date].alerts.push('extreme_heat');
      } else if (item.main.temp < 10) {
        dailyData[date].alerts.push('cold');
      }
      
      if (item.rain && item.rain['3h'] > 10) {
        dailyData[date].alerts.push('heavy_rain');
      }
      
      if (item.wind.speed > 10) {
        dailyData[date].alerts.push('high_wind');
      }
    });
    
    // Calculate averages and process data
    const processedData = Object.values(dailyData).map(day => {
      const totalReadings = day.temps.length;
      
      // Calculate averages
      const avgTemp = day.temps.reduce((sum, temp) => sum + temp, 0) / totalReadings;
      const avgWind = day.windSpeed.reduce((sum, speed) => sum + speed, 0) / totalReadings;
      
      // Calculate most frequent condition
      const conditionCounts = {};
      day.conditions.forEach(cond => {
        conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
      });
      
      const mainCondition = Object.entries(conditionCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Precipitation probability
      const rainProb = day.precipProbability / totalReadings;
      
      // Get unique alerts
      const uniqueAlerts = [...new Set(day.alerts)];
      
      return {
        date: day.date,
        avgTemp: Math.round(avgTemp * 10) / 10,
        minTemp: Math.min(...day.temps),
        maxTemp: Math.max(...day.temps),
        mainCondition,
        precipProbability: Math.round(rainProb * 100),
        windSpeed: Math.round(avgWind * 10) / 10,
        alerts: uniqueAlerts,
        salesImpact: getSalesImpact(mainCondition, rainProb, avgTemp)
      };
    });
    
    return processedData.slice(0, forecastDays);
  };
  
  // Predict impact on sales based on weather conditions
  const getSalesImpact = (condition, rainProb, temperature) => {
    // Different products have different sensitivities to weather
    let impact = 'neutral';
    let impactText = '';
    
    // Define general impacts
    if (condition === 'heavy_rain' || rainProb > 0.5) {
      impact = 'negative';
      impactText = 'Heavy rain may reduce foot traffic and overall sales';
    } else if (condition === 'clear' && temperature > 25 && temperature < 35) {
      impact = 'positive';
      impactText = 'Pleasant weather likely to increase foot traffic and sales';
    } else if (condition === 'clear' && temperature > 35) {
      impact = 'mixed';
      impactText = 'Hot weather may increase beverage sales but reduce general traffic';
    } else if (temperature < 15) {
      impact = 'negative';
      impactText = 'Cold weather may reduce foot traffic to your store';
    }
    
    return { impact, impactText };
  };
  
  // Get weather icon based on condition
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'rain':
      case 'drizzle':
        return <FaCloudRain className="text-primary" size={24} />;
      case 'heavy_rain':
        return <FaCloudShowersHeavy className="text-primary" size={24} />;
      case 'clear':
        return <FaSun className="text-warning" size={24} />;
      case 'clouds':
      case 'cloudy':
        return <FaCloud className="text-secondary" size={24} />;
      case 'snow':
        return <FaSnowflake className="text-info" size={24} />;
      case 'fog':
      case 'mist':
      case 'haze':
        return <FaSmog className="text-secondary" size={24} />;
      default:
        return <FaCloud className="text-secondary" size={24} />;
    }
  };
  
  // Format date string
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get impact badge
  const getImpactBadge = (impact) => {
    switch (impact) {
      case 'positive':
        return <Badge bg="success">Positive</Badge>;
      case 'negative':
        return <Badge bg="danger">Negative</Badge>;
      case 'mixed':
        return <Badge bg="warning">Mixed</Badge>;
      default:
        return <Badge bg="secondary">Neutral</Badge>;
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading weather forecast...</span>
          </div>
          <p className="mt-3">Loading weather forecast for {location}...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="warning">
        <FaExclamationTriangle className="me-2" />
        Unable to load weather forecast: {error}
      </Alert>
    );
  }

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white">
        <h5 className="mb-0 d-flex align-items-center">
          <FaCalendarAlt className="me-2 text-primary" />
          {forecastDays}-Day Weather Forecast for {location}
        </h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">Weather can significantly impact your sales. Here's the forecast for the next {forecastDays} days:</p>
        
        <motion.div 
          className="weather-forecast"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row>
            {weatherForecast.map((day, idx) => (
              <Col key={day.date} md={6} lg={3} className="mb-3">
                <motion.div variants={itemVariants} className="h-100">
                  <Card className={`h-100 ${day.alerts.length > 0 ? 'border-warning' : ''}`}>
                    <Card.Header className={`d-flex justify-content-between align-items-center ${
                      day.alerts.length > 0 ? 'bg-warning bg-opacity-10' : 'bg-light'
                    }`}>
                      <h6 className="mb-0">{formatDate(day.date)}</h6>
                      {getWeatherIcon(day.mainCondition)}
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-2">
                        <div>
                          <FaThermometerHalf className="me-1 text-danger" />
                          <strong>{day.maxTemp}°C</strong> / {day.minTemp}°C
                        </div>
                        <div>
                          <FaWind className="me-1 text-info" />
                          {day.windSpeed} m/s
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <strong>{day.mainCondition.replace('_', ' ').toUpperCase()}</strong>
                        {day.precipProbability > 0 && (
                          <div className="small">
                            <FaCloudRain className="me-1 text-primary" />
                            {day.precipProbability}% precipitation
                          </div>
                        )}
                      </div>
                      
                      {day.alerts.length > 0 && (
                        <div className="mt-2 mb-2">
                          <Alert variant="warning" className="p-2 mb-0">
                            <FaExclamationTriangle className="me-1" />
                            <small>
                              {day.alerts.includes('extreme_heat') && 'Extremely hot '}
                              {day.alerts.includes('cold') && 'Unusually cold '}
                              {day.alerts.includes('heavy_rain') && 'Heavy rainfall '}
                              {day.alerts.includes('high_wind') && 'Strong winds '}
                              expected
                            </small>
                          </Alert>
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <strong>Sales Impact:</strong> {getImpactBadge(day.salesImpact.impact)}
                        <div className="small text-muted mt-1">
                          {day.salesImpact.impactText}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
        
        <div className="mt-4">
          <h6>Weather Analysis:</h6>
          <ul className="mb-0">
            {weatherForecast.some(day => day.salesImpact.impact === 'positive') && (
              <li className="text-success">Some days show favorable weather for increased sales.</li>
            )}
            {weatherForecast.some(day => day.salesImpact.impact === 'negative') && (
              <li className="text-danger">Be prepared for reduced traffic on days with poor weather.</li>
            )}
            {weatherForecast.some(day => day.alerts.length > 0) && (
              <li className="text-warning">Weather alerts present - consider adjustments to inventory or staffing.</li>
            )}
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WeatherForecast;
