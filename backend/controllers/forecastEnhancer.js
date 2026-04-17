import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SalesData from '../models/SalesData.js';

// Define the ForecastHistory schema once at the module level
const ForecastHistorySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    forecastDate: {
        type: Date,
        default: Date.now
    },
    forecastPeriod: {
        type: Number,
        required: true
    },
    forecastData: [{
        date: Date,
        predictedQuantity: Number,
        lowerBound: Number,
        upperBound: Number
    }],
    accuracy: {
        type: Number,
        default: null
    },
    factors: {
        weather: Number,
        seasonal: Number,
        category: Number,
        festival: Number
    }
});

// Create the model only once
let ForecastHistory;
try {
    // Check if the model is already defined
    ForecastHistory = mongoose.model('ForecastHistory');
} catch (error) {
    // Define it only if it doesn't exist
    ForecastHistory = mongoose.model('ForecastHistory', ForecastHistorySchema);
}

/**
 * Enhanced calculation model for sales predictions
 * Incorporates multiple factors including seasonality, weather, 
 * category engagement, and festival dates
 */
const enhancedForecastModel = async (productId, pastSales, daysToForecast, weatherConditions, cityName) => {
    try {
        // Get product and category data for better insights
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        
        const category = await Category.findById(product.category);
        
        // Calculate base forecast first
        const baseForecast = calculateBaselineForecast(pastSales, daysToForecast);
        
        // Get festival/holiday dates
        const festivalDates = getFestivalDates();
        
        // Generate improved forecast with all factors
        const enhancedForecast = baseForecast.map(day => {
            const forecastDate = new Date(day.date);
            
            // Apply weather adjustment
            let weatherMultiplier = calculateWeatherFactor(weatherConditions, forecastDate);
            
            // Apply category engagement adjustments
            let categoryMultiplier = 1.0;
            if (category) {
                categoryMultiplier = calculateCategoryFactor(category, forecastDate);
            }
            
            // Apply seasonal adjustments
            const seasonalMultiplier = calculateSeasonalFactor(forecastDate);
            
            // Apply festival effect
            const festivalMultiplier = calculateFestivalFactor(forecastDate, festivalDates);
            
            // Calculate final adjusted quantity
            let adjustedQuantity = day.quantity * weatherMultiplier * categoryMultiplier * 
                                 seasonalMultiplier * festivalMultiplier;
            
            // Add confidence intervals (wider as we forecast further into future)
            const dayIndex = baseForecast.indexOf(day);
            const confidenceFactor = 1 + ((dayIndex + 1) / (daysToForecast * 5));
            
            return {
                ...day,
                predictedQuantity: Math.round(adjustedQuantity * 10) / 10, // Round to 1 decimal
                confidenceInterval: {
                    upper: Math.round(adjustedQuantity * confidenceFactor * 10) / 10,
                    lower: Math.max(0, Math.round(adjustedQuantity / confidenceFactor * 10) / 10)
                },
                factors: {
                    weather: Math.round(weatherMultiplier * 100) / 100,
                    category: Math.round(categoryMultiplier * 100) / 100,
                    seasonal: Math.round(seasonalMultiplier * 100) / 100,
                    festival: Math.round(festivalMultiplier * 100) / 100
                }
            };
        });
        
        // Save forecast to database for future reference
        await saveForecastToDatabase(productId, enhancedForecast);
        
        return enhancedForecast;
    } catch (error) {
        console.error('Error in enhanced forecast model:', error);
        throw error;
    }
};

/**
 * Save forecast data to MongoDB for future comparison and accuracy tracking
 */
