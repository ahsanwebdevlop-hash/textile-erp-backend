import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  materialName: { type: String, required: [true, 'Material name is required'], trim: true },
  category: { type: String, required: [true, 'Category is required'], enum: ['Cotton', 'Polyester', 'Silk', 'Denim', 'Wool', 'Linen', 'Nylon', 'Other'] },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: [0, 'Quantity cannot be negative'] },
  unit: { type: String, required: [true, 'Unit is required'], enum: ['KG', 'Meter', 'Pieces', 'Roll', 'Box'] },
  supplier: { type: String, required: [true, 'Supplier is required'], trim: true },
  purchaseDate: { type: Date, required: [true, 'Purchase date is required'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
