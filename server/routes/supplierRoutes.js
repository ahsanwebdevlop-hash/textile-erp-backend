import express from 'express';
import { body, query } from 'express-validator';
import {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStats,
  getSupplierPurchaseHistory
} from '../controllers/supplierController.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().escape(),
  query('paymentStatus').optional().isIn(['Paid', 'Pending', 'Overdue']),
  query('isActive').optional().isBoolean()
], getSuppliers);

router.get('/stats', protect, getSupplierStats);
router.get('/:id', protect, getSupplier);
router.get('/:id/purchase-history', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], getSupplierPurchaseHistory);

router.post('/', protect, managerOrAdmin, [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('paymentTerms').optional().isIn(['Net 15', 'Net 30', 'Net 60', 'Cash on Delivery', 'Prepaid']),
  body('paymentStatus').optional().isIn(['Paid', 'Pending', 'Overdue']),
  body('outstandingBalance').optional().isFloat({ min: 0 }),
  body('isActive').optional().isBoolean()
], createSupplier);

router.put('/:id', protect, managerOrAdmin, updateSupplier);
router.delete('/:id', protect, managerOrAdmin, deleteSupplier);

export default router;