const saveForecastToDatabase = async (productId, forecastData) => {
    try {
        // ForecastHistory model is now defined at the module level
        // Format the forecast data to match our schema
        const formattedForecastData = forecastData.map(f => ({
            date: f.date,
            predictedQuantity: f.predictedQuantity,
            lowerBound: f.lowerBound || f.predictedQuantity * 0.8,
            upperBound: f.upperBound || f.predictedQuantity * 1.2
        }));
        
        // Get the average factors for this forecast
        const avgFactors = {
            weather: forecastData.reduce((sum, f) => sum + (f.factors?.weather || 1), 0) / forecastData.length,
            seasonal: forecastData.reduce((sum, f) => sum + (f.factors?.seasonal || 1), 0) / forecastData.length,
            category: forecastData.reduce((sum, f) => sum + (f.factors?.category || 1), 0) / forecastData.length,
            festival: forecastData.reduce((sum, f) => sum + (f.factors?.festival || 1), 0) / forecastData.length
        };
        
        // Create a new forecast history entry
        await ForecastHistory.create({
            productId,
            forecastPeriod: forecastData.length,
            forecastData: formattedForecastData,
            factors: avgFactors
        });
        
        // Limit stored forecasts to 10 most recent per product
        const allForecasts = await ForecastHistory.find({ productId }).sort({ forecastDate: -1 });
        if (allForecasts.length > 10) {
            // Delete older forecasts beyond the 10 most recent
            const oldForecastIds = allForecasts.slice(10).map(f => f._id);
            await ForecastHistory.deleteMany({ _id: { $in: oldForecastIds } });
        }
    } catch (error) {
        console.error('Error saving forecast to database:', error);
    }
};

/**
 * Calculate baseline forecast using historical sales data
 */
const calculateBaselineForecast = (pastSales, daysToForecast) => {
    // Ensure we have sales data
    if (!pastSales || pastSales.length === 0) {
        return Array(daysToForecast).fill().map((_, i) => ({
            date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
            quantity: 0
        }));
    }
    
    // Calculate average daily sales
    const totalQuantity = pastSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const avgQuantity = totalQuantity / pastSales.length;
    
    // Calculate day-of-week patterns if we have enough data
    let dowPatterns = [1, 1, 1, 1, 1, 1, 1]; // Default to equal all days
    if (pastSales.length >= 14) {
        // Create pattern based on day of week
        const salesByDOW = Array(7).fill(0);
        const countByDOW = Array(7).fill(0);
        
        pastSales.forEach(sale => {
            const date = new Date(sale.date);
            const dayOfWeek = date.getDay();
            salesByDOW[dayOfWeek] += sale.quantity;
            countByDOW[dayOfWeek]++;
        });
        
        // Calculate average sales for each day of week
        dowPatterns = salesByDOW.map((total, i) => {
            return countByDOW[i] ? (total / countByDOW[i]) / avgQuantity : 1;
        });
    }
    
    // Generate baseline forecast
    return Array(daysToForecast).fill().map((_, i) => {
        const forecastDate = new Date(Date.now() + (i * 24 * 60 * 60 * 1000));
        const dayOfWeek = forecastDate.getDay();
        
        return {
            date: forecastDate,
            quantity: Math.max(0, Math.round(avgQuantity * dowPatterns[dayOfWeek] * 10) / 10)
        };
    });
};

/**
 * Calculate weather impact factor on sales
 */
const calculateWeatherFactor = (weatherConditions, forecastDate) => {
    // Default multiplier if no weather data
    if (!weatherConditions) return 1.0;
    
    // Safe check for forecast date
    if (!forecastDate || !(forecastDate instanceof Date)) {
        console.warn('Invalid date provided to calculateWeatherFactor');
        return 1.0;
    }
    
    // Check if we have forecast for this date
    const dateStr = forecastDate.toISOString().split('T')[0];
    // Add null checks to avoid undefined errors
    const dayForecast = weatherConditions?.forecast ? 
        weatherConditions.forecast.find(day => day?.date && day.date.includes(dateStr)) : null;
    
    if (!dayForecast) {
        // Use current conditions as fallback
        if (!weatherConditions.current) return 1.0;
        
        const condition = (weatherConditions.current.condition || '').toLowerCase();
        const temperature = weatherConditions.current.temperature || 25;
        
        // Weather adjustments based on current conditions
        if (condition.includes('rain') || condition.includes('storm')) return 0.85;
        if (condition.includes('snow')) return 0.7;
        if (condition.includes('clear') && temperature > 30) return 1.15;
        if (condition.includes('clear') && temperature < 15) return 0.95;
        
        return 1.0;
    }
    
    // Use day-specific forecast
    const condition = (dayForecast.condition || '').toLowerCase();
    const temperature = dayForecast.temperature || 25;
    
    // Weather adjustments based on forecast
    if (condition.includes('rain') || condition.includes('storm')) return 0.85;
    if (condition.includes('snow')) return 0.7;
    if (condition.includes('clear') && temperature > 30) return 1.15;
    if (condition.includes('clear') && temperature < 15) return 0.95;
    
    return 1.0;
};

