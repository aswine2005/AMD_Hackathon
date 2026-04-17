import React, { useState } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, 
  FaCloudRain, 
  FaSun, 
  FaUmbrella, 
  FaChartLine, 
  FaStore,
  FaArrowUp,
  FaArrowDown 
} from 'react-icons/fa';

// Animation variants
const calendarVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

const Calendar = ({ forecastData, accuracyMetrics }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Helper function to get color based on prediction
  const getPredictionColor = (actual, predicted) => {
    if (!actual) return 'primary'; // No actual data to compare
    
    const percentDiff = Math.abs((predicted - actual) / actual);
    if (percentDiff < 0.1) return 'success';
    if (percentDiff < 0.25) return 'info';
    return 'warning';
  };

  // Helper to get weather icon with null checks
  const getWeatherIcon = (weather) => {
    // Ensure weather data exists, if not use fallback
    const weatherData = weather || { temperature: 25, rainfall: 0 };
    
    if (weatherData.rainfall > 5) return <FaUmbrella className="text-primary" size={20} />;
    if (weatherData.rainfall > 0) return <FaCloudRain className="text-info" size={20} />;
    return <FaSun className="text-warning" size={20} />;
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAccuracyBadge = () => {
    if (!accuracyMetrics) return null;
    
    let color = 'danger';
    if (accuracyMetrics.accuracy >= 0.85) color = 'success';
    else if (accuracyMetrics.accuracy >= 0.7) color = 'warning';
    
    // Get the actual data points count (added to make sure it's displaying correctly)
    const dataPointsCount = accuracyMetrics.totalEntries || accuracyMetrics.dataPoints || 0;
    
    return (
      <div className="accuracy-meter mb-3">
        <h5 className="d-flex align-items-center">
          <FaChartLine className="me-2" /> 
          Model Accuracy: 
          <Badge bg={color} className="ms-2 p-2">
            {accuracyMetrics.accuracyPercentage}%
          </Badge>
          <span className="ms-2 text-muted small">
            ({accuracyMetrics.confidence} confidence)
          </span>
        </h5>
        <div className="d-flex justify-content-between">
          <p className="text-muted small mb-0">{accuracyMetrics.message}</p>
          <p className="text-info small mb-0">
            <strong>Using {dataPointsCount} sales data entries</strong>
          </p>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="forecast-calendar"
      variants={calendarVariants}
      initial="hidden"
      animate="visible"
    >
      {getAccuracyBadge()}

      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white d-flex align-items-center">
          <FaCalendarAlt className="me-2" />
          <h5 className="mb-0">Sales Forecast Calendar</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Weather</th>
                <th>Predicted Sales</th>
                <th>Range</th>
                <th>Special</th>
              </tr>
            </thead>
            <tbody>
              {forecastData && forecastData.map((day, index) => (
                <motion.tr 
                  key={index}
                  variants={rowVariants}
                  onMouseEnter={() => setHoveredDay(index)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`${hoveredDay === index ? 'bg-light' : ''} ${day.isWeekend ? 'weekend-row' : ''}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <td>{formatDate(day.date)}</td>
                  <td>
                    {day.dayName}
                    {day.isWeekend && 
                      <Badge bg="info" className="ms-2">Weekend</Badge>
                    }
                  </td>
                  <td className="d-flex align-items-center">
                    {getWeatherIcon(day.weather)}
                    <span className="ms-2">
                      {day.weather ? day.weather.temperature.toFixed(1) : '25.0'}°C
                      {day.weather && day.weather.rainfall > 0 && 
                        <span className="text-primary ms-1">
                          ({day.weather.rainfall.toFixed(1)} mm)
                        </span>
                      }
                    </span>
                  </td>
                  <td>
                    <motion.div 
                      className="d-flex align-items-center"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Badge 
                        bg={getPredictionColor(null, day.predictedQuantity)} 
                        className="prediction-badge p-2"
                      >
                        <FaStore className="me-1" />
                        {day.predictedQuantity}
                      </Badge>
                    </motion.div>
                  </td>
                  <td>
                    <small className="text-muted">
                      <FaArrowDown className="text-danger me-1" />
                      {day.lowerBound} 
                      <span className="mx-1">-</span>
                      <FaArrowUp className="text-success me-1" />
                      {day.upperBound}
                    </small>
                  </td>
                  <td>
                    {day.festivalName && 
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="festival-badge"
                      >
                        <Badge bg="danger" className="p-2">
                          {day.festivalName}
                        </Badge>
                      </motion.div>
                    }
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default Calendar;
