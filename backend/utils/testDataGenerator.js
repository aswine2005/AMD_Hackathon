/**
 * Test Data Generator for Sales Forecasting Application
 * 
 * This script generates realistic test data for development and testing purposes.
 * It creates categories, products, sales data with realistic patterns including:
 * - Weekly sales cycles
 * - Seasonal trends
 * - Festival impacts
 * - Random variations
 */

import mongoose from 'mongoose';
import { format, addDays, parseISO, getDay, getMonth } from 'date-fns';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load models
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import SalesData from '../models/SalesData.js';

// Configuration
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://aswin:aswin@cluster0.4bgll.mongodb.net/sales_forecasting', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for test data generation...'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Sample data
const CATEGORIES = [
    {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        engagementScore: 85,
        locationInStore: 'front',
        seasonality: {
            highSeasonMonths: [10, 11], // November, December (holiday season)
            lowSeasonMonths: [1, 2]     // January, February (post-holiday)
        }
    },
    {
        name: 'Clothing',
        description: 'Apparel and fashion items',
        engagementScore: 78,
        locationInStore: 'middle',
        seasonality: {
            highSeasonMonths: [10, 11, 5, 6], // Holiday season and summer
            lowSeasonMonths: [1, 2]           // Post-holiday
        }
    },
    {
        name: 'Grocery',
        description: 'Food and household essentials',
        engagementScore: 92,
        locationInStore: 'entrance',
        seasonality: {
            highSeasonMonths: [10, 11, 3, 4], // Holiday and spring
            lowSeasonMonths: []               // Consistently needed
        }
    },
    {
        name: 'Home & Kitchen',
        description: 'Household items and kitchen supplies',
        engagementScore: 72,
        locationInStore: 'middle',
        seasonality: {
            highSeasonMonths: [5, 6, 10, 11], // Summer and holiday
            lowSeasonMonths: [1, 2]           // Post-holiday
        }
    },
    {
        name: 'Beauty & Personal Care',
        description: 'Beauty products and personal care items',
        engagementScore: 68,
        locationInStore: 'checkout',
        seasonality: {
            highSeasonMonths: [10, 11], // Holiday
            lowSeasonMonths: [7, 8]     // Late summer
        }
    }
];

