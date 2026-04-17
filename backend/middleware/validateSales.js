import Product from '../models/Product.js';

/**
 * Validates sales data for both manual entry and CSV uploads
 * Performs checks on:
 * 1. Valid date range (not future, not too old)
 * 2. Positive quantity
 * 3. Sufficient stock availability
 */
export const validateSales = async (req, res, next) => {
  try {
    const today = new Date();
    const { date, quantity, productId } = req.body;

    // 1. Date sanity checks
    const d = new Date(date);
    if (Number.isNaN(d)) return res.status(400).json({message:'Invalid date format'});
    
    // Create date objects with time set to midnight for proper day comparison
    const entryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(todayDate.getDate() + 1);
    
    // Check if the date is in the future (after today)
    if (entryDate >= tomorrowDate) return res.status(400).json({message:'Date cannot be in the future'});
    
    const yearsAgo = today.getFullYear() - d.getFullYear();
    if (yearsAgo > 1) {
      return res.status(400).json({message:'Date is too old (> 1 year). Historical data should be recent for accurate forecasting.'});
    }

    // 2. Quantity validation
    if (+quantity <= 0) {
      return res.status(400).json({message:'Quantity must be positive'});
    }

    // 3. Stock availability check
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({message:'Product not found'});

    if (product.currentStock < quantity) {
      return res.status(409).json({
        message: `Not enough stock available (current: ${product.currentStock}, requested: ${quantity})`,
        currentStock: product.currentStock,
        productId: product._id,
        productName: product.name
      });
    }

    // Cache product for later update
    req.productDoc = product;
    next();
  } catch (error) {
    console.error('Error in sales validation middleware:', error);
    res.status(500).json({ message: 'Internal server error during validation' });
  }
};

export default validateSales;
