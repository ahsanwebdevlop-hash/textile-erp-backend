import express from 'express';
import { body, query } from 'express-validator';
import {
  createPurchase,
  getPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseStats,
  getPurchaseHistory
} from '../controllers/purchaseController.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().escape(),
  query('status').optional().isIn(['Draft', 'Pending', 'Approved', 'Ordered', 'Received', 'Cancelled']).withMessage('Invalid status')
], getPurchases);

router.get('/stats', protect, getPurchaseStats);
router.get('/history/:supplierId', protect, getPurchaseHistory);
router.get('/:id', protect, getPurchase);

router.post('/', protect, managerOrAdmin, [
  body('purchaseNumber').trim().notEmpty().withMessage('Purchase number is required'),
  body('supplier').trim().notEmpty().withMessage('Supplier is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.materialName').trim().notEmpty().withMessage('Material name is required'),
  body('items.*.quantity').isFloat({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('purchaseDate').isISO8601().withMessage('Valid purchase date is required'),
  body('status').optional().isIn(['Draft', 'Pending', 'Approved', 'Ordered', 'Received', 'Cancelled']),
  body('tax').optional().isFloat({ min: 0 }).withMessage('Tax cannot be negative'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative')
], createPurchase);

router.put('/:id', protect, managerOrAdmin, [
  body('status').optional().isIn(['Draft', 'Pending', 'Approved', 'Ordered', 'Received', 'Cancelled']),
  body('tax').optional().isFloat({ min: 0 }),
  body('discount').optional().isFloat({ min: 0 })
], updatePurchase);

router.delete('/:id', protect, managerOrAdmin, deletePurchase);

export default router;