import express from 'express';
import { 
    getCategoryAnalytics, 
    updateCategoryEngagement,
    getCategoryRankings
} from '../controllers/categoryAnalyticsController.js';

const router = express.Router();

// Get detailed analytics for a specific category
router.get('/:categoryId/analytics', getCategoryAnalytics);

// Update engagement metrics for a category
router.put('/:categoryId/engagement', updateCategoryEngagement);

// Get rankings of all categories
router.get('/category-rankings', getCategoryRankings);

export default router;
