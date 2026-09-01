import express from 'express';
import BOM from '../models/BOM.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import { getAll, getOne, createOne, updateOne, deleteOne } from '../controllers/baseController.js';

const router = express.Router();

router.get('/', protect, getAll(BOM, 'createdBy'));
router.get('/:id', protect, getOne(BOM, 'createdBy'));
router.post('/', protect, managerOrAdmin, createOne(BOM));
router.put('/:id', protect, managerOrAdmin, updateOne(BOM));
router.delete('/:id', protect, managerOrAdmin, deleteOne(BOM));

export default router;
