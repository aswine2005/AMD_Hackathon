import express from 'express';
import {
    generateProductForecast,
    generateCategoryForecast,
    generateOverallForecast
} from '../controllers/forecastController.js';

const router = express.Router();

// Middleware to handle request timeouts
const timeoutMiddleware = (req, res, next) => {
  // Set timeout to 15 seconds
  req.setTimeout(15000, () => {
    console.warn(`Request timeout for path: ${req.path}`);
    if (!res.headersSent) {
      return res.status(503).json({
        message: 'Request timeout - forecast generation is taking too long',
        success: false,
        // Send minimal fallback data so frontend can still show something
        forecast: Array(7).fill().map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          return {
            date: date.toISOString(),
            predictedQuantity: 5,
            upperBound: 8,
            lowerBound: 3,
            isWeekend: [0, 6].includes(date.getDay())
          };
        }),
        metrics: {
          confidenceLevel: 'Low',
          mape: 35,
          message: 'Timeout occurred - showing estimated forecast'
        },
        type: 'fallback'
      });
    }
  });
  next();
};

// GET forecast for a specific product
router.get('/product/:productId', timeoutMiddleware, generateProductForecast);

// GET forecast for an entire category
router.get('/category/:categoryId', timeoutMiddleware, generateCategoryForecast);

// GET overall forecast across all categories
router.get('/overall', timeoutMiddleware, generateOverallForecast);

export default router;
