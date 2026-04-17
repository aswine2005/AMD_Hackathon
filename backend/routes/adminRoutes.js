import express from 'express';
import Sale from '../models/Sale.js';
import SalesData from '../models/SalesData.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

/**
 * @route   GET api/admin/today-sales
 * @desc    Get today's sales data for admin dashboard
 * @access  Public
 */
router.get('/today-sales', async (req, res) => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date for query range
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all sales for today from both Sale and SalesData collections
    const todaySalesFromSale = await Sale.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('product');
    
    // Get sales from SalesData model (which uses productId instead of product reference)
    const todaySalesFromSalesData = await SalesData.find({
      date: { $gte: today, $lt: tomorrow }
    });
    
    // Convert SalesData entries to match Sale schema format for consistent processing
    const convertedSalesData = await Promise.all(todaySalesFromSalesData.map(async (entry) => {
      const product = await Product.findById(entry.productId);
      return {
        _id: entry._id,
        product: product,
        quantity: entry.quantity,
        price: product ? product.price : 0,
        totalAmount: entry.quantity * (product ? product.price : 0),
        date: entry.date
      };
    }));
    
    // Combine both sources of sales data
    const todaySales = [...todaySalesFromSale, ...convertedSalesData.filter(entry => entry.product)];
    
    // Initialize response object with default values
    const response = {
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      orders: todaySales.length,
      topCategories: [],
      topProducts: [],
      notSellingCategories: [],
      notSellingProducts: []
    };
    
    // Calculate total sales and revenue
    if (todaySales.length > 0) {
      // Calculate summary metrics
      response.totalSales = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
      response.totalRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      response.totalProfit = Math.round(response.totalRevenue * 0.35); // Assuming 35% profit margin
      
      // Group sales by product
      const productSales = {};
      for (const sale of todaySales) {
        if (!sale.product || !sale.product._id) continue;
        
        const productId = sale.product._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: sale.product.name,
            quantity: 0,
            revenue: 0,
            categoryId: sale.product.category
          };
        }
        
        productSales[productId].quantity += sale.quantity;
        productSales[productId].revenue += sale.totalAmount;
      }
      
      // Sort products by revenue and get top 5
      const sortedProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
      const maxRevenue = sortedProducts[0]?.revenue || 0;
      
      response.topProducts = sortedProducts.slice(0, 5).map(product => ({
        ...product,
        percentage: maxRevenue > 0 ? Math.round((product.revenue / maxRevenue) * 100) : 0
      }));
      
      // Group sales by category
      const categorySales = {};
      for (const product of Object.values(productSales)) {
        const categoryId = product.categoryId?.toString();
        if (!categoryId) continue;
        
        if (!categorySales[categoryId]) {
          categorySales[categoryId] = {
            id: categoryId,
            name: '',
            quantity: 0,
            revenue: 0
          };
        }
        
        categorySales[categoryId].quantity += product.quantity;
        categorySales[categoryId].revenue += product.revenue;
      }
      
      // Get category names
      const categories = await Category.find({
        _id: { $in: Object.keys(categorySales).map(id => id) }
      });
      
      // Add category names to the category sales
      for (const category of categories) {
        const categoryId = category._id.toString();
        if (categorySales[categoryId]) {
          categorySales[categoryId].name = category.name;
        }
      }
      
      // Sort categories by revenue and get top 5
      const sortedCategories = Object.values(categorySales)
        .filter(cat => cat.name) // Only include categories with names
        .sort((a, b) => b.revenue - a.revenue);
      
      const maxCatRevenue = sortedCategories[0]?.revenue || 0;
      
      response.topCategories = sortedCategories.slice(0, 5).map(category => ({
        ...category,
        percentage: maxCatRevenue > 0 ? Math.round((category.revenue / maxCatRevenue) * 100) : 0
      }));
      
      // Find categories and products that are not selling today
      // Get all categories and products
      const allCategories = await Category.find();
      const allProducts = await Product.find();
      
      // Find categories that have no sales today
      const sellingCategoryIds = new Set(Object.keys(categorySales));
      response.notSellingCategories = allCategories
        .filter(cat => !sellingCategoryIds.has(cat._id.toString()))
        .map(cat => ({
          id: cat._id,
          name: cat.name,
          lastSaleDate: cat.lastSaleDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // One week ago if no last sale
        }))
        .slice(0, 10); // Limit to 10 non-selling categories
      
      // Find products that have no sales today
      const sellingProductIds = new Set(Object.keys(productSales));
      response.notSellingProducts = allProducts
        .filter(prod => !sellingProductIds.has(prod._id.toString()))
        .map(prod => ({
          id: prod._id,
          name: prod.name,
          category: prod.category,
          lastSaleDate: prod.lastSaleDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // One week ago if no last sale
        }))
        .slice(0, 15); // Limit to 15 non-selling products
    }
    
    return res.json(response);
    
  } catch (err) {
    console.error('Error fetching admin sales data:', err);
    console.error(err.stack); // Log full stack trace for debugging
    res.status(500).send('Server Error');
  }
});

export default router;
