import express from 'express';
import CostingSheet from '../models/CostingSheet.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import { getAll, getOne, createOne, updateOne, deleteOne } from '../controllers/baseController.js';

const router = express.Router();

router.get('/', protect, getAll(CostingSheet, 'createdBy'));
router.get('/:id', protect, getOne(CostingSheet, 'createdBy'));
router.post('/', protect, managerOrAdmin, createOne(CostingSheet));
router.put('/:id', protect, managerOrAdmin, updateOne(CostingSheet));
router.delete('/:id', protect, managerOrAdmin, deleteOne(CostingSheet));

export default router;
