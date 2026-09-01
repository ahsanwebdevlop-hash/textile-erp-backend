import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import bomRoutes from './routes/bomRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import qualityRoutes from './routes/qualityRoutes.js';
import costingRoutes from './routes/costingRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// CORS - Must be registered first
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// Security
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again later'
  }
});

app.use(express.json({ limit: '10mb' }));

// Middleware to ensure database connection is ready for every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database middleware error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Database connection timed out. Ensure MongoDB Atlas Network Access is set to 0.0.0.0/0 (Allow access from anywhere).'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/costing', costingRoutes);
app.use('/api/compliance', complianceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TextileFlow API is running',
    version: '3.0.0'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`TextileFlow v3 Server running on port ${PORT}`);
  });
}

export default app;