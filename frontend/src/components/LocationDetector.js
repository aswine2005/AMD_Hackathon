import React, { useState, useEffect } from 'react';
import { Button, Spinner, Alert, Card } from 'react-bootstrap';
import { FaLocationArrow, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import config from '../config';

const LocationDetector = ({ onLocationSelected, initialCity }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load popular cities for quick selection
  const popularCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Cochin'
  ];

  // Load saved location from localStorage on component mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setCurrentCity(savedLocation);
      onLocationSelected(savedLocation);
      // Only fetch weather data once on initial load
      if (!weatherData) {
        fetchWeatherData(savedLocation);
      }
    } else if (initialCity) {
      setCurrentCity(initialCity);
      // Only fetch weather data once on initial load
      if (!weatherData) {
        fetchWeatherData(initialCity);
      }
    }
    // We want this to run only once on component mount, not on every initialCity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectLocation = () => {
    setLoading(true);
    setError('');

    // Using browser's geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // First try using direct coordinates with weather API instead of geocoding
            try {
              const weatherResponse = await axios.get(`/api/weather/current?lat=${latitude}&lon=${longitude}`);
              if (weatherResponse.data && weatherResponse.data.city) {
                // If weather API successfully returns city name, use that
                saveLocation(weatherResponse.data.city);
                setLoading(false);
                return;
              }
            } catch (err) {
              console.log('Direct coordinate weather lookup failed, falling back to geocoding');
            }
            
            // Fallback to reverse geocoding to get the city name
            const response = await axios.get(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            // Try multiple options for city name, including state/province
            let city = response.data.city || response.data.locality || '';
            
            // If no exact city match, try larger administrative areas that are more likely to be in weather API
            if (!city && response.data.principalSubdivision) {
              city = response.data.principalSubdivision; // Use state/province
            } else if (!city) {
              city = 'Chennai'; // Default to a major city if nothing found
            }
            
            // Cleanup city name to improve match chance
            city = city.replace(/\s*district\s*/i, '').trim();
            
            if (city) {
              saveLocation(city);
            } else {
              setError('Could not determine your city. Please select from the list below.');
            }
          } catch (error) {
            console.error('Error getting location:', error);
            setError('Failed to get your location. Please select from the list or search.');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
          
          if (error.code === error.PERMISSION_DENIED) {
            setError('Location permission denied. Please enable location services or select your city manually.');
          } else {
            setError('Failed to get your location. Please select from the list or search.');
          }
        }
      );
    } else {
      setLoading(false);
      setError('Geolocation is not supported by your browser. Please select your city manually.');
    }
  };

  const saveLocation = (city) => {
    setCurrentCity(city);
    localStorage.setItem('userLocation', city);
    onLocationSelected(city);
    fetchWeatherData(city);
  };

  const handleCityClick = (city) => {
    saveLocation(city);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length > 1) {
      // Filter cities based on search term
      const filtered = popularCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const fetchWeatherData = async (city) => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/weather/current?city=${city}`);
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const getWeatherIcon = (weatherData) => {
    if (!weatherData || !weatherData.description) return '☁️';
    
    const condition = weatherData.description.toLowerCase();
    
    if (condition.includes('clear') || condition.includes('sunny')) return '☀️';
    if (condition.includes('cloud')) return '☁️';
    if (condition.includes('rain') || condition.includes('drizzle')) return '🌧️';
    if (condition.includes('snow')) return '❄️';
    if (condition.includes('thunder') || condition.includes('storm')) return '⛈️';
    if (condition.includes('fog') || condition.includes('mist')) return '🌫️';
    
    return '🌤️';
  };

  return (
    <div className="location-detector">
      <div className="mb-3 d-flex align-items-center">
        <div className="flex-grow-1">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search for your city..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <Button 
              variant="primary" 
              onClick={detectLocation}
              disabled={loading}
            >
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                <>
                  <FaLocationArrow className="me-1" /> Detect Location
                </>
              )}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="search-results mt-1 border rounded position-absolute bg-white shadow-sm z-index-1000" style={{ width: '89%' }}>
              {searchResults.map(city => (
                <div 
                  key={city} 
                  className="p-2 border-bottom search-result-item"
                  onClick={() => handleCityClick(city)}
                >
                  <FaMapMarkerAlt className="me-2 text-primary" /> {city}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="warning" className="py-2 mb-3">
          <small>{error}</small>
        </Alert>
      )}
      
      {currentCity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-light mb-3">
            <Card.Body className="py-2">
              <div className="d-flex align-items-center">
                <div className="me-auto">
                  <div className="d-flex align-items-center">
                    <FaMapMarkerAlt className="text-danger me-2" />
                    <h6 className="mb-0">Current Location: <strong>{currentCity}</strong></h6>
                  </div>
                  {weatherData && (
                    <div className="text-muted small mt-1">
                      Weather: {weatherData.description} • Temperature: {weatherData.temperature}°C
                    </div>
                  )}
                </div>
                <div className="weather-icon fs-3">
                  {weatherData ? getWeatherIcon(weatherData) : '☁️'}
                </div>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      )}
      
      <div className="quick-cities">
        <small className="text-muted d-block mb-1">Popular cities:</small>
        <div className="d-flex flex-wrap">
          {popularCities.slice(0, 5).map(city => (
            <Button
              key={city}
              variant="outline-secondary"
              size="sm"
              className="me-1 mb-1"
              onClick={() => handleCityClick(city)}
            >
              {city}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationDetector;
