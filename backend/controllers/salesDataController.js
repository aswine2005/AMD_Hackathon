import SalesData from '../models/SalesData.js';
import Product from '../models/Product.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Get sales data for a product
export const getSalesData = async (req, res) => {
    const { productId } = req.params;
    
    try {
        const salesData = await SalesData.find({ productId })
            .sort({ date: -1 });
        
        res.status(200).json(salesData);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Add single sales data entry
export const addSalesData = async (req, res) => {
    const salesEntry = req.body;
    
    try {
        // Validate product exists
        const product = await Product.findById(salesEntry.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if entry already exists for this product on this date
        const existingEntry = await SalesData.findOne({
            productId: salesEntry.productId,
            date: new Date(salesEntry.date)
        });

        let savedEntry;
        
        if (existingEntry) {
            // Calculate the difference in quantity
            const quantityDifference = salesEntry.quantity - existingEntry.quantity;
            
            // Update existing entry
            existingEntry.quantity = salesEntry.quantity;
            existingEntry.weather = salesEntry.weather;
            existingEntry.isWeekend = salesEntry.isWeekend;
            existingEntry.isFestival = salesEntry.isFestival;
            savedEntry = await existingEntry.save();
            
            // Update product stock based on the difference
            if (quantityDifference !== 0) {
                product.currentStock = Math.max(0, product.currentStock - quantityDifference);
                await product.save();
            }
        } else {
            // Create new entry
            const newSalesData = new SalesData(salesEntry);
            savedEntry = await newSalesData.save();
            
            // Update product stock
            product.currentStock = Math.max(0, product.currentStock - salesEntry.quantity);
            await product.save();
        }
        
        res.status(existingEntry ? 200 : 201).json({
            salesData: savedEntry,
            productStock: product.currentStock
        });
    } catch (error) {
        console.error('Error adding sales data:', error);
        res.status(409).json({ message: error.message });
    }
};

// Import sales data from CSV
export const importSalesData = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
        const results = [];
        const errors = [];
        const updatedProducts = []; // Track products that need stock updating
        
        // Create readable stream from buffer
        const stream = Readable.from([req.file.buffer]);
        
        // Get current date and one year ago for validation
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        oneYearAgo.setHours(0, 0, 0, 0); // Start of the day one year ago
        
        // Process the CSV data - collect all rows first
        const parseStream = stream.pipe(csv());
        const salesRows = [];
        
        // First collect all rows
        for await (const row of parseStream) {
            salesRows.push(row);
        }
        
        // Now process in batch
        const bulkInsertData = [];
        
        // Process each row
        for (const data of salesRows) {
            try {
                // Validate data structure
                if (!data.productId || !data.date || !data.quantity || 
                    !data.temperature || !data.rainfall) {
                    errors.push(`Missing required fields in row: ${JSON.stringify(data)}`);
                    continue;
                }
                
                // Validate product exists
                const product = await Product.findById(data.productId);
                if (!product) {
                    errors.push(`Product with ID ${data.productId} does not exist`);
                    continue;
                }
                
                // Parse and validate the date
                const entryDate = new Date(data.date);
                
                // Check if date is valid
                if (isNaN(entryDate.getTime())) {
                    errors.push(`Invalid date format in row: ${JSON.stringify(data)}`);
                    continue;
                }
                
                // Check if date is in the future
                if (entryDate > today) {
                    errors.push(`Future dates are not allowed: ${data.date}`);
                    continue;
                }
                
                // Check if date is too old (more than 1 year ago)
                if (entryDate < oneYearAgo) {
                    errors.push(`Date too old (more than 1 year): ${data.date}`);
                    continue;
                }
                
                // Convert values
                const salesEntry = {
                    productId: data.productId,
                    date: entryDate,
                    quantity: parseInt(data.quantity),
                    weather: {
                        temperature: parseFloat(data.temperature),
                        rainfall: parseFloat(data.rainfall)
                    },
                    isWeekend: data.isWeekend === 'true' || data.isWeekend === '1',
                    isFestival: data.isFestival === 'true' || data.isFestival === '1',
                    notes: data.notes || ''
                };
                
                // Check if entry already exists for this date and product
                const existingEntry = await SalesData.findOne({
                    productId: data.productId,
                    date: {
                        $gte: new Date(new Date(entryDate).setHours(0, 0, 0, 0)),
                        $lte: new Date(new Date(entryDate).setHours(23, 59, 59, 999))
                    }
                });
                
                if (existingEntry) {
                    // Calculate the difference in quantity
                    const quantityDifference = salesEntry.quantity - existingEntry.quantity;
                    
                    // Update existing entry
                    existingEntry.quantity = salesEntry.quantity;
                    existingEntry.weather = salesEntry.weather;
                    existingEntry.isWeekend = salesEntry.isWeekend;
                    existingEntry.isFestival = salesEntry.isFestival;
                    existingEntry.notes = salesEntry.notes;
                    await existingEntry.save();
                    
                    // Only reduce stock if the quantity has increased
                    if (quantityDifference > 0) {
                        // Track this product for stock update with the difference amount
                        updatedProducts.push({
                            productId: data.productId,
                            quantityChange: quantityDifference
                        });
                    }
                    
                    results.push({
                        status: 'updated',
                        productId: data.productId,
                        date: entryDate
                    });
                } else {
                    // Add to bulk insert data
                    bulkInsertData.push(salesEntry);
                    
                    // Track this product for stock update with the full quantity
                    updatedProducts.push({
                        productId: data.productId,
                        quantityChange: salesEntry.quantity
                    });
                    
                    results.push({
                        status: 'inserted',
                        productId: data.productId,
                        date: entryDate
                    });
                }
            } catch (error) {
                errors.push(`Error processing row: ${JSON.stringify(data)} - ${error.message}`);
            }
        }
        
        // Bulk insert all valid entries
        let insertedCount = 0;
        if (bulkInsertData.length > 0) {
            // Use bulkInsertData instead of results for the bulk insert
            const insertResult = await SalesData.insertMany(bulkInsertData, { ordered: false });
            insertedCount = insertResult.length;
        }
        
        // Update product stock based on sales data
        const stockUpdates = [];
        for (const item of updatedProducts) {
            try {
                const product = await Product.findById(item.productId);
                if (product) {
                    // Reduce current stock by the sales quantity (don't go below 0)
                    product.currentStock = Math.max(0, product.currentStock - item.quantityChange);
                    await product.save();
                    stockUpdates.push({
                        productId: item.productId,
                        productName: product.name,
                        newStock: product.currentStock,
                        quantityReduced: item.quantityChange
                    });
                }
            } catch (updateError) {
                errors.push(`Error updating stock for product ${item.productId}: ${updateError.message}`);
            }
        }
        
        res.status(201).json({
            message: `Imported ${insertedCount} sales data entries`,
            productsUpdated: updatedProducts.size,
            stockUpdates: stockUpdates,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error importing sales data:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete sales data
export const deleteSalesData = async (req, res) => {
    const { id } = req.params;
    
    try {
        const deletedData = await SalesData.findByIdAndDelete(id);
        
        if (!deletedData) {
            return res.status(404).json({ message: 'Sales data not found' });
        }
        
        res.json({ message: 'Sales data deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper utilities for synthetic CSV generation
const clampSampleDays = (value) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        return 60;
    }
    return Math.min(Math.max(parsed, 14), 180);
};

const FESTIVAL_DATES = new Set([
    '01-14', // Pongal
    '03-25', // Holi
    '08-15', // Independence Day
    '10-31', // Diwali week
    '11-03', // Diwali follow-up
    '12-25'  // Christmas
]);

const toCsvLine = (row) =>
    [
        row.productId,
        row.date,
        row.quantity,
        row.temperature,
        row.rainfall,
        row.isWeekend ? 1 : 0,
        row.isFestival ? 1 : 0
    ].join(',');

const pickBaseQuantity = (product) => {
    if (product?.averageDailySales && product.averageDailySales > 0) {
        return Math.max(2, Math.round(product.averageDailySales));
    }
    const normalizedPrice = Math.max(500, product?.price || 1000);
    return Math.max(2, Math.round(60000 / normalizedPrice));
};

const buildSyntheticRow = (productId, product, date) => {
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    const dateStr = date.toISOString().slice(5, 10);
    const seasonBoost = [9, 10].includes(month) ? 1.25 : [3, 4].includes(month) ? 1.1 : 1;
    const weekendBoost = [5, 6].includes(dayOfWeek) ? 1.2 : dayOfWeek === 0 ? 1.1 : 1;
    const isFestival = FESTIVAL_DATES.has(dateStr);
    const festivalBoost = isFestival ? 1.4 : 1;
    const noise = 0.85 + Math.random() * 0.3;
    const base = pickBaseQuantity(product);
    const quantity = Math.max(
        1,
        Math.round(base * seasonBoost * weekendBoost * festivalBoost * noise)
    );

    // Weather approximations
    const temperature =
        Math.round((26 + Math.sin(date.getTime() / 8.64e7) * 4 + (Math.random() * 2 - 1)) * 10) /
        10;
    const rainfall = Math.max(
        0,
        Math.round((Math.random() * 8 - Math.sin(date.getTime() / 8.64e7)) * 10) / 10
    );

    return {
        productId,
        date: date.toISOString().split('T')[0],
        quantity,
        temperature,
        rainfall,
        isWeekend: [0, 6].includes(dayOfWeek),
        isFestival
    };
};

export const generateSampleSalesCsv = async (req, res) => {
    try {
        const { productId } = req.params;
        const days = clampSampleDays(req.query.days || '60');

        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const entries = [];
        const today = new Date();

        for (let offset = days - 1; offset >= 0; offset -= 1) {
            const sampleDate = new Date(today);
            sampleDate.setDate(sampleDate.getDate() - offset);
            entries.push(buildSyntheticRow(productId, product, sampleDate));
        }

        const csvHeader =
            'productId,date,quantity,temperature,rainfall,isWeekend,isFestival\n';
        const csvBody = entries.map(toCsvLine).join('\n');
        const fileSafeName = product.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${fileSafeName || 'sample'}-sales-data.csv`
        );
        return res.status(200).send(csvHeader + csvBody);
    } catch (error) {
        console.error('Error generating sample CSV:', error);
        return res.status(500).json({ message: 'Failed to generate sample CSV' });
    }
};
