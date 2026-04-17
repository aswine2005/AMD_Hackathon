import dotenv from 'dotenv';

dotenv.config();

// In ES modules, we need to use dynamic import for fetch
const fetchApi = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// OpenWeatherMap API key provided by user
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'd908a3675cd597702a14a665f748291b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache for weather data to reduce API calls and provide fallback
const weatherCache = {
    current: {},
    forecast: {}
};

// Helper function to find the most frequent weather condition in a set of entries
const getMostFrequentWeather = (entries) => {
    // Default in case of empty array
    if (!entries || entries.length === 0) {
        return {
            main: 'Clear',
            description: 'Clear sky',
            icon: '01d'
        };
    }
    
    // Count occurrences of each weather type
    const weatherCounts = {};
    entries.forEach(entry => {
        const weather = entry.weather || 'Unknown';
        weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
    });
    
    // Find the most frequent
    let mostFrequent = null;
    let highestCount = 0;
    
    Object.keys(weatherCounts).forEach(weather => {
        if (weatherCounts[weather] > highestCount) {
            highestCount = weatherCounts[weather];
            mostFrequent = weather;
        }
    });
    
    // Get a representative entry with this weather
    const representativeEntry = entries.find(e => e.weather === mostFrequent) || entries[0];
    
    return {
        main: representativeEntry.weather || 'Clear',
        description: representativeEntry.description || 'Clear conditions',
        icon: representativeEntry.icon || '01d'
    };
};

// Function to generate default weather data
const generateDefaultWeather = (location) => {
    return {
        city: location,
        country: 'Unknown',
        temperature: 20,
        feels_like: 20,
        description: 'Partly Cloudy',
        icon: '02d',
        humidity: 60,
        wind_speed: 10,
        condition: 'Clouds',
        timestamp: new Date()
    };
};

