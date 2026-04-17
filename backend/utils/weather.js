import axios from 'axios';

// Cache for weather data (to limit API calls)
const weatherCache = {
  data: null,
  timestamp: null,
  location: null,
  expiryTime: 2 * 60 * 60 * 1000 // 2 hours in milliseconds
};

/**
 * Get current weather for a specific location
 * @param {string} location - City name or coordinates
 */
export async function getCurrentWeather(location) {
  try {
    // Check if we have cached data for this location that isn't expired
    const now = Date.now();
    if (
      weatherCache.data && 
      weatherCache.location === location &&
      weatherCache.timestamp && 
      (now - weatherCache.timestamp) < weatherCache.expiryTime
    ) {
      console.log('Using cached weather data');
      return weatherCache.data;
    }

    // Fetch new weather data from API
    const apiKey = process.env.WEATHER_API_KEY || 'demo_key'; // Use your actual API key from .env file
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error('Failed to fetch weather data');
    }
    
    // Extract relevant weather info
    const weatherData = {
      location: response.data.name,
      temperature: response.data.main.temp,
      feelsLike: response.data.main.feels_like,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      conditions: response.data.weather[0].main,
      description: response.data.weather[0].description,
      rainfall: response.data.rain ? response.data.rain['1h'] || 0 : 0,
      timestamp: new Date()
    };
    
    // Update cache
    weatherCache.data = weatherData;
    weatherCache.timestamp = now;
    weatherCache.location = location;
    
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // If API fails, return default weather data
    return {
      location: location || 'Unknown',
      temperature: 25, // Default to 25°C
      humidity: 50,
      windSpeed: 5,
      conditions: 'Clear',
      description: 'clear sky',
      rainfall: 0,
      timestamp: new Date(),
      isDefault: true
    };
  }
}

/**
 * Generate a sales/weather tip based on current weather conditions
 * @param {Object} currentWeather - Weather data
 * @param {Object} historicalStats - Historical stats with mean temperature etc.
 * @returns {Object} - Suggestion object with message and actions
 */
export function generateWeatherTip(currentWeather, historicalStats) {
  // If we don't have historical stats, return a basic tip
  if (!historicalStats || !historicalStats.meanTemperature) {
    return basicWeatherTip(currentWeather);
  }

  const { temperature, rainfall, conditions } = currentWeather;
  const { meanTemperature, meanRainfall } = historicalStats;
  
  // Initialize suggestion object
  const suggestion = {
    message: '',
    reasonCode: '',
    expectedImpact: '',
    actions: []
  };

  // Temperature is significantly higher than average
  if (temperature > meanTemperature + 5) {
    suggestion.message = `It's unusually hot today (${temperature}°C vs. avg ${meanTemperature}°C).`;
    suggestion.reasonCode = 'temperature_high';
    suggestion.expectedImpact = 'Increased foot traffic but reduced time spent shopping';
    suggestion.actions = [
      'Feature cold beverages and summer items prominently',
      'Ensure air conditioning is working properly',
      'Consider promotions on ice cream, cold drinks, fans'
    ];
  }
  // Temperature is significantly lower than average
  else if (temperature < meanTemperature - 5) {
    suggestion.message = `It's unusually cold today (${temperature}°C vs. avg ${meanTemperature}°C).`;
    suggestion.reasonCode = 'temperature_low';
    suggestion.expectedImpact = 'Reduced foot traffic but potentially longer browse time';
    suggestion.actions = [
      'Feature hot beverages and winter items prominently',
      'Consider promotions on comfort foods, hot drinks, heaters',
      'Ensure store is adequately heated'
    ];
  }
  // Heavy rainfall
  else if (rainfall > 5 || (rainfall > 0 && rainfall > meanRainfall * 2)) {
    suggestion.message = `It's unusually rainy today (${rainfall}mm vs. avg ${meanRainfall}mm).`;
    suggestion.reasonCode = 'heavy_rain';
    suggestion.expectedImpact = 'Significantly reduced foot traffic';
    suggestion.actions = [
      'Push online ordering and delivery options',
      'Feature umbrellas and rain gear prominently',
      'Consider rainy day promotions or discounts'
    ];
  }
  // Normal weather
  else {
    suggestion.message = 'Weather conditions are normal today.';
    suggestion.reasonCode = 'normal_weather';
    suggestion.expectedImpact = 'Normal foot traffic expected';
    suggestion.actions = [
      'Run standard promotions',
      'Focus on regular inventory management'
    ];
  }

  // Add conditions-specific suggestions
  if (conditions === 'Thunderstorm') {
    suggestion.message += ' Thunderstorms may keep customers at home.';
    suggestion.actions.push('Consider flash sale promotions for online orders');
  } else if (conditions === 'Snow') {
    suggestion.message += ' Snow may affect transportation.';
    suggestion.actions.push('Ensure walkways are clear and safe');
  } else if (conditions === 'Clear' && temperature > 20) {
    suggestion.message += ' Clear skies may bring more customers out shopping.';
    suggestion.actions.push('Consider outdoor displays or promotions');
  }

  return suggestion;
}

/**
 * Generate a basic weather tip without historical data
 * @param {Object} weather - Current weather data
 * @returns {Object} - Suggestion object
 */
function basicWeatherTip(weather) {
  const { temperature, rainfall, conditions } = weather;
  
  // Default suggestion
  const suggestion = {
    message: 'Consider normal operations today.',
    reasonCode: 'default',
    expectedImpact: 'Standard foot traffic',
    actions: ['Maintain regular stock levels']
  };

  // Hot day
  if (temperature > 30) {
    suggestion.message = `It's very hot today (${temperature}°C).`;
    suggestion.reasonCode = 'hot_day';
    suggestion.expectedImpact = 'Potentially increased need for refreshments';
    suggestion.actions = [
      'Feature cold beverages prominently',
      'Ensure refrigerated items are well-stocked'
    ];
  }
  // Cold day
  else if (temperature < 10) {
    suggestion.message = `It's very cold today (${temperature}°C).`;
    suggestion.reasonCode = 'cold_day';
    suggestion.expectedImpact = 'Potentially increased need for warm items';
    suggestion.actions = [
      'Feature warm beverages prominently',
      'Consider promotions on comfort foods'
    ];
  }
  // Rainy day
  else if (rainfall > 0) {
    suggestion.message = `It's raining today (${rainfall}mm).`;
    suggestion.reasonCode = 'rainy_day';
    suggestion.expectedImpact = 'Potentially reduced foot traffic';
    suggestion.actions = [
      'Consider online promotions',
      'Feature umbrellas and rain gear if applicable'
    ];
  }

  return suggestion;
}

export default {
  getCurrentWeather,
  generateWeatherTip
};
