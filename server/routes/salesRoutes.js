import express from 'express';
import { body, query } from 'express-validator';
import {
  createSalesOrder,
  getSalesOrders,
  getSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  getSalesStats,
  getCustomerHistory
} from '../controllers/salesController.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().escape(),
  query('orderStatus').optional().isIn(['Pending', 'Confirmed', 'Production Started', 'Quality Check', 'Packing', 'Dispatched', 'Delivered', 'Cancelled']),
  query('paymentStatus').optional().isIn(['Pending', 'Partial', 'Paid', 'Refunded'])
], getSalesOrders);

router.get('/stats', protect, getSalesStats);
router.get('/customer/:customerName', protect, getCustomerHistory);
router.get('/:id', protect, getSalesOrder);

router.post('/', protect, managerOrAdmin, [
  body('orderNumber').trim().notEmpty().withMessage('Order number is required'),
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('deliveryDate').isISO8601().withMessage('Valid delivery date is required'),
  body('orderStatus').optional().isIn(['Pending', 'Confirmed', 'Production Started', 'Quality Check', 'Packing', 'Dispatched', 'Delivered', 'Cancelled']),
  body('paymentStatus').optional().isIn(['Pending', 'Partial', 'Paid', 'Refunded'])
], createSalesOrder);

router.put('/:id', protect, managerOrAdmin, [
  body('orderStatus').optional().isIn(['Pending', 'Confirmed', 'Production Started', 'Quality Check', 'Packing', 'Dispatched', 'Delivered', 'Cancelled']),
  body('paymentStatus').optional().isIn(['Pending', 'Partial', 'Paid', 'Refunded']),
  body('amountPaid').optional().isFloat({ min: 0 })
], updateSalesOrder);

router.delete('/:id', protect, managerOrAdmin, deleteSalesOrder);

export default router;