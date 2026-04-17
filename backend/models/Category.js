import mongoose from 'mongoose';

/**
 * Category Schema
 * Enhanced with seasonality and analytics information for forecasting
 */
const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    // Engagement metrics for category analytics
    engagementScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    averageDwellTime: {
        type: Number, // Minutes customers spend in this category area
        default: 0
    },
    interestRate: {
        type: Number,
        default: 100, // Default 100% as requested
        min: 0,
        max: 100
    },
    crowdDensity: {
        type: Number,
        default: 0,
        min: 0
    },
    averageVisitors: {
        type: Number,
        default: 0
    },
    rackNumber: {
        type: String,
        unique: true,
        sparse: true // This allows null values while maintaining uniqueness for non-null values
    },
    locationInStore: {
        type: String,
        enum: ['front', 'middle', 'back', 'entrance', 'checkout']
    },
    // Historical performance data
    performanceHistory: [{
        date: {
            type: Date,
            required: true
        },
        salesCount: {
            type: Number,
            default: 0
        },
        revenue: {
            type: Number,
            default: 0
        },
        profit: {
            type: Number,
            default: 0
        },
        engagementScore: {
            type: Number,
            default: 0
        },
        visitorCount: {
            type: Number,
            default: 0
        }
    }],
    // Seasonality information for enhanced forecasting
    seasonality: {
        highSeasonMonths: [{
            type: Number,
            min: 0,
            max: 11
        }],  // 0-11 representing months with higher sales
        lowSeasonMonths: [{
            type: Number,
            min: 0,
            max: 11
        }],   // 0-11 representing months with lower sales
        notes: String        // Additional notes about seasonality
    },
    
    // Category trend indicators
    growthRate: {
        type: Number,
        default: 0 // Percentage growth rate, can be negative
    },
    
    // Category ranking information
    ranking: {
        overallRank: Number,
        salesRank: Number,
        profitRank: Number,
        engagementRank: Number,
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    
    // Improvement suggestions
    improvementSuggestions: [{
        suggestion: String,
        impact: {
            type: String,
            enum: ['high', 'medium', 'low']
        },
        implementationDifficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard']
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'rejected'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
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

const Category = mongoose.model('Category', categorySchema);

export default Category;
