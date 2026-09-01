import express from 'express';
import { body, query } from 'express-validator';
import Inventory from '../models/Inventory.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import { getAll, getOne, updateOne, deleteOne } from '../controllers/baseController.js';

const router = express.Router();

router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().escape(),
  query('category').optional().isIn(['Cotton', 'Polyester', 'Silk', 'Denim', 'Wool', 'Linen', 'Nylon', 'Other'])
], getAll(Inventory, 'createdBy'));

router.get('/:id', protect, getOne(Inventory, 'createdBy'));

router.post('/', protect, managerOrAdmin, [
  body('materialName').trim().notEmpty().withMessage('Material name is required'),
  body('category').isIn(['Cotton', 'Polyester', 'Silk', 'Denim', 'Wool', 'Linen', 'Nylon', 'Other']).withMessage('Invalid category'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity cannot be negative'),
  body('unit').isIn(['KG', 'Meter', 'Pieces', 'Roll', 'Box']).withMessage('Invalid unit'),
  body('supplier').trim().notEmpty().withMessage('Supplier is required'),
  body('purchaseDate').isISO8601().withMessage('Valid purchase date is required')
], async (req, res, next) => {
  try {
    const item = await Inventory.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
});

router.put('/:id', protect, managerOrAdmin, updateOne(Inventory));
router.delete('/:id', protect, managerOrAdmin, deleteOne(Inventory));

export default router;