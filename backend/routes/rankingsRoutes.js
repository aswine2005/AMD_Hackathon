import express from 'express';
import rankingsController from '../controllers/rankingsController.js';

const router = express.Router();

// Get comprehensive rankings data (products & categories)
// GET /api/rankings?days=30
router.get('/', rankingsController.getRankings);

// Get historical performance for trend analysis
// GET /api/rankings/history?days=30
router.get('/history', rankingsController.getRankingsHistory);

// Get improvement suggestions for products
// GET /api/rankings/suggestions/:productId
router.get('/suggestions/:productId', rankingsController.getProductSuggestions);

// Get products ranked by a specific metric (e.g., sales, profit, engagement)
// GET /api/rankings/products/by/:metric?days=30
router.get('/products/by/:metric', rankingsController.getProductsByMetric);

// Get categories ranked by a specific metric
// GET /api/rankings/categories/by/:metric?days=30
router.get('/categories/by/:metric', rankingsController.getCategoriesByMetric);

export default router;
