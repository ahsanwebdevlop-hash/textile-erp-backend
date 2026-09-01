import express from 'express';
import BatchLot from '../models/BatchLot.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import { getAll, getOne, createOne, updateOne, deleteOne } from '../controllers/baseController.js';

const router = express.Router();

router.get('/', protect, getAll(BatchLot, 'createdBy'));
router.get('/:id', protect, getOne(BatchLot, 'createdBy'));
router.post('/', protect, managerOrAdmin, createOne(BatchLot));
router.put('/:id', protect, managerOrAdmin, updateOne(BatchLot));
router.delete('/:id', protect, managerOrAdmin, deleteOne(BatchLot));

export default router;
