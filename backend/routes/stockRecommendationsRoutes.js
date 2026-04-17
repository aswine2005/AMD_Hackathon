import express from 'express';
import { getStockRecommendations, generateEnhancedRecommendations } from '../controllers/stockRecommendationsController.js';

const router = express.Router();

// Get stock recommendations for a specific product using provided forecast data
router.post('/products/:productId', getStockRecommendations);

// Get enhanced stock recommendations with automatically generated forecast
router.post('/products/:productId/enhanced', generateEnhancedRecommendations);

// Get bulk recommendations for multiple products
router.post('/bulk-recommendations', async (req, res) => {
    try {
        const { productIds } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'Product IDs are required' });
        }
        
        // Process each product in parallel
        const recommendationPromises = productIds.map(productId => {
            // Create a mock request and response to reuse our existing controller
            const mockReq = {
                params: { productId },
                body: req.body.forecastOptions || {}
            };
            
            // Create a mock response to capture the result
            const mockRes = {
                status: function(statusCode) {
                    this.statusCode = statusCode;
                    return this;
                },
                json: function(data) {
                    this.data = data;
                    return this;
                }
            };
            
            // Use the enhanced recommendations controller
            return generateEnhancedRecommendations(mockReq, mockRes)
                .then(() => {
                    return {
                        productId,
                        statusCode: mockRes.statusCode,
                        recommendations: mockRes.data
                    };
                });
        });
        
        // Wait for all recommendations to be processed
        const results = await Promise.all(recommendationPromises);
        
        return res.status(200).json({
            totalProducts: results.length,
            recommendations: results
        });
    } catch (error) {
        console.error('Error processing bulk recommendations:', error);
        return res.status(500).json({ message: 'Error processing bulk recommendations', error: error.message });
    }
});

// Get stock efficiency metrics for all products
router.get('/efficiency-metrics', async (req, res) => {
    try {
        // This endpoint will be implemented to provide inventory efficiency metrics
        // for business analytics and reporting purposes
        res.status(501).json({ message: 'This endpoint is not yet implemented' });
    } catch (error) {
        console.error('Error fetching efficiency metrics:', error);
        res.status(500).json({ message: 'Error fetching efficiency metrics', error: error.message });
    }
});

export default router;
