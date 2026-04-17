import Product from '../models/Product.js';
import Category from '../models/Category.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Get all products
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .sort({ name: 1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
    const { categoryId } = req.params;
    
    try {
        const products = await Product.find({ category: categoryId })
            .populate('category', 'name')
            .sort({ name: 1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get a single product
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name');
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.status(200).json(product);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Create a new product
export const createProduct = async (req, res) => {
    const productData = req.body;
    
    try {
        // Verify category exists
        const categoryExists = await Category.findById(productData.category);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        const newProduct = new Product(productData);
        await newProduct.save();
        
        // Return populated product
        const populatedProduct = await Product.findById(newProduct._id)
            .populate('category', 'name');
            
        res.status(201).json(populatedProduct);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Update a product
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const updatedProductData = req.body;
    
    try {
        // Verify product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // If changing category, verify new category exists
        if (updatedProductData.category && updatedProductData.category !== existingProduct.category.toString()) {
            const categoryExists = await Category.findById(updatedProductData.category);
            if (!categoryExists) {
                return res.status(404).json({ message: 'New category not found' });
            }
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(id, updatedProductData, { new: true })
            .populate('category', 'name');
        
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a product
export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    
    try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Restock a product
export const restockProduct = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
        return res.status(400).json({ message: 'Valid restock quantity is required (must be positive)' });
    }
    
    try {
        // Verify product exists
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Add quantity to current stock
        const restockQuantity = parseInt(quantity);
        const previousStock = product.currentStock;
        product.currentStock += restockQuantity;
        
        // Save updated product
        await product.save();
        
        // Return updated product with restocking details
        const updatedProduct = await Product.findById(id).populate('category', 'name');
        
        res.status(200).json({
            product: updatedProduct,
            restockDetails: {
                previousStock,
                addedStock: restockQuantity,
                newStock: product.currentStock,
                timestamp: new Date()
            },
            message: `Successfully restocked ${product.name} with ${restockQuantity} units`
        });
    } catch (error) {
        console.error('Error restocking product:', error);
        res.status(500).json({ message: error.message });
    }
};

// Import products from CSV
export const importProductsFromCsv = async (req, res) => {
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
        const productRows = [];
        
        // First collect all rows
        for await (const row of parseStream) {
            productRows.push(row);
        }
        
        // Then process them in batch
        if (productRows.length > 0) {
            // Validate and prepare all products
            const bulkOps = [];

            // For each product in the CSV
            for (const row of productRows) {
                try {
                    // Find category by name if provided
                    let categoryId = null;
                    if (row.category) {
                        const category = await Category.findOne({ name: row.category });
                        if (category) {
                            categoryId = category._id;
                        } else {
                            // If category not found, create a new one
                            const newCategory = new Category({ name: row.category });
                            await newCategory.save();
                            categoryId = newCategory._id;
                        }
                    }

                    // Create product object
                    const product = {
                        name: row.name,
                        description: row.description || '',
                        price: parseFloat(row.price) || 0,
                        initialStock: parseInt(row.initialStock) || 0,
                        currentStock: parseInt(row.initialStock) || 0,
                        category: categoryId
                    };

                    // Add to bulk operations
                    bulkOps.push({
                        insertOne: {
                            document: product
                        }
                    });
                } catch (error) {
                    errorCount++;
                    errors.push({
                        row: row,
                        error: error.message
                    });
                }
            }
            
            if (bulkOps.length > 0) {
                // Execute bulk operation
                const result = await Product.bulkWrite(bulkOps);
                successCount = result.insertedCount;
                
                // Add success result
                results.push({
                    status: 'success',
                    message: `Successfully imported ${successCount} products`
                });
            }
        }
        
        res.status(200).json({
            message: `Imported ${successCount} products with ${errorCount} errors`,
            successCount,
            errorCount,
            errors,
            results
        });
    } catch (error) {
        console.error('Error importing products:', error);
        res.status(500).json({ 
            message: 'Error importing products',
            error: error.message
        });
    }
};