const PRODUCTS_BY_CATEGORY = {
    'Electronics': [
        { name: 'Smartphone', price: 15000, leadTime: 5, currentStock: 120, profitMargin: 0.25, holdingCostPercentage: 0.15 },
        { name: 'Laptop', price: 45000, leadTime: 7, currentStock: 50, profitMargin: 0.22, holdingCostPercentage: 0.15 },
        { name: 'Headphones', price: 2500, leadTime: 3, currentStock: 200, profitMargin: 0.35, holdingCostPercentage: 0.1 },
        { name: 'Smart Watch', price: 8000, leadTime: 4, currentStock: 80, profitMargin: 0.30, holdingCostPercentage: 0.12 },
        { name: 'Power Bank', price: 1800, leadTime: 3, currentStock: 150, profitMargin: 0.40, holdingCostPercentage: 0.1 }
    ],
    'Clothing': [
        { name: 'T-Shirt', price: 800, leadTime: 4, currentStock: 300, profitMargin: 0.50, holdingCostPercentage: 0.18 },
        { name: 'Jeans', price: 1800, leadTime: 5, currentStock: 180, profitMargin: 0.45, holdingCostPercentage: 0.15 },
        { name: 'Dress', price: 2500, leadTime: 4, currentStock: 120, profitMargin: 0.55, holdingCostPercentage: 0.2 },
        { name: 'Jacket', price: 3500, leadTime: 6, currentStock: 90, profitMargin: 0.48, holdingCostPercentage: 0.18 },
        { name: 'Shoes', price: 2200, leadTime: 5, currentStock: 150, profitMargin: 0.42, holdingCostPercentage: 0.15 }
    ],
    'Grocery': [
        { name: 'Rice (5kg)', price: 350, leadTime: 2, currentStock: 250, profitMargin: 0.15, holdingCostPercentage: 0.08 },
        { name: 'Cooking Oil (1L)', price: 180, leadTime: 2, currentStock: 300, profitMargin: 0.18, holdingCostPercentage: 0.08 },
        { name: 'Flour (1kg)', price: 65, leadTime: 2, currentStock: 400, profitMargin: 0.2, holdingCostPercentage: 0.07 },
        { name: 'Sugar (1kg)', price: 55, leadTime: 2, currentStock: 350, profitMargin: 0.15, holdingCostPercentage: 0.06 },
        { name: 'Milk (1L)', price: 70, leadTime: 1, currentStock: 200, profitMargin: 0.1, holdingCostPercentage: 0.05 }
    ],
    'Home & Kitchen': [
        { name: 'Frying Pan', price: 1200, leadTime: 4, currentStock: 120, profitMargin: 0.35, holdingCostPercentage: 0.12 },
        { name: 'Bed Sheet', price: 950, leadTime: 3, currentStock: 180, profitMargin: 0.45, holdingCostPercentage: 0.15 },
        { name: 'Towel Set', price: 750, leadTime: 3, currentStock: 200, profitMargin: 0.50, holdingCostPercentage: 0.13 },
        { name: 'Storage Container', price: 350, leadTime: 2, currentStock: 250, profitMargin: 0.55, holdingCostPercentage: 0.1 },
        { name: 'Dinner Set', price: 2500, leadTime: 5, currentStock: 80, profitMargin: 0.40, holdingCostPercentage: 0.15 }
    ],
    'Beauty & Personal Care': [
        { name: 'Shampoo', price: 280, leadTime: 2, currentStock: 220, profitMargin: 0.45, holdingCostPercentage: 0.1 },
        { name: 'Face Wash', price: 220, leadTime: 2, currentStock: 180, profitMargin: 0.50, holdingCostPercentage: 0.1 },
        { name: 'Moisturizer', price: 350, leadTime: 3, currentStock: 150, profitMargin: 0.55, holdingCostPercentage: 0.12 },
        { name: 'Toothpaste', price: 120, leadTime: 2, currentStock: 300, profitMargin: 0.35, holdingCostPercentage: 0.08 },
        { name: 'Soap Pack', price: 180, leadTime: 2, currentStock: 250, profitMargin: 0.40, holdingCostPercentage: 0.09 }
    ]
};

// Helper functions for generating realistic sales patterns
const getBaseSalesForDay = (dayOfWeek) => {
    // Weekend sales boost
    if (dayOfWeek === 0) return 1.3;  // Sunday
    if (dayOfWeek === 6) return 1.5;  // Saturday
    if (dayOfWeek === 5) return 1.2;  // Friday
    return 1.0;  // Weekdays
};

const getSeasonalFactor = (date, category) => {
    const month = getMonth(date);
    
    // Find the category's seasonality information
    const categoryData = CATEGORIES.find(c => c.name === category);
    if (!categoryData || !categoryData.seasonality) return 1.0;
    
    // Apply seasonal factors
    if (categoryData.seasonality.highSeasonMonths && 
        categoryData.seasonality.highSeasonMonths.includes(month)) {
        return 1.3; // High season
    }
    
    if (categoryData.seasonality.lowSeasonMonths && 
        categoryData.seasonality.lowSeasonMonths.includes(month)) {
        return 0.7; // Low season
    }
    
    return 1.0; // Normal season
};

const getFestivalFactor = (date) => {
    const dateStr = format(date, 'MM-dd');
    
    // Major festivals/holidays and sales events
    const festivals = {
        '01-26': { name: 'Republic Day', factor: 1.3 },
        '03-13': { name: 'Holi', factor: 1.4 },
        '08-15': { name: 'Independence Day', factor: 1.3 },
        '10-02': { name: 'Gandhi Jayanti', factor: 1.2 },
        '10-24': { name: 'Dussehra', factor: 1.5 },
        '11-04': { name: 'Diwali', factor: 1.8 },
        '12-25': { name: 'Christmas', factor: 1.5 }
    };
    
    // Check for festival
    if (festivals[dateStr]) {
        return festivals[dateStr].factor;
    }
    
    // Check for days before major festivals (build-up)
    for (const festDate in festivals) {
        const festivalDate = new Date(`2023-${festDate}`);
        const diffTime = festivalDate.getTime() - date.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays <= 3) {
            // Scale factor based on proximity to festival
            return 1 + ((festivals[festDate].factor - 1) * (1 - (diffDays - 1) / 3));
        }
    }
    
    return 1.0;
};

