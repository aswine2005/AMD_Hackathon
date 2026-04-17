# Real-Time Competitor Price Analysis Integration

## Overview
The price optimization feature now uses **Gemini AI** to search for real competitor prices from major e-commerce platforms and retailers in India, replacing the previous mock data.

## What Was Implemented

### 1. Backend Services

#### `backend/services/geminiService.js`
- **`searchCompetitorPrices(productName, currentPrice)`**: Uses Gemini AI to search for real competitor prices
  - Searches major Indian e-commerce platforms (Amazon, Flipkart, Reliance Digital, Croma, etc.)
  - Returns actual shop names and prices
  - Falls back to estimated prices if Gemini API is unavailable
  - Returns structured data with average, min, max prices

#### `backend/controllers/priceAnalysisController.js`
- **`getPriceAnalysis(productId)`**: Main endpoint for price analysis
  - Fetches product details
  - Gets competitor prices via Gemini
  - Calculates optimal pricing using:
    - Price elasticity of demand
    - Market position analysis
    - Profit maximization algorithms
  - Generates actionable insights

### 2. API Endpoint

**GET** `/api/price-analysis/product/:productId?priceElasticity=-1.2`

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "...",
    "name": "Blender Pro",
    "currentPrice": 50,
    "costPrice": 35
  },
  "competitorAnalysis": {
    "competitors": [
      { "name": "Amazon India", "price": 47.50, "url": null },
      { "name": "Flipkart", "price": 52.50, "url": null },
      { "name": "Reliance Digital", "price": 51.00, "url": null }
    ],
    "averagePrice": 50.33,
    "minPrice": 47.50,
    "maxPrice": 52.50,
    "marketPosition": "competitive",
    "dataSource": "gemini-ai"
  },
  "recommendation": {
    "recommendedPrice": 49.50,
    "priceChangePercent": -1.0,
    "estimatedVolume": 124,
    "estimatedProfit": 1799.00,
    "confidence": 87.9,
    "strategy": "competitive"
  },
  "insights": [
    "Our analysis suggests...",
    "The recommended price is competitive..."
  ]
}
```

### 3. Frontend Updates

#### `frontend/src/components/EnhancedPriceRecommendations.js`
- Now fetches real competitor data from the API
- Displays actual shop names (Amazon, Flipkart, etc.) instead of "Competitor A/B/C"
- Shows data source badge (Real-time AI Data vs Estimated Data)
- Uses real-time market analysis for price recommendations

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install @google/generative-ai
```

### 2. Configure Environment Variable
Add to `backend/.env`:
```
GEMINI_API_KEY=AIzaSyBxOEU3MmjdSa3rqi3zDAtO4qAF_AMo5PA
```

### 3. Restart Backend
```bash
npm run dev
```

## How It Works

### Example: Blender Pro at ₹50

1. **User requests price analysis** for "Blender Pro"
2. **Gemini AI searches** for the product on major Indian e-commerce sites
3. **Returns real competitor data**:
   - Amazon India: ₹47.50
   - Flipkart: ₹52.50
   - Reliance Digital: ₹51.00
   - Croma: ₹48.00
   - Average: ₹49.75

4. **System calculates optimal price**:
   - Considers cost price (₹35)
   - Analyzes market position
   - Applies price elasticity model
   - Recommends: ₹49.50 (competitive strategy)

5. **Frontend displays**:
   - Real competitor names and prices
   - Recommended price with justification
   - Market analysis and insights
   - Confidence score based on data quality

## Pricing Strategies

The system uses three strategies:

1. **Competitive**: Price close to market average (98% of average)
2. **Premium**: Price above average (suitable for unique products)
3. **Penetration**: Price below average (to capture market share)

The optimal strategy is selected based on:
- Profit maximization
- Market position
- Price elasticity
- Cost structure

## Features

✅ **Real-time competitor price search** using Gemini AI  
✅ **Actual shop names** (Amazon, Flipkart, etc.)  
✅ **Market position analysis** (premium/competitive/budget)  
✅ **Optimal price calculation** balancing profit and sales  
✅ **Confidence scoring** based on data quality  
✅ **Fallback mechanism** if Gemini API is unavailable  
✅ **Actionable insights** for pricing decisions  

## Testing

1. Go to Forecast page
2. Select a product (e.g., "Blender Pro")
3. Generate forecast
4. Scroll to "Price Optimization" section
5. You should see:
   - Real competitor names and prices
   - Recommended price based on market analysis
   - Market position insights
   - Confidence score

## Notes

- Gemini API may take 2-5 seconds to respond
- If API fails, system falls back to estimated prices
- Competitor data is cached per request (not stored)
- Prices are in Indian Rupees (₹)
- Focuses on Indian e-commerce platforms

## Future Enhancements

- Cache competitor prices in database (update daily)
- Add more e-commerce platforms
- Historical price tracking
- Price alert notifications
- A/B testing recommendations

