import Product from '../models/Product.js';
import SalesData from '../models/SalesData.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

// Main rankings endpoint - gets comprehensive data
export const getRankings = async (req, res) => {
    try {
        const daysBack = parseInt(req.query.days) || 30;
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setDate(currentDate.getDate() - daysBack);
        
        // First get all products to ensure new products are included
        const allProducts = await Product.find().populate('category').lean();
        
        // Get sales data for the period
        const salesByProduct = await SalesData.aggregate([
            { $match: { date: { $gte: startDate } } },
            { $group: {
                _id: '$productId',
                totalQuantity: { $sum: '$quantity' },
                totalRevenue: { $sum: '$quantity' } // Will multiply by price later
            }}
        ]);
        
        // Create sales data map for faster lookup
        const salesDataMap = {};
        salesByProduct.forEach(item => {
            salesDataMap[item._id.toString()] = item;
        });
        
        // Process product rankings with all metrics
        const productRankings = allProducts.map(product => {
            const salesData = salesDataMap[product._id.toString()] || { totalQuantity: 0, totalRevenue: 0 };
            const totalRevenue = salesData.totalQuantity * (product.price || 0);
            const profit = totalRevenue * (product.profitMargin || 0.3);
            
            // Calculate engagement score
            const dailySalesRate = salesData.totalQuantity / daysBack;
            const engagement = Math.min(100, dailySalesRate * 20);
            
            // Determine trend
            let trend = 'needs_improvement';
            if (salesData.totalQuantity >= 100) trend = 'top_performer';
            else if (salesData.totalQuantity >= 80) trend = 'strong';
            else if (salesData.totalQuantity >= 60) trend = 'average';
            
            return {
                productId: product._id.toString(),
                productName: product.name,
                categoryId: product.category ? product.category._id.toString() : null,
                categoryName: product.category ? product.category.name : 'Uncategorized',
                totalQuantity: salesData.totalQuantity,
                totalRevenue: totalRevenue,
                price: product.price || 0,
                profit: Math.round(profit),
                engagement: Math.round(engagement),
                engagementScore: product.category ? product.category.engagementScore || 0 : 0,
                stockStatus: getStockStatus(product.currentStock),
                currentStock: product.currentStock || 0,
                trend: trend,
                lastUpdated: product.updatedAt || product.lastUpdated || new Date()
            };
        });
        
        // Sort by sales volume
        productRankings.sort((a, b) => b.totalQuantity - a.totalQuantity);
        
        // Process category rankings by aggregating product data
        const productsByCategory = {};
        productRankings.forEach(product => {
            if (!product.categoryId) return;
            
            if (!productsByCategory[product.categoryId]) {
                productsByCategory[product.categoryId] = {
                    categoryId: product.categoryId,
                    categoryName: product.categoryName,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    products: [],
                    engagementScore: product.engagementScore
                };
            }
            
            productsByCategory[product.categoryId].totalQuantity += product.totalQuantity;
            productsByCategory[product.categoryId].totalRevenue += product.totalRevenue;
            productsByCategory[product.categoryId].products.push(product.productId);
        });
        
        // Convert to array for sorting
        const categoryRankings = Object.values(productsByCategory).map(category => ({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            totalQuantity: category.totalQuantity,
            totalRevenue: category.totalRevenue,
            productCount: new Set(category.products).size,
            engagementScore: category.engagementScore
        }));
        
        // Sort categories by sales volume
        categoryRankings.sort((a, b) => b.totalQuantity - a.totalQuantity);
        
        // Calculate overall metrics
        const totalQuantity = productRankings.reduce((sum, product) => sum + product.totalQuantity, 0);
        const totalRevenue = productRankings.reduce((sum, product) => sum + product.totalRevenue, 0);
        
        // Generate improvement suggestions for lower-performing products
        const improvementSuggestions = productRankings
            .filter(p => p.trend === 'needs_improvement' || p.trend === 'average')
            .slice(0, 5)
            .map(product => ({
                productId: product.productId,
                productName: product.productName,
                suggestions: generateSuggestionsForProduct(product)
            }));
        
        return res.status(200).json({
            productRankings: productRankings.slice(0, 10),
            categoryRankings: categoryRankings.slice(0, 5),
            overallMetrics: {
                totalSales: totalQuantity,
                totalRevenue,
                uniqueProductCount: salesByProduct.length,
                averageSalePerDay: Math.round(totalQuantity / daysBack),
                period: `${daysBack} days`
            },
            improvementSuggestions,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error generating rankings:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Failed to generate rankings',
            error: error.message
        });
    }
};

