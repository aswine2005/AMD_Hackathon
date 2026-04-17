import mongoose from 'mongoose';

/**
 * Product Schema
 * Enhanced with advanced inventory management and forecasting fields
 */
const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    currentStock: {
        type: Number,
        required: true,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        default: 'piece'
    },
    leadTime: {
        type: Number,
        default: 3,  // Default lead time of 3 days
        min: 1
    },
    minOrderQuantity: {
        type: Number,
        default: 1
    },
    reorderPoint: {
        type: Number,
        default: 0
    },
    safetyStock: {
        type: Number,
        default: 0
    },
    // Fields for enhanced inventory management
    profitMargin: {
        type: Number,
        default: 0.3, // Default 30% profit margin
        min: 0,
        max: 1
    },
    holdingCostPercentage: {
        type: Number,
        default: 0.2, // Default 20% of product cost
        min: 0,
        max: 1
    },
    orderingCost: {
        type: Number,
        default: 200 // Default cost per order placement
    },
    // Historical sales data aggregates
    averageDailySales: {
        type: Number,
        default: 0
    },
    averageWeeklySales: {
        type: Number,
        default: 0
    },
    // Vendor information for procurement
    vendor: {
        name: String,
        email: String,
        phone: String,
        preferredOrderMethod: {
            type: String,
            enum: ['email', 'phone', 'web', 'api'],
            default: 'email'
        }
    },
    // Seasonality adjustment for product-specific patterns
    seasonalityFactors: {
        monthly: [Number], // 12 values for each month's factor
        weekly: [Number]   // 7 values for each day of week factor
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

const Product = mongoose.model('Product', productSchema);

export default Product;
