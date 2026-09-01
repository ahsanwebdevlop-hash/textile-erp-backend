import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import { getAll, getOne, deleteOne } from './baseController.js';

// Create Purchase
export const createPurchase = async (req, res, next) => {
  try {
    const {
      items = [],
      tax = 0,
      discount = 0,
      supplierId,
      supplier
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one purchase item is required'
      });
    }

    const subTotal = items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

    const totalAmount =
      subTotal + Number(tax || 0) - Number(discount || 0);

    // The PurchaseOrder schema stores supplier as a String,
    // not as an ObjectId/supplierId.
    let supplierName = supplier || '';

    // If frontend sends supplierId, convert it to the supplier's name.
    if (supplierId) {
      const supplierDoc = await Supplier.findById(supplierId);

      if (!supplierDoc) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      supplierName =
        supplierDoc.companyName ||
        supplierDoc.name ||
        supplierDoc.supplierName ||
        supplierName;
    }

    if (!supplierName) {
      return res.status(400).json({
        success: false,
        message: 'Supplier is required'
      });
    }

    // Do not save supplierId because it does not exist
    // in the PurchaseOrder schema.
    const purchaseData = {
      ...req.body,
      supplier: supplierName,
      items,
      subTotal,
      totalAmount,
      createdBy: req.user._id
    };

    delete purchaseData.supplierId;
    delete purchaseData.tax;
    delete purchaseData.discount;

    const purchase = await PurchaseOrder.create(purchaseData);

    // Update supplier statistics when supplierId was provided.
    if (supplierId) {
      await Supplier.findByIdAndUpdate(supplierId, {
        $inc: {
          totalPurchases: 1,
          totalAmountSpent: totalAmount
        }
      });
    }

    res.status(201).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    next(error);
  }
};

// Get all purchases
// IMPORTANT: only populate fields that actually exist in PurchaseOrder schema.
export const getPurchases = getAll(PurchaseOrder, 'createdBy');

// Get single purchase
export const getPurchase = getOne(PurchaseOrder, 'createdBy');

// Update Purchase
export const updatePurchase = async (req, res, next) => {
  try {
    const {
      items,
      tax = 0,
      discount = 0,
      supplierId
    } = req.body;

    const updateData = { ...req.body };

    // If items are updated, recalculate subtotal and total.
    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one purchase item is required'
        });
      }

      updateData.subTotal = items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      );

      updateData.totalAmount =
        updateData.subTotal +
        Number(tax || 0) -
        Number(discount || 0);
    }

    // If supplierId is sent by frontend, convert it to supplier name.
    if (supplierId) {
      const supplierDoc = await Supplier.findById(supplierId);

      if (!supplierDoc) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      updateData.supplier =
        supplierDoc.companyName ||
        supplierDoc.name ||
        supplierDoc.supplierName ||
        '';

      delete updateData.supplierId;
    }

    // These fields are not part of the PurchaseOrder schema.
    delete updateData.tax;
    delete updateData.discount;

    const purchase = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    next(error);
  }
};

// Delete Purchase
export const deletePurchase = deleteOne(PurchaseOrder);

// Purchase Statistics
export const getPurchaseStats = async (req, res, next) => {
  try {
    const [
      statusStats,
      totalAmount,
      recentPurchases
    ] = await Promise.all([
      PurchaseOrder.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$totalAmount' }
          }
        }
      ]),

      PurchaseOrder.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]),

      // No supplierId population because PurchaseOrder
      // does not contain a supplierId field.
      PurchaseOrder.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdBy', 'name')
    ]);

    res.json({
      success: true,
      data: {
        statusStats,
        totalAmount: totalAmount[0]?.total || 0,
        recentPurchases
      }
    });
  } catch (error) {
    next(error);
  }
};

// Purchase History by Supplier
export const getPurchaseHistory = async (req, res, next) => {
  try {
    const { supplierId } = req.params;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID is required'
      });
    }

    // PurchaseOrder stores supplier name, so first find the supplier.
    const supplierDoc = await Supplier.findById(supplierId);

    if (!supplierDoc) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const supplierName =
      supplierDoc.companyName ||
      supplierDoc.name ||
      supplierDoc.supplierName;

    if (!supplierName) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name could not be determined'
      });
    }

    const history = await PurchaseOrder.find({
      supplier: supplierName
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};