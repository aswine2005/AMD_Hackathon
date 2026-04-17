import mongoose from 'mongoose';

/**
 * Sale Schema
 * Tracks individual sales transactions for products
 */
const saleSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    customer: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'online', 'other'],
        default: 'cash'
    }
}, {
    timestamps: true
});

// Calculate total amount before saving
saleSchema.pre('save', function(next) {
    if (!this.totalAmount) {
        this.totalAmount = this.quantity * this.price;
    }
    next();
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
