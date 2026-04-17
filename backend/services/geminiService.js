import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Search for competitor prices using Gemini AI
 * @param {string} productName - Name of the product to search for
 * @param {number} currentPrice - Current price of the product
 * @returns {Promise<Object>} Competitor price data
 */
export const searchCompetitorPrices = async (productName, currentPrice) => {
  try {
    const prompt = `You are a market research assistant. Search for the product "${productName}" and find real competitor prices from major e-commerce platforms and retailers in India.

Requirements:
1. Find at least 3-5 real competitors selling similar products
2. List the actual shop/website names (e.g., Amazon, Flipkart, Reliance Digital, Croma, etc.)
3. Provide their actual prices in Indian Rupees (₹)
4. Only include prices that are currently available online
5. Focus on Indian e-commerce platforms and retailers
6. If the product is not commonly found, provide realistic market estimates based on similar products

Format your response as a JSON object with this structure:
{
  "competitors": [
    {
      "name": "Shop/Website Name",
      "price": 499.99,
      "url": "optional url if available"
    }
  ],
  "averagePrice": 524.50,
  "minPrice": 449.99,
  "maxPrice": 599.99,
  "marketPosition": "premium|competitive|budget",
  "notes": "Any relevant market insights"
}

Current product price: ₹${currentPrice}
Product name: ${productName}

Return ONLY valid JSON, no additional text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const competitorData = JSON.parse(cleanedText);

    // Validate and structure the response
    if (!competitorData.competitors || !Array.isArray(competitorData.competitors)) {
      throw new Error('Invalid competitor data format');
    }

    return {
      competitors: competitorData.competitors.map(comp => ({
        name: comp.name || 'Unknown Competitor',
        price: parseFloat(comp.price) || 0,
        url: comp.url || null
      })),
      averagePrice: parseFloat(competitorData.averagePrice) || 0,
      minPrice: parseFloat(competitorData.minPrice) || 0,
      maxPrice: parseFloat(competitorData.maxPrice) || 0,
      marketPosition: competitorData.marketPosition || 'competitive',
      notes: competitorData.notes || '',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error searching competitor prices with Gemini:', error);
    
    // Fallback: Generate realistic competitor prices based on current price
    const fallbackCompetitors = [
      { name: 'Amazon India', price: currentPrice * 0.95 },
      { name: 'Flipkart', price: currentPrice * 1.05 },
      { name: 'Reliance Digital', price: currentPrice * 1.02 },
      { name: 'Croma', price: currentPrice * 0.98 },
      { name: 'Tata CLiQ', price: currentPrice * 1.03 }
    ];

    const prices = fallbackCompetitors.map(c => c.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      competitors: fallbackCompetitors.map(c => ({
        name: c.name,
        price: Math.round(c.price * 100) / 100,
        url: null
      })),
      averagePrice: Math.round(avgPrice * 100) / 100,
      minPrice: Math.round(Math.min(...prices) * 100) / 100,
      maxPrice: Math.round(Math.max(...prices) * 100) / 100,
      marketPosition: 'competitive',
      notes: 'Using estimated market prices (Gemini API unavailable)',
      timestamp: new Date().toISOString(),
      isFallback: true
    };
  }
};

/**
 * Calculate optimal price based on competitor analysis and market dynamics
 * @param {number} currentPrice - Current product price
 * @param {number} costPrice - Product cost price
 * @param {Object} competitorData - Competitor price data from searchCompetitorPrices
 * @param {number} priceElasticity - Price elasticity of demand (default: -1.2)
 * @param {number} baseVolume - Base sales volume
 * @returns {Object} Optimal pricing recommendation
 */
export const calculateOptimalPrice = (
  currentPrice,
  costPrice,
  competitorData,
  priceElasticity = -1.2,
  baseVolume = 100
) => {
  const { averagePrice, minPrice, maxPrice, competitors } = competitorData;

  // Strategy 1: Competitive pricing (match or slightly beat average)
  const competitivePrice = Math.round(averagePrice * 0.98 * 100) / 100;

  // Strategy 2: Premium positioning (above average but not highest)
  const premiumPrice = Math.round((averagePrice + (maxPrice - averagePrice) * 0.3) * 100) / 100;

  // Strategy 3: Market penetration (below average)
  const penetrationPrice = Math.round(averagePrice * 0.92 * 100) / 100;

  // Strategy 4: Profit maximization (considering elasticity)
  let optimalPrice = currentPrice;
  let maxProfit = 0;

  // Test price points between min and max competitor prices
  const priceStep = (maxPrice - minPrice) / 20;
  for (let testPrice = minPrice * 0.9; testPrice <= maxPrice * 1.1; testPrice += priceStep) {
    const roundedPrice = Math.round(testPrice * 100) / 100;
    
    // Estimate volume using price elasticity
    const volumeChange = Math.pow(roundedPrice / currentPrice, priceElasticity);
    const estimatedVolume = Math.max(1, Math.round(baseVolume * volumeChange));
    
    // Calculate profit
    const profit = (roundedPrice - costPrice) * estimatedVolume;
    
    // Consider market position (penalty for being too far from competitors)
    const marketDistance = Math.abs(roundedPrice - averagePrice) / averagePrice;
    const marketPenalty = marketDistance > 0.2 ? 0.8 : 1.0; // Penalty if >20% away from average
    
    const adjustedProfit = profit * marketPenalty;
    
    if (adjustedProfit > maxProfit) {
      maxProfit = adjustedProfit;
      optimalPrice = roundedPrice;
    }
  }

  // Ensure optimal price is within reasonable bounds
  optimalPrice = Math.max(
    costPrice * 1.1, // At least 10% above cost
    Math.min(optimalPrice, maxPrice * 1.15) // Not more than 15% above max competitor
  );
  optimalPrice = Math.round(optimalPrice * 100) / 100;

  // Calculate metrics for optimal price
  const optimalVolumeChange = Math.pow(optimalPrice / currentPrice, priceElasticity);
  const optimalVolume = Math.max(1, Math.round(baseVolume * optimalVolumeChange));
  const optimalProfit = (optimalPrice - costPrice) * optimalVolume;
  const optimalRevenue = optimalPrice * optimalVolume;

  // Determine recommended strategy
  let recommendedStrategy = 'competitive';
  let recommendedPrice = competitivePrice;
  
  if (optimalPrice > averagePrice * 1.05) {
    recommendedStrategy = 'premium';
    recommendedPrice = premiumPrice;
  } else if (optimalPrice < averagePrice * 0.95) {
    recommendedStrategy = 'penetration';
    recommendedPrice = penetrationPrice;
  } else {
    recommendedStrategy = 'competitive';
    recommendedPrice = competitivePrice;
  }

  // Use optimal price if it's close to one of the strategies
  if (Math.abs(optimalPrice - recommendedPrice) / recommendedPrice < 0.05) {
    recommendedPrice = optimalPrice;
  }

  return {
    recommendedPrice: Math.round(recommendedPrice * 100) / 100,
    optimalPrice: Math.round(optimalPrice * 100) / 100,
    currentPrice,
    costPrice,
    priceChangePercent: ((recommendedPrice - currentPrice) / currentPrice) * 100,
    estimatedVolume: Math.max(1, Math.round(baseVolume * Math.pow(recommendedPrice / currentPrice, priceElasticity))),
    estimatedProfit: Math.round((recommendedPrice - costPrice) * Math.max(1, Math.round(baseVolume * Math.pow(recommendedPrice / currentPrice, priceElasticity))) * 100) / 100,
    estimatedRevenue: Math.round(recommendedPrice * Math.max(1, Math.round(baseVolume * Math.pow(recommendedPrice / currentPrice, priceElasticity))) * 100) / 100,
    strategy: recommendedStrategy,
    marketAnalysis: {
      averageCompetitorPrice: averagePrice,
      minCompetitorPrice: minPrice,
      maxCompetitorPrice: maxPrice,
      marketPosition: competitorData.marketPosition,
      priceVsAverage: ((recommendedPrice - averagePrice) / averagePrice) * 100
    },
    confidence: calculateConfidence(competitorData, recommendedPrice, averagePrice)
  };
};

/**
 * Calculate confidence score for price recommendation
 */
const calculateConfidence = (competitorData, recommendedPrice, averagePrice) => {
  let confidence = 70; // Base confidence

  // Increase confidence if we have real competitor data
  if (!competitorData.isFallback) {
    confidence += 15;
  }

  // Increase confidence if recommended price is close to market average
  const priceDeviation = Math.abs(recommendedPrice - averagePrice) / averagePrice;
  if (priceDeviation < 0.05) {
    confidence += 10;
  } else if (priceDeviation < 0.15) {
    confidence += 5;
  }

  // Increase confidence if we have multiple competitors
  if (competitorData.competitors && competitorData.competitors.length >= 4) {
    confidence += 5;
  }

  return Math.min(95, Math.max(60, confidence));
};

