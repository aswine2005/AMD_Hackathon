import Product from '../models/Product.js';
import SalesData from '../models/SalesData.js';
import { searchCompetitorPrices, calculateOptimalPrice } from '../services/geminiService.js';

/**
 * Get competitor prices and optimal pricing recommendation for a product
 */
export const getPriceAnalysis = async (req, res) => {
  try {
    const { productId } = req.params;
    const { priceElasticity = -1.2 } = req.query;

    // Fetch product details
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get recent sales volume for base volume calculation
    const recentSales = await SalesData.find({ productId })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    
    const baseVolume = recentSales.length > 0
      ? recentSales.reduce((sum, sale) => sum + sale.quantity, 0) / recentSales.length
      : 100;

    // Search for competitor prices using Gemini
    const competitorData = await searchCompetitorPrices(
      product.name,
      product.price
    );

    // Calculate cost price (if not set, estimate from profit margin)
    const costPrice = product.price * (1 - (product.profitMargin || 0.3));

    // Calculate optimal price
    const priceRecommendation = calculateOptimalPrice(
      product.price,
      costPrice,
      competitorData,
      parseFloat(priceElasticity),
      baseVolume
    );

    // Generate insights
    const insights = generatePriceInsights(
      product.price,
      priceRecommendation,
      competitorData
    );

    return res.status(200).json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        currentPrice: product.price,
        costPrice: costPrice
      },
      competitorAnalysis: {
        competitors: competitorData.competitors,
        averagePrice: competitorData.averagePrice,
        minPrice: competitorData.minPrice,
        maxPrice: competitorData.maxPrice,
        marketPosition: competitorData.marketPosition,
        notes: competitorData.notes,
        dataSource: competitorData.isFallback ? 'estimated' : 'gemini-ai',
        timestamp: competitorData.timestamp
      },
      recommendation: {
        recommendedPrice: priceRecommendation.recommendedPrice,
        optimalPrice: priceRecommendation.optimalPrice,
        currentPrice: priceRecommendation.currentPrice,
        costPrice: priceRecommendation.costPrice,
        priceChangePercent: priceRecommendation.priceChangePercent,
        strategy: priceRecommendation.strategy,
        estimatedVolume: priceRecommendation.estimatedVolume,
        estimatedProfit: priceRecommendation.estimatedProfit,
        estimatedRevenue: priceRecommendation.estimatedRevenue,
        confidence: priceRecommendation.confidence,
        marketAnalysis: priceRecommendation.marketAnalysis
      },
      insights: insights
    });
  } catch (error) {
    console.error('Error in price analysis:', error);
    return res.status(500).json({
      message: 'Failed to analyze pricing',
      error: error.message
    });
  }
};

/**
 * Generate textual insights for price recommendation
 */
const generatePriceInsights = (currentPrice, recommendation, competitorData) => {
  const insights = [];
  const { recommendedPrice, priceChangePercent, strategy, marketAnalysis } = recommendation;

  // Price change insight
  if (Math.abs(priceChangePercent) < 2) {
    insights.push('Your current price is very close to optimal based on market analysis.');
  } else if (priceChangePercent > 0) {
    insights.push(
      `Our analysis suggests a price increase of ${priceChangePercent.toFixed(1)}% could improve profitability. ` +
      `This price point balances profit maximization with market competitiveness.`
    );
  } else {
    insights.push(
      `A strategic price reduction of ${Math.abs(priceChangePercent).toFixed(1)}% could increase sales volume ` +
      `and capture market share while maintaining profitability.`
    );
  }

  // Market position insight
  const priceVsAverage = marketAnalysis.priceVsAverage;
  if (priceVsAverage > 10) {
    insights.push(
      `Your recommended price is ${priceVsAverage.toFixed(1)}% above market average, suggesting premium positioning. ` +
      `This works if your product has unique features or strong brand value.`
    );
  } else if (priceVsAverage < -10) {
    insights.push(
      `Your recommended price is ${Math.abs(priceVsAverage).toFixed(1)}% below market average, enabling market penetration. ` +
      `This strategy can help capture price-sensitive customers.`
    );
  } else {
    insights.push(
      `The recommended price is competitive with market alternatives (${priceVsAverage > 0 ? '+' : ''}${priceVsAverage.toFixed(1)}% vs average) ` +
      `while maximizing your profitability.`
    );
  }

  // Strategy-specific insights
  if (strategy === 'premium') {
    insights.push(
      'Premium pricing strategy: Position above market average to emphasize quality and value. ' +
      'Ensure your product justifies the premium through features, brand, or service.'
    );
  } else if (strategy === 'penetration') {
    insights.push(
      'Market penetration strategy: Price below average to gain market share quickly. ' +
      'Monitor margins and consider gradual price increases as market share grows.'
    );
  } else {
    insights.push(
      'Competitive pricing strategy: Align with market average to maintain competitive position. ' +
      'Focus on differentiation through service, quality, or customer experience.'
    );
  }

  // Competitor count insight
  if (competitorData.competitors && competitorData.competitors.length >= 5) {
    insights.push(
      `Analysis based on ${competitorData.competitors.length} competitor prices from major retailers. ` +
      `${competitorData.isFallback ? 'Note: Using estimated prices. For real-time data, ensure Gemini API is configured.' : 'Real-time market data from AI search.'}`
    );
  }

  return insights;
};

