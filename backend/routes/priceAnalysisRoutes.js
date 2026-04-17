import express from 'express';
import { getPriceAnalysis } from '../controllers/priceAnalysisController.js';

const router = express.Router();

// GET price analysis and competitor prices for a product
router.get('/product/:productId', getPriceAnalysis);

export default router;

