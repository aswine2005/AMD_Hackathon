import express from 'express';
import { getTopProducts, getTopCategories, getSalesRankings } from '../controllers/analyticsController.js';

const router = express.Router();

// GET top selling products
router.get('/top-products', getTopProducts);

// GET top selling categories 
router.get('/top-categories', getTopCategories);

// GET comprehensive sales rankings (both products and categories)
router.get('/rankings', getSalesRankings);

export default router;
