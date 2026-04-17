import Category from '../models/Category.js';
import Product from '../models/Product.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.status(200).json(category);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Create a new category
export const createCategory = async (req, res) => {
    const category = req.body;
    
    try {
        const newCategory = new Category(category);
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Update a category
export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        description, 
        engagementScore, 
        averageDwellTime, 
        interestRate, 
        crowdDensity, 
        averageVisitors, 
        rackNumber, 
        locationInStore 
    } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }
    
    try {
        // Update all fields sent from frontend
        const updateData = {
            name, 
            description,
            // Only include numeric fields if they're defined
            ...(engagementScore !== undefined && { engagementScore }),
            ...(averageDwellTime !== undefined && { averageDwellTime }),
            ...(interestRate !== undefined && { interestRate }),
            ...(crowdDensity !== undefined && { crowdDensity }),
            ...(averageVisitors !== undefined && { averageVisitors }),
            ...(rackNumber !== undefined && { rackNumber }),
            ...(locationInStore !== undefined && { locationInStore })
        };
        
        // Use findOneAndUpdate with proper options to ensure update works
        const category = await Category.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({ message: error.message });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Check if category has products
        const productsCount = await Product.countDocuments({ category: id });
        
        if (productsCount > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete category that has products. Please delete or reassign the products first.' 
            });
        }
        
        const deletedCategory = await Category.findByIdAndDelete(id);
        
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Import categories from CSV
export const importCategoriesFromCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file provided' });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
        // Create readable stream from buffer
        const stream = Readable.from([req.file.buffer]);
        
        // Process the CSV data
        const parseStream = stream.pipe(csv());
        
        // We'll use this to collect all CSV rows before processing
        const categoryRows = [];
        
        // First collect all rows
        for await (const row of parseStream) {
            categoryRows.push(row);
        }
        
        // Then process them in batch
        if (categoryRows.length > 0) {
            // Prepare all operations for a bulk write
            const bulkOps = categoryRows.map(row => {
                const category = {
                    name: row.name,
                    description: row.description || ''
                };
                
                return {
                    insertOne: {
                        document: category
                    }
                };
            });
            
            if (bulkOps.length > 0) {
                // Execute bulk operation
                const result = await Category.bulkWrite(bulkOps);
                successCount = result.insertedCount;
                
                // For each successful insert, add to results
                results.push({
                    status: 'success',
                    message: `Successfully imported ${successCount} categories`
                });
            }
        }
        
        res.status(200).json({
            message: `Imported ${successCount} categories`,
            successCount,
            errorCount,
            errors,
            results
        });
    } catch (error) {
        console.error('Error importing categories:', error);
        res.status(500).json({ 
            message: 'Error importing categories',
            error: error.message
        });
    }
};
