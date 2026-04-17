import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Routes to serve CSV template files
router.get('/product-template.csv', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=products-template.csv');
  res.send('name,category,initialStock,price,description');
});

router.get('/category-template.csv', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=categories-template.csv');
  res.send('name,description');
});

router.get('/sales-data-template.csv', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sales-data-template.csv');
  res.send('date,productId,quantity,temperature,rainfall,isWeekend,isFestival,notes');
});

// For backward compatibility
router.get('/invalid-dates-template.csv', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sales-data-template.csv');
  res.send('date,productId,quantity,temperature,rainfall,isWeekend,isFestival,notes');
});

export default router;
