import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { helmetMiddleware, rateLimiter, strictRateLimiter, sanitizeInput } from './middleware/security.js';

// Import routes
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import forecastRoutes from "./routes/forecastRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import salesDataRoutes from "./routes/salesDataRoutes.js";
import categoryAnalyticsRoutes from "./routes/categoryAnalyticsRoutes.js";
import stockRecommendationsRoutes from "./routes/stockRecommendationsRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import rankingsRoutes from "./routes/rankingsRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import priceAnalysisRoutes from "./routes/priceAnalysisRoutes.js";
import { initScheduler } from "./services/emailScheduler.js";

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3456;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration — origins from env or defaults
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

// Security middleware
app.use(helmetMiddleware);
app.use(rateLimiter);
app.use(sanitizeInput);

// Compression
app.use(compression());

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI environment variable is not set. Check your .env file.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected...');
    // Initialize email scheduler after DB connection is established
    try {
      await initScheduler();
      console.log('Email scheduler initialized');
    } catch (error) {
      console.error('Failed to initialize email scheduler:', error);
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/health', healthRoutes); // Health check endpoint must be first for quick response
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/sales-data', salesDataRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics/category', categoryAnalyticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stock-recommendations', stockRecommendationsRoutes);
app.use("/api/sales-data/templates", templateRoutes);
app.use("/api/rankings", rankingsRoutes);
app.use("/api/email", strictRateLimiter, emailRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/price-analysis", priceAnalysisRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Server
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
