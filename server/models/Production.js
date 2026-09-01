import mongoose from 'mongoose';

const productionSchema = new mongoose.Schema({
  orderId: { type: String, required: [true, 'Order ID is required'], unique: true, trim: true },
  customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
  productName: { type: String, required: [true, 'Product name is required'], trim: true },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] },
  status: { type: String, required: [true, 'Status is required'], enum: ['Pending', 'In Production', 'Completed'], default: 'Pending' },
  startDate: { type: Date, required: [true, 'Start date is required'] },
  completionDate: { type: Date, required: [true, 'Completion date is required'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Production = mongoose.model('Production', productionSchema);
export default Production;