/**
 * Calculate category engagement impact factor
 */
const calculateCategoryFactor = (category, forecastDate) => {
    // Base multiplier
    let multiplier = 1.0;
    
    // Adjust based on category engagement metrics if available
    if (category.engagementScore) {
        // Higher engagement = higher sales potential
        multiplier *= (0.5 + (category.engagementScore / 100) * 0.5);
    }
    
    // Location in store affects sales
    if (category.locationInStore) {
        switch(category.locationInStore) {
            case 'entrance':
                multiplier *= 1.2;
                break;
            case 'front':
                multiplier *= 1.15;
                break;
            case 'middle':
                multiplier *= 1.0;
                break;
            case 'back':
                multiplier *= 0.9;
                break;
            case 'checkout':
                multiplier *= 1.3; // Impulse buys near checkout
                break;
        }
    }
    
    return multiplier;
};

/**
 * Calculate seasonal impact factor
 */
const calculateSeasonalFactor = (forecastDate) => {
    const month = forecastDate.getMonth();
    
    // Seasonal adjustments (specific to business context)
    switch(month) {
        case 10: // November
        case 11: // December
            return 1.3; // Winter holiday shopping season
        case 0: // January
            return 0.85; // Post-holiday slowdown
        case 7: // August
        case 8: // September
            return 1.15; // Back to school shopping
        default:
            return 1.0;
    }
};

/**
 * Calculate festival impact factor
 */
const calculateFestivalFactor = (forecastDate, festivalDates) => {
    // Check if the date is near any festival/holiday
    const dateStr = forecastDate.toISOString().split('T')[0];
    
    for (const festival of festivalDates) {
        // Exact match = highest boost
        if (festival.date === dateStr) {
            return festival.salesFactor;
        }
        
        // Check if within 3 days before festival
        const festDate = new Date(festival.date);
        const diffTime = festDate.getTime() - forecastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays <= 3) {
            // Scale factor based on how close we are to the festival
            return 1 + ((festival.salesFactor - 1) * (1 - (diffDays - 1) / 3));
        }
    }
    
    return 1.0; // Default - no festival effect
};

/**
 * Get upcoming festival dates
 */
const getFestivalDates = () => {
    const currentYear = new Date().getFullYear();
    
    // List of major Indian festivals with sales impact factors
    return [
        { name: 'Diwali', date: `${currentYear}-11-04`, salesFactor: 1.8 },
        { name: 'Dussehra', date: `${currentYear}-10-24`, salesFactor: 1.5 },
        { name: 'Holi', date: `${currentYear}-03-13`, salesFactor: 1.4 },
        { name: 'Raksha Bandhan', date: `${currentYear}-08-19`, salesFactor: 1.5 },
        { name: 'Christmas', date: `${currentYear}-12-25`, salesFactor: 1.5 },
        { name: 'Republic Day', date: `${currentYear}-01-26`, salesFactor: 1.3 },
        { name: 'Independence Day', date: `${currentYear}-08-15`, salesFactor: 1.3 },
        { name: 'Gandhi Jayanti', date: `${currentYear}-10-02`, salesFactor: 1.2 },
        { name: 'Navaratri Start', date: `${currentYear}-10-14`, salesFactor: 1.4 },
        { name: 'Ganesh Chaturthi', date: `${currentYear}-09-09`, salesFactor: 1.4 },
        { name: 'Ugadi', date: `${currentYear}-04-09`, salesFactor: 1.3 },
        { name: 'Pongal', date: `${currentYear}-01-14`, salesFactor: 1.4 },
        { name: 'Onam', date: `${currentYear}-09-02`, salesFactor: 1.4 },
        // Add more festivals as needed
    ];
};

export default enhancedForecastModel;
export {
    calculateWeatherFactor,
    calculateCategoryFactor,
    calculateSeasonalFactor,
    calculateFestivalFactor,
    getFestivalDates
};