const getRandomVariation = () => {
    // Random variation within ±15%
    return 0.85 + Math.random() * 0.3;
};

const getQuantityForProduct = (productName, baseQuantity, date, category) => {
    // Adjustments based on product type
    let productFactor = 1.0;
    
    // Product-specific adjustments
    switch (productName.toLowerCase()) {
        case 'smartphone':
        case 'laptop':
            // Higher value items sell less frequently
            productFactor = 0.3;
            break;
        case 'headphones':
        case 'power bank':
        case 'toothpaste':
        case 'soap pack':
        case 'milk (1l)':
            // Frequently purchased items
            productFactor = 1.4;
            break;
        case 'rice (5kg)':
        case 't-shirt':
        case 'storage container':
            // Mid-frequency items
            productFactor = 1.1;
            break;
        default:
            // Default factor
            productFactor = 1.0;
    }
    
    // Calculate all factors
    const dayFactor = getBaseSalesForDay(getDay(date));
    const seasonalFactor = getSeasonalFactor(date, category);
    const festivalFactor = getFestivalFactor(date);
    const randomFactor = getRandomVariation();
    
    // Apply factors to base quantity
    return Math.max(1, Math.round(baseQuantity * productFactor * dayFactor * seasonalFactor * festivalFactor * randomFactor));
};

// Main function to generate test data
const generateTestData = async () => {
    try {
        console.log('Starting test data generation...');
        
        // Clear existing data (optional - comment out if you want to keep existing data)
        await Category.deleteMany({});
        await Product.deleteMany({});
        await SalesData.deleteMany({});
        
        console.log('Cleared existing data. Creating new test data...');
        
        // Insert categories
        const categoryMap = {};
        for (const categoryData of CATEGORIES) {
            const category = new Category(categoryData);
            await category.save();
            categoryMap[category.name] = category._id;
            console.log(`Created category: ${category.name}`);
        }
        
        // Insert products
        const productMap = {};
        for (const [categoryName, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
            const categoryId = categoryMap[categoryName];
            
            for (const productData of products) {
                const product = new Product({
                    ...productData,
                    category: categoryId
                });
                await product.save();
                productMap[product.name] = product._id;
                console.log(`Created product: ${product.name} in category: ${categoryName}`);
            }
        }
        
        // Generate sales data for the past 90 days
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 90);
        
        // Base quantities for each category
        const baseCategoryQuantities = {
            'Electronics': 5,
            'Clothing': 12,
            'Grocery': 25,
            'Home & Kitchen': 8,
            'Beauty & Personal Care': 15
        };
        
        let currentDate = new Date(startDate);
        const salesDataEntries = [];
        
        // Generate sales data for each day
        while (currentDate <= endDate) {
            for (const [categoryName, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
                const baseQuantity = baseCategoryQuantities[categoryName];
                
                for (const product of products) {
                    const quantity = getQuantityForProduct(
                        product.name, 
                        baseQuantity, 
                        currentDate,
                        categoryName
                    );
                    
                    salesDataEntries.push({
                        productId: productMap[product.name],
                        date: new Date(currentDate),
                        quantity,
                        revenue: quantity * product.price
                    });
                }
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Insert all sales data
        await SalesData.insertMany(salesDataEntries);
        console.log(`Generated ${salesDataEntries.length} sales data entries over ${90} days`);
        
        console.log('Test data generation complete!');
        
        // Export data for analysis (optional)
        // Save a sample of the data for reference
        const sampleData = {
            categories: CATEGORIES,
            productsByCategory: PRODUCTS_BY_CATEGORY,
            generatedEntriesCount: salesDataEntries.length
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'generated_test_data_summary.json'),
            JSON.stringify(sampleData, null, 2)
        );
        
        console.log('Data summary saved to generated_test_data_summary.json');
        
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Error generating test data:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

// Run the script
generateTestData();