// Get current weather for a location
export const getCurrentWeather = async (req, res) => {
    const { city, lat, lon } = req.query;
    let requestKey = city || `${lat},${lon}`;
    let apiUrl = '';
    
    // Check if we have this in cache and it's less than 1 hour old
    if (weatherCache.current[requestKey]) {
        const cachedData = weatherCache.current[requestKey];
        const cacheTime = new Date(cachedData.timestamp);
        const now = new Date();
        const hoursSinceCache = (now - cacheTime) / (1000 * 60 * 60);
        
        // Return cached data if it's less than 1 hour old
        if (hoursSinceCache < 1) {
            console.log(`Returning cached weather data for ${requestKey}`);
            return res.status(200).json(cachedData);
        }
    }
    
    // Check if we have coordinates or city name
    if (lat && lon) {
        apiUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
    } else if (city) {
        apiUrl = `${BASE_URL}/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;
    } else {
        return res.status(400).json({ message: 'Either city name or coordinates (lat, lon) are required' });
    }
    
    try {
        // Using real API call with the provided key
        const response = await fetchApi(apiUrl);
        
        if (!response.ok) {
            // If API call fails, check if we have any cached data to return as fallback
            if (weatherCache.current[requestKey]) {
                console.log(`Using stale cached weather data for ${requestKey} as API call failed`);
                return res.status(200).json({
                    ...weatherCache.current[requestKey],
                    fromCache: true,
                    freshness: 'stale'
                });
            }
            
            // If no cache, provide mock data with a warning
            console.error(`Weather API Error for ${requestKey}, providing default data`);
            const defaultWeather = generateDefaultWeather(city || 'Unknown Location');
            return res.status(200).json({
                ...defaultWeather,
                message: 'Using estimated weather data due to API limitations'
            });
        }
        
        const data = await response.json();
        
        // Extract relevant data
        const weatherData = {
            city: data.name,
            country: data.sys.country,
            temperature: data.main.temp,
            feels_like: data.main.feels_like,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            humidity: data.main.humidity,
            wind_speed: data.wind.speed,
            condition: data.weather[0].main,
            timestamp: new Date()
        };
        
        // Save to cache
        weatherCache.current[requestKey] = weatherData;
        
        res.status(200).json(weatherData);
    } catch (error) {
        console.error('Weather API Error:', error);
        
        // If API call fails, check if we have any cached data
        if (weatherCache.current[requestKey]) {
            console.log(`Using cached weather data for ${requestKey} as API call failed`);
            return res.status(200).json({
                ...weatherCache.current[requestKey],
                fromCache: true
            });
        }
        
        // If all else fails, return reliable default data
        const defaultWeather = generateDefaultWeather(city || 'Unknown Location');
        res.status(200).json({
            ...defaultWeather,
            message: 'Using estimated weather data due to API limitations'
        });
    }
};

// Generate a default weather forecast when API fails
const generateDefaultForecast = (city, days = 5) => {
    const forecast = [];
    const today = new Date();
    const weatherTypes = ['Clear', 'Clouds', 'Rain', 'Clear', 'Partly Cloudy'];
    const icons = ['01d', '02d', '10d', '01d', '03d'];
    
    for (let i = 0; i < days; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        
        // Some semi-realistic weather patterns
        const dayTemp = 15 + Math.floor(Math.random() * 15); // 15-30°C
        const nightTemp = dayTemp - 5 - Math.floor(Math.random() * 5); // 5-10°C cooler at night
        
        forecast.push({
            date: forecastDate.toISOString().split('T')[0],
            day: {
                temp: dayTemp,
                feels_like: dayTemp - 2,
                humidity: 40 + Math.floor(Math.random() * 40),
                weather: {
                    main: weatherTypes[i % weatherTypes.length],
                    description: `${weatherTypes[i % weatherTypes.length]} conditions`,
                    icon: icons[i % icons.length]
                }
            },
            night: {
                temp: nightTemp,
                feels_like: nightTemp - 2,
                humidity: 50 + Math.floor(Math.random() * 40),
                weather: {
                    main: 'Clear',
                    description: 'Clear night sky',
                    icon: '01n'
                }
            }
        });
    }
    
    return {
        city: {
            name: city,
            country: 'Unknown'
        },
        list: forecast,
        message: 'Using estimated forecast data due to API limitations'
    };
};

// Get weather forecast for 5 days
export const getWeatherForecast = async (req, res) => {
    const { city, lat, lon } = req.query;
    const days = parseInt(req.query.days) || 5;
    let requestKey = city || `${lat},${lon}`;
    let apiUrl = '';
    
    // Check if we have this in cache and it's less than 3 hours old
    if (weatherCache.forecast[requestKey]) {
        const cachedData = weatherCache.forecast[requestKey];
        const cacheTime = new Date(cachedData.timestamp);
        const now = new Date();
        const hoursSinceCache = (now - cacheTime) / (1000 * 60 * 60);
        
        // Return cached data if it's less than 3 hours old
        if (hoursSinceCache < 3) {
            console.log(`Returning cached forecast data for ${requestKey}`);
            return res.status(200).json(cachedData);
        }
    }
    
    // Check if we have coordinates or city name
    if (lat && lon) {
        apiUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
    } else if (city) {
        apiUrl = `${BASE_URL}/forecast?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;
    } else {
        return res.status(400).json({ message: 'Either city name or coordinates (lat, lon) are required' });
    }
    
    try {
        // Get the forecast directly - no need to get current weather first
        const forecastResponse = await fetchApi(apiUrl);
        
        if (!forecastResponse.ok) {
            // If API call fails, check if we have any cached data to return as fallback
            if (weatherCache.forecast[requestKey]) {
                console.log(`Using stale cached forecast for ${requestKey} as API call failed`);
                return res.status(200).json({
                    ...weatherCache.forecast[requestKey],
                    fromCache: true,
                    freshness: 'stale'
                });
            }
            
            // If no cache, provide synthetic forecast data with a warning
            console.error(`Weather Forecast API Error for ${requestKey}, using generated forecast`);
            const defaultForecast = generateDefaultForecast(city || 'Unknown Location', days);
            return res.status(200).json(defaultForecast);
        }
        
        // Since we've already fetched the forecast data directly, process it
        const forecastData = await forecastResponse.json();
        
        // Process and format forecast data
        const forecast = [];
        const dailyForecasts = {};
        
        // Group forecasts by day
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!dailyForecasts[dateKey]) {
                dailyForecasts[dateKey] = [];
            }
            
            dailyForecasts[dateKey].push({
                datetime: date,
                temperature: item.main.temp,
                feels_like: item.main.feels_like,
                description: item.weather[0].description,
                icon: item.weather[0].icon,
                humidity: item.main.humidity,
                wind_speed: item.wind.speed,
                rainfall: item.rain ? (item.rain['3h'] || 0) : 0,
                weather: item.weather[0].main
            });
        });
        
        // Get daily summaries
        Object.keys(dailyForecasts).forEach(date => {
            const entries = dailyForecasts[date];
            const dayEntries = entries.filter(e => {
                const hour = e.datetime.getHours();
                return hour >= 6 && hour <= 18;
            });
            
            const nightEntries = entries.filter(e => {
                const hour = e.datetime.getHours();
                return hour < 6 || hour > 18;
            });
            
            if (dayEntries.length > 0) {
                const avgDayTemp = dayEntries.reduce((sum, e) => sum + e.temperature, 0) / dayEntries.length;
                const mainWeather = getMostFrequentWeather(dayEntries);
                
                forecast.push({
                    date,
                    day: {
                        temp: avgDayTemp,
                        weather: {
                            main: mainWeather.main,
                            description: mainWeather.description,
                            icon: mainWeather.icon
                        }
                    },
                    night: nightEntries.length > 0 ? {
                        temp: nightEntries.reduce((sum, e) => sum + e.temperature, 0) / nightEntries.length,
                        weather: getMostFrequentWeather(nightEntries)
                    } : null
                });
            }
        });
        
        // Create a properly formatted response
        const responseData = {
            city: {
                name: forecastData.city.name,
                country: forecastData.city.country
            },
            list: forecast,
            timestamp: new Date()
        };
        
        // Save to cache
        weatherCache.forecast[requestKey] = responseData;
        
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error in getWeatherForecast:', error.message);
        res.status(500).json({ message: 'Error fetching weather forecast. Please try again later.' });
    }
};
