import express from 'express';

const router = express.Router();

// Simple health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API server is running', 
    timestamp: new Date().toISOString(),
    serverVersion: '1.0.0'
  });
});

export default router;
