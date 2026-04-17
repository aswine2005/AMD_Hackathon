import express from 'express';
import multer from 'multer';
import { 
    getCategories, 
    getCategoryById, 
    createCategory, 
    updateCategory,
    deleteCategory,
    importCategoriesFromCsv
} from '../controllers/categoryController.js';

const router = express.Router();

// GET all categories
router.get('/', getCategories);

// GET a single category by ID
router.get('/:id', getCategoryById);

// POST a new category
router.post('/', createCategory);

// PATCH (update) a category
router.patch('/:id', updateCategory);

// DELETE a category
router.delete('/:id', deleteCategory);

// Set up storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Import categories from CSV
router.post('/import/csv', upload.single('file'), importCategoriesFromCsv);

export default router;
