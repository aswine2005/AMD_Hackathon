import mongoose from 'mongoose';

/**
 * Inventory Schema
 * Tracks current inventory levels for products with reordering thresholds
 */
const inventorySchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    reorderPoint: {
        type: Number,
        default: 10
    },
    reorderQuantity: {
        type: Number,
        default: 20
    },
    lastRestocked: {
        type: Date,
        default: Date.now
    },
    expectedDelivery: {
        type: Date
    },
    onOrder: {
        type: Number,
        default: 0
    },
    location: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Add index for faster lookups
inventorySchema.index({ product: 1 });

// Virtual for inventory status (in stock, low stock, out of stock)
inventorySchema.virtual('status').get(function() {
    if (this.quantity <= 0) {
        return 'out_of_stock';
    } else if (this.quantity <= this.reorderPoint) {
        return 'low_stock';
    } else {
        return 'in_stock';
    }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
