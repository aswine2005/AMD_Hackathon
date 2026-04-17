import express from 'express';
import multer from 'multer';
import { 
    getProducts, 
    getProductById, 
    getProductsByCategory,
    createProduct, 
    updateProduct,
    deleteProduct,
    restockProduct,
    importProductsFromCsv
} from '../controllers/productController.js';

const router = express.Router();

// GET all products
router.get('/', getProducts);

// GET products by category
router.get('/category/:categoryId', getProductsByCategory);

// GET a single product by ID
router.get('/:id', getProductById);

// POST a new product
router.post('/', createProduct);

// PATCH (update) a product
router.patch('/:id', updateProduct);

// Restock a product
router.post('/:id/restock', restockProduct);

// DELETE a product
router.delete('/:id', deleteProduct);

// Set up storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Import products from CSV
router.post('/import/csv', upload.single('file'), importProductsFromCsv);

export default router;
