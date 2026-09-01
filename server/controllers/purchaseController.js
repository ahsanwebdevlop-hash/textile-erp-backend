import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import { createOne, getAll, getOne, updateOne, deleteOne } from './baseController.js';

export const createPurchase = async (req, res, next) => {
  try {
    const { items, tax = 0, discount = 0, supplierId } = req.body;
    const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const totalAmount = subTotal + Number(tax) - Number(discount);
    
    const purchase = await PurchaseOrder.create({
      ...req.body,
      subTotal,
      totalAmount,
      createdBy: req.user._id
    });
    
    if (supplierId) {
      await Supplier.findByIdAndUpdate(supplierId, {
        $inc: { totalPurchases: 1, totalAmountSpent: totalAmount }
      });
    }
    
    res.status(201).json({ success: true, data: purchase });
  } catch (error) { next(error); }
};

export const getPurchases = getAll(PurchaseOrder, 'createdBy');
export const getPurchase = getOne(PurchaseOrder, 'createdBy');

export const updatePurchase = async (req, res, next) => {
  try {
    const { items, tax = 0, discount = 0 } = req.body;
    if (items) {
      req.body.subTotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
      req.body.totalAmount = req.body.subTotal + Number(tax) - Number(discount);
    }
    const purchase = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.json({ success: true, data: purchase });
  } catch (error) { next(error); }
};

export const deletePurchase = deleteOne(PurchaseOrder);

export const getPurchaseStats = async (req, res, next) => {
  try {
    const [statusStats, totalAmount, recentPurchases] = await Promise.all([
      PurchaseOrder.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }]),
      PurchaseOrder.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      PurchaseOrder.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name')
    ]);
    res.json({ success: true, data: { statusStats, totalAmount: totalAmount[0]?.total || 0, recentPurchases } });
  } catch (error) { next(error); }
};

export const getPurchaseHistory = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const history = await PurchaseOrder.find({ supplierId }).sort({ createdAt: -1 }).populate('createdBy', 'name');
    res.json({ success: true, count: history.length, data: history });
  } catch (error) { next(error); }
};