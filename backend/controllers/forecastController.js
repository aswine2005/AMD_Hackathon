import Product from '../models/Product.js';
import Category from '../models/Category.js';
import {
  predictProductSeries,
  predictCategorySeries,
  predictOverallSeries,
} from '../services/forecastModelService.js';

export const generateProductForecast = async (req, res) => {
  try {
    const { productId } = req.params;
    const days = parseInt(req.query.days || '7', 10);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const result = await predictProductSeries(productId, days, { product });

    return res.status(200).json({
      success: true,
      forecast: result.forecast,
      product: {
        name: product.name,
        price: product.price,
        category: product.category,
      },
      metrics: {
        confidenceLevel: result.metadata.confidence,
        method: result.metadata.method,
        trainingSamples: result.metadata.trainingSamples ?? null,
        validationLoss: result.metadata.validationLoss ?? null,
        trainedAt: result.metadata.trainedAt ?? null,
        fallbackReason: result.metadata.fallbackReason ?? null,
        message: result.metadata.fallbackReason
          ? `Fallback used: ${result.metadata.fallbackReason}`
          : `Model trained on ${result.metadata.trainingSamples || 0} samples`,
      },
      type:
        result.metadata.method === 'ml'
          ? 'ml-trained'
          : result.metadata.method,
    });
  } catch (error) {
    console.error('Error generating product forecast:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const generateCategoryForecast = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const days = parseInt(req.query.days || '7', 10);

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const result = await predictCategorySeries(categoryId, days);

    // Preserve original response shape (forecast array only)
    return res.status(200).json(result.forecast);
  } catch (error) {
    console.error('Error generating category forecast:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const generateOverallForecast = async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const result = await predictOverallSeries(days);

    return res.status(200).json({
      success: true,
      forecast: result.forecast,
      metrics: {
        confidence: result.metadata.confidence,
        method: result.metadata.method,
        productCount: result.metadata.productCount || null,
        fallbackReason: result.metadata.fallbackReason || null,
      },
      type: result.metadata.method,
    });
  } catch (error) {
    console.error('Error generating overall forecast:', error);
    return res.status(500).json({ message: error.message });
  }
};

export default {
  generateProductForecast,
  generateCategoryForecast,
  generateOverallForecast,
};