// Get products ranked by a specific metric
export const getProductsByMetric = async (req, res) => {
    try {
        const metric = req.params.metric;
        const daysBack = parseInt(req.query.days) || 30;
        
        // Validate metric
        const validMetrics = ['sales', 'revenue', 'profit', 'engagement'];
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({ message: `Invalid metric: ${metric}` });
        }
        
        // Get base rankings
        const rankings = await getBaseRankings(daysBack);
        
        // Sort by requested metric
        let sortedProducts;
        switch (metric) {
            case 'sales':
                sortedProducts = rankings.sort((a, b) => b.totalQuantity - a.totalQuantity);
                break;
            case 'revenue':
                sortedProducts = rankings.sort((a, b) => b.totalRevenue - a.totalRevenue);
                break;
            case 'profit':
                sortedProducts = rankings.sort((a, b) => b.profit - a.profit);
                break;
            case 'engagement':
                sortedProducts = rankings.sort((a, b) => b.engagement - a.engagement);
                break;
            default:
                sortedProducts = rankings.sort((a, b) => b.totalQuantity - a.totalQuantity);
        }
        
        return res.status(200).json({
            metric,
            rankings: sortedProducts.slice(0, 10)
        });
    } catch (error) {
        console.error(`Error getting products by ${req.params.metric}:`, error);
        return res.status(500).json({ 
            success: false,
            message: `Failed to get products by ${req.params.metric}`,
            error: error.message
        });
    }
};

// Get categories ranked by a specific metric
export const getCategoriesByMetric = async (req, res) => {
    try {
        const metric = req.params.metric;
        const daysBack = parseInt(req.query.days) || 30;
        
        // Validate metric
        const validMetrics = ['sales', 'revenue', 'engagement'];
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({ message: `Invalid metric: ${metric}` });
        }
        
        // Get the main rankings data first
        const { productRankings, categoryRankings } = await getAggregatedRankings(daysBack);
        
        // Sort by requested metric
        let sortedCategories;
        switch (metric) {
            case 'sales':
                sortedCategories = categoryRankings.sort((a, b) => b.totalQuantity - a.totalQuantity);
                break;
            case 'revenue':
                sortedCategories = categoryRankings.sort((a, b) => b.totalRevenue - a.totalRevenue);
                break;
            case 'engagement':
                sortedCategories = categoryRankings.sort((a, b) => b.engagementScore - a.engagementScore);
                break;
            default:
                sortedCategories = categoryRankings.sort((a, b) => b.totalQuantity - a.totalQuantity);
        }
        
        return res.status(200).json({
            metric,
            rankings: sortedCategories.slice(0, 5)
        });
    } catch (error) {
        console.error(`Error getting categories by ${req.params.metric}:`, error);
        return res.status(500).json({ 
            success: false,
            message: `Failed to get categories by ${req.params.metric}`,
            error: error.message
        });
    }
};

// Get historical rankings data
export const getRankingsHistory = async (req, res) => {
    try {
        const daysBack = parseInt(req.query.days) || 30;
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setDate(currentDate.getDate() - daysBack);
        
        // Get daily sales aggregation
        const dailySales = await SalesData.aggregate([
            { $match: { date: { $gte: startDate } } },
            { $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
            }},
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: false } },
            { $lookup: {
                from: 'categories',
                localField: 'product.category',
                foreignField: '_id',
                as: 'category'
            }},
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: false } },
            { $group: {
                _id: { 
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" },
                    categoryId: "$category._id"
                },
                categoryName: { $first: "$category.name" },
                totalQuantity: { $sum: "$quantity" }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);
        
        // Process for chart display
        const dateMap = {}; // To track unique dates
        const categoryData = {}; // To organize by category
        
        dailySales.forEach(item => {
            const dateStr = `${item._id.year}-${item._id.month}-${item._id.day}`;
            if (!dateMap[dateStr]) {
                dateMap[dateStr] = true;
            }
            
            const catId = item._id.categoryId.toString();
            if (!categoryData[catId]) {
                categoryData[catId] = {
                    categoryId: catId,
                    categoryName: item.categoryName,
                    dailyData: {}
                };
            }
            
            categoryData[catId].dailyData[dateStr] = item.totalQuantity;
        });
        
        // Convert to arrays for the response
        const dates = Object.keys(dateMap).sort();
        const categories = Object.values(categoryData).map(cat => {
            return {
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                data: dates.map(date => cat.dailyData[date] || 0)
            };
        });
        
        return res.status(200).json({
            dates,
            categories,
            period: `${daysBack} days`
        });
    } catch (error) {
        console.error('Error fetching rankings history:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Failed to fetch rankings history',
            error: error.message
        });
    }
};

