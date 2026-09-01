import express from 'express';
import ComplianceCertificate from '../models/ComplianceCertificate.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import { getAll, getOne, createOne, updateOne, deleteOne } from '../controllers/baseController.js';

const router = express.Router();

router.get('/', protect, getAll(ComplianceCertificate, 'createdBy'));
router.get('/:id', protect, getOne(ComplianceCertificate, 'createdBy'));
router.post('/', protect, managerOrAdmin, createOne(ComplianceCertificate));
router.put('/:id', protect, managerOrAdmin, updateOne(ComplianceCertificate));
router.delete('/:id', protect, managerOrAdmin, deleteOne(ComplianceCertificate));

export default router;
