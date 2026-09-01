import SalesOrder from '../models/SalesOrder.js';
import { getAll, getOne, updateOne, deleteOne } from './baseController.js';

export const createSalesOrder = async (req, res, next) => {
  try {
    const { quantity, unitPrice } = req.body;
    const totalAmount = Number(quantity) * Number(unitPrice);
    
    const order = await SalesOrder.create({
      ...req.body,
      totalAmount,
      timeline: [{ status: req.body.orderStatus || 'Pending', timestamp: new Date(), note: 'Order created' }],
      createdBy: req.user._id
    });
    
    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const getSalesOrders = getAll(SalesOrder, 'createdBy');

export const getSalesOrder = getOne(SalesOrder, 'createdBy');

export const updateSalesOrder = async (req, res, next) => {
  try {
    const { quantity, unitPrice, orderStatus } = req.body;
    const updateData = { ...req.body };
    
    if (quantity && unitPrice) {
      updateData.totalAmount = Number(quantity) * Number(unitPrice);
    }
    
    const existing = await SalesOrder.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Sales order not found' });
    
    if (orderStatus && existing.orderStatus !== orderStatus) {
      updateData.$push = {
        timeline: {
          status: orderStatus,
          timestamp: new Date(),
          note: req.body.timelineNote || `Status changed to ${orderStatus}`
        }
      };
    }
    
    const order = await SalesOrder.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const deleteSalesOrder = deleteOne(SalesOrder);

export const getSalesStats = async (req, res, next) => {
  try {
    const [statusStats, paymentStats, totalRevenue, topCustomers] = await Promise.all([
      SalesOrder.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      SalesOrder.aggregate([{ $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }]),
      SalesOrder.aggregate([{ $match: { orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      SalesOrder.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: '$customerName', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        statusStats, 
        paymentStats, 
        totalRevenue: totalRevenue[0]?.total || 0,
        topCustomers 
      } 
    });
  } catch (error) { next(error); }
};

export const getCustomerHistory = async (req, res, next) => {
  try {
    const { customerName } = req.params;
    const history = await SalesOrder.find({ customerName }).sort({ createdAt: -1 });
    const stats = await SalesOrder.aggregate([
      { $match: { customerName } },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' }, avgOrder: { $avg: '$totalAmount' } } }
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        history, 
        stats: stats[0] || { totalOrders: 0, totalSpent: 0, avgOrder: 0 } 
      } 
    });
  } catch (error) { next(error); }
};