// Get product-specific improvement suggestions
export const getProductSuggestions = async (req, res) => {
    try {
        const productId = req.params.productId;
        
        // Fetch product with category
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Generate suggestions
        const suggestions = [];
        
        // Stock suggestions
        if (product.currentStock <= product.reorderPoint) {
            suggestions.push({
                type: 'inventory',
                title: 'Low Inventory Alert',
                description: 'Current stock is below reorder point. Consider placing an order soon.',
                impact: 'high'
            });
        } else if (product.currentStock > product.reorderPoint * 3) {
            suggestions.push({
                type: 'inventory',
                title: 'Excess Inventory',
                description: 'You have excess inventory. Consider running a promotion.',
                impact: 'medium'
            });
        }
        
        // Price suggestions
        const similarProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id }
        });
        
        if (similarProducts.length > 0) {
            const avgPrice = similarProducts.reduce((sum, p) => sum + p.price, 0) / similarProducts.length;
            
            if (product.price > avgPrice * 1.2) {
                suggestions.push({
                    type: 'price',
                    title: 'Price Optimization',
                    description: `Your price (₹${product.price}) is significantly higher than category average (₹${avgPrice.toFixed(2)}). Consider a price reduction.`,
                    impact: 'high'
                });
            }
        }
        
        // Marketing suggestions
        suggestions.push({
            type: 'marketing',
            title: 'Increase Visibility',
            description: 'Consider repositioning this product in store or running a targeted promotion.',
            impact: 'medium'
        });
        
        return res.status(200).json({
            product: {
                id: product._id,
                name: product.name,
                category: product.category.name,
                price: product.price,
                currentStock: product.currentStock
            },
            suggestions
        });
    } catch (error) {
        console.error('Error generating product suggestions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate product suggestions',
            error: error.message
        });
    }
};

// Helper function to determine stock status
const getStockStatus = (currentStock) => {
    if (!currentStock || currentStock <= 10) {
        return 'Low';
    } else if (currentStock <= 30) {
        return 'Medium';
    } else {
        return 'Good';
    }
};

// Helper to generate improvement suggestions
const generateSuggestionsForProduct = (product) => {
    const suggestions = [];
    
    // Basic suggestions based on available metrics
    if (product.totalQuantity < 50) {
        suggestions.push({
            type: 'marketing',
            title: 'Increase Marketing',
            description: 'Sales are low. Consider increasing marketing efforts.',
            impact: 'high'
        });
    }
    
    if (product.stockStatus === 'Low') {
        suggestions.push({
            type: 'inventory',
            title: 'Restock Soon',
            description: 'Inventory is low. Place an order to avoid stockouts.',
            impact: 'high'
        });
    }
    
    if (product.engagement < 40) {
        suggestions.push({
            type: 'placement',
            title: 'Improve Store Placement',
            description: 'Product has low engagement. Consider better store placement.',
            impact: 'medium'
        });
    }
    
    return suggestions;
};

// Helper function to get base product rankings
const getBaseRankings = async (daysBack) => {
    const currentDate = new Date();
    const startDate = new Date();
    startDate.setDate(currentDate.getDate() - daysBack);
    
    // Fetch all products
    const allProducts = await Product.find().populate('category').lean();
    
    // Get sales data
    const salesByProduct = await SalesData.aggregate([
        { $match: { date: { $gte: startDate } } },
        { $group: {
            _id: '$productId',
            totalQuantity: { $sum: '$quantity' },
            totalRevenue: { $sum: '$quantity' }
        }}
    ]);
    
    // Map for lookups
    const salesDataMap = {};
    salesByProduct.forEach(item => {
        salesDataMap[item._id.toString()] = item;
    });
    
    // Process product data
    return allProducts.map(product => {
        const salesData = salesDataMap[product._id.toString()] || { totalQuantity: 0, totalRevenue: 0 };
        const totalRevenue = salesData.totalQuantity * (product.price || 0);
        const profit = totalRevenue * (product.profitMargin || 0.3);
        const dailySalesRate = salesData.totalQuantity / daysBack;
        const engagement = Math.min(100, dailySalesRate * 20);
        
        return {
            productId: product._id.toString(),
            productName: product.name,
            categoryId: product.category ? product.category._id.toString() : null,
            categoryName: product.category ? product.category.name : 'Uncategorized',
            totalQuantity: salesData.totalQuantity,
            totalRevenue: totalRevenue,
            price: product.price || 0,
            profit: Math.round(profit),
            engagement: Math.round(engagement),
            stockStatus: getStockStatus(product.currentStock)
        };
    });
};

// Helper function to get product and category rankings
const getAggregatedRankings = async (daysBack) => {
    // Get base product rankings
    const productRankings = await getBaseRankings(daysBack);
    
    // Process category rankings
    const productsByCategory = {};
    productRankings.forEach(product => {
        if (!product.categoryId) return;
        
        if (!productsByCategory[product.categoryId]) {
            productsByCategory[product.categoryId] = {
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                totalQuantity: 0,
                totalRevenue: 0,
                products: []
            };
        }
        
        productsByCategory[product.categoryId].totalQuantity += product.totalQuantity;
        productsByCategory[product.categoryId].totalRevenue += product.totalRevenue;
        productsByCategory[product.categoryId].products.push(product.productId);
    });
    
    // Generate category rankings
    const categoryRankings = Object.values(productsByCategory).map(category => ({
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        totalQuantity: category.totalQuantity,
        totalRevenue: category.totalRevenue,
        productCount: new Set(category.products).size,
        engagementScore: 0 // Fetch from category if needed
    }));
    
    return { productRankings, categoryRankings };
};

export default {
    getRankings,
    getRankingsHistory,
    getProductSuggestions,
    getProductsByMetric,
    getCategoriesByMetric
};