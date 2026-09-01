import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { getAll, getOne, updateOne, deleteOne } from './baseController.js';

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

export const getSuppliers = getAll(Supplier, 'createdBy');

export const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate('createdBy', 'name email');
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    
    const purchaseHistory = await PurchaseOrder.find({ supplierId: supplier._id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');
    
    res.json({ 
      success: true, 
      data: { 
        ...supplier.toObject(), 
        purchaseHistory,
        totalPurchaseOrders: purchaseHistory.length,
        totalSpent: purchaseHistory.reduce((sum, p) => sum + (p.totalAmount || 0), 0)
      } 
    });
  } catch (error) { next(error); }
};

export const updateSupplier = updateOne(Supplier);
export const deleteSupplier = deleteOne(Supplier);

export const getSupplierStats = async (req, res, next) => {
  try {
    const [paymentStats, activeCount, totalOutstanding] = await Promise.all([
      Supplier.aggregate([{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }]),
      Supplier.countDocuments({ isActive: true }),
      Supplier.aggregate([{ $group: { _id: null, total: { $sum: '$outstandingBalance' } } }])
    ]);
    res.json({ 
      success: true, 
      data: { 
        paymentStats, 
        activeCount, 
        inactiveCount: await Supplier.countDocuments({ isActive: false }),
        totalOutstanding: totalOutstanding[0]?.total || 0 
      } 
    });
  } catch (error) { next(error); }
};

export const getSupplierPurchaseHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const [history, total] = await Promise.all([
      PurchaseOrder.find({ supplierId: id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PurchaseOrder.countDocuments({ supplierId: id })
    ]);
    
    res.json({
      success: true,
      count: history.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: history
    });
  } catch (error) { next(error); }
};