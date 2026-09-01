// server/routes/transactionRoutes.js
import express from 'express';
import { body, query } from 'express-validator';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getAccountsSummary,
  getMonthlyReport
} from '../controllers/accountsController.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Custom date validator
const isValidDate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};

router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().escape(),
  query('type').optional().isIn(['Income', 'Expense']),
  query('category').optional().trim(),
  query('startDate').optional().custom(isValidDate),
  query('endDate').optional().custom(isValidDate)
], getTransactions);

router.get('/summary', protect, getAccountsSummary);
router.get('/monthly-report', protect, getMonthlyReport);
router.get('/:id', protect, getTransaction);

router.post('/', protect, managerOrAdmin, [
  body('type').isIn(['Income', 'Expense']).withMessage('Type must be Income or Expense'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').custom(isValidDate).withMessage('Valid date is required'),
  body('paymentMethod').optional().isIn(['Cash', 'Bank Transfer', 'Check', 'Credit Card', 'Online'])
], createTransaction);

router.put('/:id', protect, managerOrAdmin, updateTransaction);
router.delete('/:id', protect, managerOrAdmin, deleteTransaction);

export default router;