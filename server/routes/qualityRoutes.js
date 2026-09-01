import express from 'express';
import QualityInspection from '../models/QualityInspection.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import { getAll, getOne, createOne, updateOne, deleteOne } from '../controllers/baseController.js';

const router = express.Router();

router.get('/', protect, getAll(QualityInspection, 'createdBy'));
router.get('/:id', protect, getOne(QualityInspection, 'createdBy'));
router.post('/', protect, managerOrAdmin, createOne(QualityInspection));
router.put('/:id', protect, managerOrAdmin, updateOne(QualityInspection));
router.delete('/:id', protect, managerOrAdmin, deleteOne(QualityInspection));

export default router;
