import Category from '../models/Category.js';
import Product from '../models/Product.js';
import SalesData from '../models/SalesData.js';

/**
 * Get analytics for a specific category
 * This provides detailed metrics about category performance
 */
export const getCategoryAnalytics = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { startDate, endDate } = req.query;
        
        // Validate category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        // Get products in this category
        const products = await Product.find({ category: categoryId });
        if (products.length === 0) {
            return res.status(200).json({
                category,
                products: [],
                metrics: {
                    totalSales: 0,
                    totalRevenue: 0,
                    totalProfit: 0,
                    message: 'No products found in this category'
                }
            });
        }
        
        // Get product IDs
        const productIds = products.map(product => product._id);
        
        // Build date filter
        const dateFilter = {};
        if (startDate) {
            dateFilter.date = { $gte: new Date(startDate) };
        }
        if (endDate) {
            dateFilter.date = { ...dateFilter.date, $lte: new Date(endDate) };
        }
        
        // Get sales data for these products
        const query = {
            productId: { $in: productIds },
            ...dateFilter
        };
        
        const salesData = await SalesData.find(query);
        
        // Calculate metrics
        const salesByProduct = {};
        let totalSales = 0;
        let totalRevenue = 0;
        let totalProfit = 0;
        
        salesData.forEach(sale => {
            const productId = sale.productId.toString();
            
            if (!salesByProduct[productId]) {
                salesByProduct[productId] = {
                    count: 0,
                    revenue: 0,
                    profit: 0
                };
            }
            
            salesByProduct[productId].count += sale.quantity;
            // For this example, we'll estimate revenue and profit
            const product = products.find(p => p._id.toString() === productId);
            if (product) {
                const revenue = sale.quantity * (product.price || 0);
                const profit = revenue * 0.3; // Assume 30% profit margin
                
                salesByProduct[productId].revenue += revenue;
                salesByProduct[productId].profit += profit;
                
                totalSales += sale.quantity;
                totalRevenue += revenue;
                totalProfit += profit;
            }
        });
        
        // Enhanced product data with sales info
        const enhancedProducts = products.map(product => {
            const productId = product._id.toString();
            const salesInfo = salesByProduct[productId] || { count: 0, revenue: 0, profit: 0 };
            
            return {
                _id: product._id,
                name: product.name,
                price: product.price,
                salesCount: salesInfo.count,
                revenue: salesInfo.revenue,
                profit: salesInfo.profit,
                inStock: product.currentStock > 0,
                // Generate engagement score as weighted combination of sales and profit
                engagementScore: Math.min(100, Math.round((salesInfo.count * 0.5 + salesInfo.profit * 0.005) || 0)),
                // Use actual category metrics from the database or set defaults if not present
                averageDwellTime: category.averageDwellTime || 0,
                averageVisitors: category.averageVisitors || 0,
            };
        });
        
        // Sort products by sales or profit for rankings
        const topProducts = [...enhancedProducts].sort((a, b) => b.profit - a.profit);
        const bottomProducts = [...enhancedProducts].sort((a, b) => a.profit - b.profit);
        
        // Use actual category metrics from the database or set defaults if not present
        const categoryMetrics = {
            engagementScore: category.engagementScore || 0,
            averageDwellTime: category.averageDwellTime || 0,
            crowdDensity: category.crowdDensity || 0,
            averageVisitors: category.averageVisitors || 0,
            rackNumber: category.rackNumber || 'N/A',
            locationInStore: category.locationInStore || 'unknown'
        };
        
        // Calculate improvement suggestions
        const suggestions = [];
        
        // If profit is low relative to sales
        if (totalProfit < totalSales * 10) {
            suggestions.push('Consider increasing prices or reducing costs for better profit margins');
        }
        
        // If engagement is low
        if (categoryMetrics.engagementScore < 70) {
            suggestions.push('Improve category visibility with better signage or displays');
        }
        
        // If dwell time is low
        if (categoryMetrics.averageDwellTime < 3) {
            suggestions.push('Add interactive displays or product demonstrations to increase dwell time');
        }
        
        // If location is not optimal
        if (categoryMetrics.locationInStore === 'back') {
            suggestions.push('Consider relocating to front or middle sections for better visibility');
        }
        
        // Generate performance data for charts
        const performanceData = [];
        if (salesData.length > 0) {
            // Group sales by date
            const salesByDate = {};
            salesData.forEach(sale => {
                const dateStr = sale.date.toISOString().split('T')[0];
                if (!salesByDate[dateStr]) {
                    salesByDate[dateStr] = {
                        date: dateStr,
                        sales: 0,
                        profit: 0,
                        engagement: 0,
                        visitors: 0
                    };
                }
                
                salesByDate[dateStr].sales += sale.quantity;
                
                // Calculate profit
                const product = products.find(p => p._id.toString() === sale.productId.toString());
                if (product) {
                    const revenue = sale.quantity * (product.price || 0);
                    const profit = revenue * (product.profitMargin || 0.3);
                    salesByDate[dateStr].profit += profit;
                }
            });
            
            // Convert to array and sort by date
            performanceData.push(...Object.values(salesByDate).sort((a, b) => 
                new Date(a.date) - new Date(b.date)
            ));
        }
        
        // Response with full analytics
        res.status(200).json({
            category: {
                ...category.toObject(),
                // Add period-specific metrics
                periodSales: totalSales,
                periodRevenue: totalRevenue,
                periodProfit: totalProfit,
                engagementScore: categoryMetrics.engagementScore,
                averageDwellTime: categoryMetrics.averageDwellTime,
                crowdDensity: categoryMetrics.crowdDensity,
                averageVisitors: categoryMetrics.averageVisitors,
                rackNumber: categoryMetrics.rackNumber,
                locationInStore: categoryMetrics.locationInStore,
                performanceData: performanceData // Add performance data for charts
            },
            metrics: {
                totalSales,
                totalRevenue,
                totalProfit,
                averageSalesPerProduct: totalSales / products.length,
                topSellingProduct: topProducts[0]?.name || 'N/A',
                lowestSellingProduct: bottomProducts[0]?.name || 'N/A',
            },
            products: enhancedProducts,
            topProducts: topProducts.slice(0, 5),
            bottomProducts: bottomProducts.slice(0, 5),
            suggestions: suggestions.length > 0 ? suggestions : ['No specific improvements needed at this time']
        });
    } catch (error) {
        console.error('Error getting category analytics:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update engagement metrics for a category
 * This allows adding real engagement data from store sensors
 */
export const updateCategoryEngagement = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const {
            engagementScore,
            averageDwellTime,
            interestRate,
            crowdDensity,
            averageVisitors,
            rackNumber,
            locationInStore
        } = req.body;
        
        // Validate category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        // Update only provided fields
        if (engagementScore !== undefined) category.engagementScore = engagementScore;
        if (averageDwellTime !== undefined) category.averageDwellTime = averageDwellTime;
        if (interestRate !== undefined) category.interestRate = interestRate;
        if (crowdDensity !== undefined) category.crowdDensity = crowdDensity;
        if (averageVisitors !== undefined) category.averageVisitors = averageVisitors;
        if (rackNumber !== undefined) category.rackNumber = rackNumber;
        if (locationInStore !== undefined) category.locationInStore = locationInStore;
        
        // Add to performance history
        const now = new Date();
        const historyEntry = {
            date: now,
            engagementScore: engagementScore || category.engagementScore,
            visitorCount: averageVisitors || category.averageVisitors
        };
        
        if (!category.performanceHistory) {
            category.performanceHistory = [];
        }
        
        category.performanceHistory.push(historyEntry);
        
        // Save updated category
        await category.save();
        
        res.status(200).json({
            message: 'Category engagement metrics updated successfully',
            category
        });
    } catch (error) {
        console.error('Error updating category engagement:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get category rankings based on various metrics
 */
export const getCategoryRankings = async (req, res) => {
    try {
        // Get all categories
        const categories = await Category.find();
        
        // Get products for all categories
        const products = await Product.find();
        
        // Get all sales data (optionally with date filter)
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate) {
            dateFilter.date = { $gte: new Date(startDate) };
        }
        if (endDate) {
            dateFilter.date = { ...dateFilter.date, $lte: new Date(endDate) };
        }
        
        const salesData = await SalesData.find(dateFilter);
        
        // Group products by category
        const productsByCategory = products.reduce((acc, product) => {
            const categoryId = product.category.toString();
            if (!acc[categoryId]) {
                acc[categoryId] = [];
            }
            acc[categoryId].push(product);
            return acc;
        }, {});
        
        // Calculate metrics for each category
        const categoryMetrics = categories.map(category => {
            const categoryId = category._id.toString();
            const categoryProducts = productsByCategory[categoryId] || [];
            
            // Calculate sales for this category
            let totalSales = 0;
            let totalRevenue = 0;
            let totalProfit = 0;
            
            const productIds = categoryProducts.map(p => p._id.toString());
            
            salesData.forEach(sale => {
                if (productIds.includes(sale.productId.toString())) {
                    const product = categoryProducts.find(p => p._id.toString() === sale.productId.toString());
                    if (product) {
                        totalSales += sale.quantity;
                        const revenue = sale.quantity * (product.price || 0);
                        const profit = revenue * 0.3; // Assume 30% profit margin
                        
                        totalRevenue += revenue;
                        totalProfit += profit;
                    }
                }
            });
            
            // Combined score based on multiple metrics
            const combinedScore = 
                (category.engagementScore || 0) * 0.3 +
                totalProfit * 0.003 +
                totalSales * 0.2 +
                (category.averageVisitors || 0) * 0.1;
            
            return {
                _id: category._id,
                name: category.name,
                engagementScore: category.engagementScore || 0,
                averageDwellTime: category.averageDwellTime || 0,
                crowdDensity: category.crowdDensity || 0,
                locationInStore: category.locationInStore || 'middle',
                productCount: categoryProducts.length,
                totalSales,
                totalRevenue,
                totalProfit,
                combinedScore
            };
        });
        
        // Sort categories by different metrics
        const bySales = [...categoryMetrics].sort((a, b) => b.totalSales - a.totalSales);
        const byProfit = [...categoryMetrics].sort((a, b) => b.totalProfit - a.totalProfit);
        const byEngagement = [...categoryMetrics].sort((a, b) => b.engagementScore - a.engagementScore);
        const byOverall = [...categoryMetrics].sort((a, b) => b.combinedScore - a.combinedScore);
        
        res.status(200).json({
            rankings: {
                byProfit: byProfit.map((cat, index) => ({ ...cat, rank: index + 1 })),
                bySales: bySales.map((cat, index) => ({ ...cat, rank: index + 1 })),
                byEngagement: byEngagement.map((cat, index) => ({ ...cat, rank: index + 1 })),
                byOverall: byOverall.map((cat, index) => ({ ...cat, rank: index + 1 }))
            },
            dateRange: {
                start: startDate || 'all time',
                end: endDate || 'present'
            }
        });
    } catch (error) {
        console.error('Error getting category rankings:', error);
        res.status(500).json({ message: error.message });
    }
};

export default {
    getCategoryAnalytics,
    updateCategoryEngagement,
    getCategoryRankings
};
