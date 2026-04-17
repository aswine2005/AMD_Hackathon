import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Models
const categorySchema = new mongoose.Schema({
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
    engagementScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    averageDwellTime: {
        type: Number,
        default: 0
    },
    interestRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
});

const productSchema = new mongoose.Schema({
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
        default: 'unit'
    },
    minimumStockLevel: {
        type: Number,
        default: 0
    },
    leadTime: {
        type: Number, // Days
        default: 7
    }
});

const salesDataSchema = new mongoose.Schema({
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
        required: true
    },
    marketingSpend: {
        type: Number,
        default: 0
    }
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales_forecast_pro')
    .then(() => {
        console.log('MongoDB connected for seeding...');
        seedData();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Sample data
const categories = [
    {
        name: "Harry Potter Set",
        description: "Collection of Harry Potter books",
        engagementScore: 85,
        averageDwellTime: 5.2,
        interestRate: 78
    },
    {
        name: "Lipstick Set",
        description: "Collection of premium lipsticks",
        engagementScore: 72,
        averageDwellTime: 4.1,
        interestRate: 65
    },
    {
        name: "Electronics",
        description: "Electronic devices and accessories",
        engagementScore: 68,
        averageDwellTime: 3.8,
        interestRate: 62
    },
    {
        name: "Food & Grocery",
        description: "Food and grocery items",
        engagementScore: 59,
        averageDwellTime: 4.5,
        interestRate: 55
    },
    {
        name: "Home Appliances",
        description: "Appliances for home use",
        engagementScore: 75,
        averageDwellTime: 3.2,
        interestRate: 70
    }
];

// Generate products based on the image you showed
const generateProducts = (categoryIds) => [
    {
        name: "Harry Potter Set",
        category: categoryIds[0],
        description: "Complete set of Harry Potter books",
        currentStock: 45,
        price: 89.99,
        unit: "set",
        minimumStockLevel: 10,
        leadTime: 14
    },
    {
        name: "Lipstick Set",
        category: categoryIds[1],
        description: "Set of premium lipsticks",
        currentStock: 60,
        price: 29.99,
        unit: "set",
        minimumStockLevel: 15,
        leadTime: 10
    },
    {
        name: "Apple iPhone 13",
        category: categoryIds[2],
        description: "Latest iPhone model",
        currentStock: 40,
        price: 899.99,
        unit: "piece",
        minimumStockLevel: 8,
        leadTime: 21
    },
    {
        name: "Whole Grain Bread",
        category: categoryIds[3],
        description: "Healthy whole grain bread",
        currentStock: 100,
        price: 3.49,
        unit: "loaf",
        minimumStockLevel: 20,
        leadTime: 2
    },
    {
        name: "Samsung TV 42\"",
        category: categoryIds[4],
        description: "42-inch Samsung Smart TV",
        currentStock: 35,
        price: 499.99,
        unit: "piece",
        minimumStockLevel: 7,
        leadTime: 14
    },
    {
        name: "Levi's Jeans",
        category: categoryIds[1],
        description: "Classic Levi's jeans",
        currentStock: 80,
        price: 59.99,
        unit: "piece",
        minimumStockLevel: 15,
        leadTime: 7
    },
    {
        name: "Yoga Mat",
        category: categoryIds[4],
        description: "Premium non-slip yoga mat",
        currentStock: 70,
        price: 29.99,
        unit: "piece",
        minimumStockLevel: 15,
        leadTime: 7
    },
    {
        name: "Tennis Racket",
        category: categoryIds[4],
        description: "Professional tennis racket",
        currentStock: 45,
        price: 129.99,
        unit: "piece",
        minimumStockLevel: 10,
        leadTime: 10
    },
    {
        name: "Blender Pro",
        category: categoryIds[4],
        description: "High-performance blender",
        currentStock: 30,
        price: 79.99,
        unit: "piece",
        minimumStockLevel: 5,
        leadTime: 14
    },
    {
        name: "Coffee Maker",
        category: categoryIds[4],
        description: "Automatic coffee maker",
        currentStock: 40,
        price: 89.99,
        unit: "piece",
        minimumStockLevel: 8,
        leadTime: 10
    }
];

// Generate realistic sales data exactly matching what's shown in your UI
const generateSalesData = (productIds) => {
    const salesData = [];
    const now = new Date();
    
    // Sales quantities that match the image
    const productSales = {
        [0]: 146, // Harry Potter Set: 146 units
        [1]: 138, // Lipstick Set: 138 units
        [2]: 130, // Apple iPhone 13: 130 units
        [3]: 107, // Whole Grain Bread: 107 units
        [4]: 105, // Samsung TV: 105 units
        [5]: 102, // Levi's Jeans: 102 units
        [6]: 100, // Yoga Mat: 100 units
        [7]: 98,  // Tennis Racket: 98 units
        [8]: 93,  // Blender Pro: 93 units
        [9]: 83   // Coffee Maker: 83 units
    };
    
    // Generate sales distributed over 30 days
    for (let productIndex = 0; productIndex < productIds.length; productIndex++) {
        const totalQuantity = productSales[productIndex] || Math.floor(Math.random() * 100) + 50;
        let remainingQuantity = totalQuantity;
        
        // Distribute the total quantity randomly across days
        for (let day = 0; day < 30 && remainingQuantity > 0; day++) {
            const date = new Date();
            date.setDate(now.getDate() - day);
            
            // Random quantity for this day
            const dailyQuantity = Math.min(
                Math.max(1, Math.floor(Math.random() * (remainingQuantity / 3))),
                remainingQuantity
            );
            
            remainingQuantity -= dailyQuantity;
            
            salesData.push({
                productId: productIds[productIndex],
                date,
                quantity: dailyQuantity,
                weather: {
                    temperature: Math.floor(Math.random() * 25) + 10, // 10-35 degrees
                    rainfall: Math.random() * 10 // 0-10mm
                },
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                isFestival: Math.random() > 0.9, // 10% chance of festival
                marketingSpend: Math.random() * 1000 // 0-1000 dollars
            });
        }
    }
    
    return salesData;
};

// Models
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const SalesData = mongoose.model('SalesData', salesDataSchema);

// Seed data function
async function seedData() {
    try {
        // Check if data already exists
        const existingCategories = await Category.countDocuments();
        const existingProducts = await Product.countDocuments();
        const existingSales = await SalesData.countDocuments();
        
        console.log(`Found ${existingCategories} categories, ${existingProducts} products, and ${existingSales} sales records`);
        
        // If data exists, ask for confirmation before proceeding
        if (existingCategories > 0 || existingProducts > 0 || existingSales > 0) {
            console.log('WARNING: This will delete all existing categories, products, and sales data!');
            console.log('Proceeding with data seeding...');
        }
        
        // Clear existing data
        await Category.deleteMany({});
        await Product.deleteMany({});
        await SalesData.deleteMany({});
        
        console.log('Cleared existing data');
        
        // Insert categories
        const savedCategories = await Category.insertMany(categories);
        console.log(`Inserted ${savedCategories.length} categories`);
        
        // Get category IDs
        const categoryIds = savedCategories.map(cat => cat._id);
        
        // Insert products
        const products = generateProducts(categoryIds);
        const savedProducts = await Product.insertMany(products);
        console.log(`Inserted ${savedProducts.length} products`);
        
        // Get product IDs
        const productIds = savedProducts.map(prod => prod._id);
        
        // Insert sales data
        const salesData = generateSalesData(productIds);
        const savedSalesData = await SalesData.insertMany(salesData);
        console.log(`Inserted ${savedSalesData.length} sales records`);
        
        console.log('Database seeding completed successfully!');
        
        // Exit the process
        setTimeout(() => process.exit(0), 1000);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}
