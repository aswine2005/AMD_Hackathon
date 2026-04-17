import SalesData from '../models/SalesData.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

/**
 * Get top selling products by quantity
 */
export const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topProducts = await SalesData.aggregate([
      // Group by productId and sum quantities
      { 
        $group: { 
          _id: '$productId', 
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 } // Count of sales entries
        } 
      },
      // Sort by total quantity (descending)
      { $sort: { totalQuantity: -1 } },
      // Limit to top N products
      { $limit: parseInt(limit) },
      // Look up product details
      { 
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      // Unwind the product array
      { $unwind: '$product' },
      // Look up category details
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      // Unwind the category array (may be empty)
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      // Project the final output format
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$product.name',
          categoryId: '$category._id',
          categoryName: '$category.name',
          totalQuantity: 1,
          totalSalesEntries: '$count',
          currentStock: '$product.currentStock',
          price: '$product.price',
          revenue: { $multiply: ['$totalQuantity', '$product.price'] }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: topProducts.length,
      data: topProducts
    });
  } catch (error) {
    console.error('Error getting top products:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get top selling categories by quantity
 */
export const getTopCategories = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get category sales data
    const categoryRankings = await SalesData.aggregate([
      // Join with products to get category ID
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      // Unwind the product array
      { $unwind: '$product' },
      // Group by category and sum quantities
      {
        $group: {
          _id: '$product.category',
          totalQuantity: { $sum: '$quantity' },
          revenue: { $sum: { $multiply: ['$quantity', '$product.price'] } },
          uniqueProducts: { $addToSet: '$productId' }
        }
      },
      // Add category lookup
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      // Unwind the category array
      { $unwind: '$category' },
      // Sort by total quantity (descending)
      { $sort: { totalQuantity: -1 } },
      // Limit to top N categories
      { $limit: parseInt(limit) },
      // Project the final output format
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: '$category.name',
          totalQuantity: 1,
          totalRevenue: '$revenue',
          uniqueProductCount: { $size: '$uniqueProducts' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: categoryRankings.length,
      data: categoryRankings
    });
  } catch (error) {
    console.error('Error getting top categories:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get comprehensive sales rankings by both products and categories
 */
export const getSalesRankings = async (req, res) => {
  try {
    // Get today's date and date 30 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Get products ranked by sales volume
    const productRankings = await SalesData.aggregate([
      // Only include sales from the last 30 days
      { $match: { date: { $gte: thirtyDaysAgo } } },
      // Group by productId
      { 
        $group: { 
          _id: '$productId', 
          totalQuantity: { $sum: '$quantity' }
        } 
      },
      // Sort by total quantity (descending)
      { $sort: { totalQuantity: -1 } },
      // Limit to top 10 products
      { $limit: 10 },
      // Look up product details
      { 
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      // Unwind the product array
      { $unwind: '$product' },
      // Look up category
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      // Unwind the category array
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      // Project the final format
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$product.name',
          categoryName: '$category.name',
          totalQuantity: 1,
          currentStock: '$product.currentStock',
          price: '$product.price',
          revenue: { $multiply: ['$totalQuantity', '$product.price'] },
          // Calculate stock status
          stockStatus: {
            $cond: {
              if: { $lte: ['$product.currentStock', 10] },
              then: 'Low',
              else: {
                $cond: {
                  if: { $lte: ['$product.currentStock', 30] },
                  then: 'Medium',
                  else: 'Good'
                }
              }
            }
          }
        }
      }
    ]);
    
    // Get categories ranked by sales volume
    const categoryRankings = await SalesData.aggregate([
      // Only include sales from the last 30 days
      { $match: { date: { $gte: thirtyDaysAgo } } },
      // Join with products to get category
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      // Unwind the product array
      { $unwind: '$product' },
      // Group by category
      {
        $group: {
          _id: '$product.category',
          totalQuantity: { $sum: '$quantity' },
          revenue: { $sum: { $multiply: ['$quantity', '$product.price'] } },
          uniqueProducts: { $addToSet: '$productId' }
        }
      },
      // Look up category details
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      // Unwind the category array
      { $unwind: '$category' },
      // Sort by total quantity (descending)
      { $sort: { totalQuantity: -1 } },
      // Limit to top 5 categories
      { $limit: 5 },
      // Project the final format
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: '$category.name',
          totalQuantity: 1,
          totalRevenue: '$revenue',
          productCount: { $size: '$uniqueProducts' }
        }
      }
    ]);
    
    // Get overall sales metrics
    const overallMetrics = await SalesData.aggregate([
      // Only include sales from the last 30 days
      { $match: { date: { $gte: thirtyDaysAgo } } },
      // Group all sales
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$quantity' },
          totalEntries: { $sum: 1 },
          uniqueProducts: { $addToSet: '$productId' }
        }
      },
      // Project the final format
      {
        $project: {
          _id: 0,
          totalSales: 1,
          totalEntries: 1,
          uniqueProductCount: { $size: '$uniqueProducts' },
          period: '30 days'
        }
      }
    ]);
    
    // Add additional data needed by the frontend
    let enhancedProductRankings = [];
    if (productRankings && productRankings.length > 0) {
      enhancedProductRankings = await Promise.all(productRankings.map(async (item, index) => {
        // Calculate profit based on price and cost (if available)
        const product = await Product.findById(item.productId);
        const cost = product?.cost || 0;
        const profit = item.revenue - (cost * item.totalQuantity);
        
        return {
          ...item,
          _id: item.productId,
          productId: item.productId,
          name: item.productName,
          categoryName: item.categoryName,
          price: item.price || 0,
          revenue: item.revenue || 0,
          profit: profit || 0, 
          totalSales: item.totalQuantity || 0,
          rank: index + 1,
          currentStock: item.currentStock || 0,
          // Include additional metrics if they exist on the product model
          engagementScore: product?.engagementScore || 0,
          averageDwellTime: product?.averageDwellTime || 0,
          averageVisitors: product?.averageVisitors || 0,
          locationInStore: product?.locationInStore || '',
          // Calculate trend based on previous data if possible, otherwise leave empty
          trend: '',
          percentChange: 0
        };
      }));
    }

    let enhancedCategoryRankings = [];
    if (categoryRankings && categoryRankings.length > 0) {
      enhancedCategoryRankings = await Promise.all(categoryRankings.map(async (item, index) => {
        // Find the category to get any additional fields
        const category = await Category.findById(item.categoryId);
        
        // Find all products in this category to calculate profit
        const categoryProducts = await Product.find({ category: item.categoryId });
        let totalProfit = 0;
        
        if (categoryProducts.length > 0) {
          // Calculate profit for each product in the category
          const productIds = categoryProducts.map(p => p._id);
          const productSales = await SalesData.aggregate([
            { $match: { 
              productId: { $in: productIds },
              date: { $gte: thirtyDaysAgo }
            }},
            { $group: {
              _id: '$productId',
              totalQuantity: { $sum: '$quantity' }
            }}
          ]);
          
          // Calculate total profit
          for (const sale of productSales) {
            const product = categoryProducts.find(p => p._id.toString() === sale._id.toString());
            if (product) {
              const cost = product.cost || 0;
              const price = product.price || 0;
              totalProfit += (price - cost) * sale.totalQuantity;
            }
          }
        }
        
        return {
          ...item,
          _id: item.categoryId,
          name: item.categoryName,
          rank: index + 1,
          totalProfit: totalProfit,
          // Include additional metrics if they exist
          engagementScore: category?.engagementScore || 0,
          averageDwellTime: category?.averageDwellTime || 0,
          locationInStore: category?.locationInStore || '',
          // No random values for trend
          trend: '',
          percentChange: 0
        };
      }));
    }
    
    res.status(200).json({
      success: true,
      productRankings: enhancedProductRankings,
      categoryRankings: enhancedCategoryRankings,
      overallMetrics: overallMetrics[0] || { 
        totalSales: 0, 
        totalEntries: 0, 
        uniqueProductCount: 0,
        period: '30 days'
      }
    });
  } catch (error) {
    console.error('Error getting sales rankings:', error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  getTopProducts,
  getTopCategories,
  getSalesRankings
};
