import mongoose from 'mongoose';

const salesDataSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    weather: {
        temperature: {
            type: Number,
            required: true
        },
        rainfall: {
            type: Number,
            required: true
        }
    },
    isWeekend: {
        type: Boolean,
        required: true
    },
    isFestival: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create index for faster queries
salesDataSchema.index({ productId: 1, date: 1 });

const SalesData = mongoose.model('SalesData', salesDataSchema);

export default SalesData;
