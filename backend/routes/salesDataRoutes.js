import express from 'express';
import multer from 'multer';
import {
    getSalesData,
    addSalesData,
    importSalesData,
    deleteSalesData,
    generateSampleSalesCsv
} from '../controllers/salesDataController.js';
import validateSales from "../middleware/validateSales.js";
import Product from "../models/Product.js";

const router = express.Router();

// Configure multer for CSV uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
    }
});

// GET sales data for a product
router.get('/product/:productId', getSalesData);

// GET synthetic CSV for a product
router.get('/sample/:productId', generateSampleSalesCsv);

// POST a new sales data entry
router.post("/", validateSales, addSalesData);

// POST restock a product
router.post("/product/:productId/restock", async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || quantity <= 0) {
            return res.status(400).json({message: "Please provide a positive quantity"});
        }
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }
        
        // Update stock
        product.currentStock += parseInt(quantity);
        await product.save();
        
        res.status(200).json({
            success: true,
            message: `Stock updated successfully. New stock: ${product.currentStock}`,
            product
        });
    } catch (error) {
        console.error("Error restocking product:", error);
        res.status(500).json({message: error.message});
    }
});

// POST import sales data from CSV
router.post('/import', upload.single('file'), importSalesData);

// DELETE sales data
router.delete('/:id', deleteSalesData);

export default router;
