import express from 'express';
import { body, query } from 'express-validator';
import Employee from '../models/Employee.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import { getAll, getOne, updateOne, deleteOne } from '../controllers/baseController.js';

const router = express.Router();

router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().escape(),
  query('department').optional().isIn(['Production', 'Quality Control', 'Warehouse', 'Design', 'Sales', 'Administration', 'Maintenance'])
], getAll(Employee, 'createdBy'));

router.get('/:id', protect, getOne(Employee, 'createdBy'));

router.post('/', protect, managerOrAdmin, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('department').isIn(['Production', 'Quality Control', 'Warehouse', 'Design', 'Sales', 'Administration', 'Maintenance']).withMessage('Invalid department'),
  body('role').trim().notEmpty().withMessage('Role is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('joiningDate').isISO8601().withMessage('Valid joining date is required')
], async (req, res, next) => {
  try {
    const employee = await Employee.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: employee });
  } catch (error) { next(error); }
});

router.put('/:id', protect, managerOrAdmin, updateOne(Employee));
router.delete('/:id', protect, managerOrAdmin, deleteOne(Employee));

export default router;