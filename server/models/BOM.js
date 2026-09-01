import mongoose from 'mongoose';

const bomItemSchema = new mongoose.Schema({
  materialName: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Yarn', 'Fabric', 'Dye Chemical', 'Trim', 'Packaging', 'Other'], required: true },
  consumption: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, enum: ['KG', 'Meter', 'Grams', 'Yards', 'Pieces', 'Roll', 'Box'] },
  unitCost: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
});

const bomSchema = new mongoose.Schema({
  styleNumber: { type: String, required: [true, 'Style number is required'], unique: true, trim: true },
  styleName: { type: String, required: [true, 'Style name is required'], trim: true },
  garmentType: { type: String, required: true, enum: ['T-Shirt', 'Polo', 'Denim Jeans', 'Hoodie', 'Dress', 'Bedding', 'Towel', 'Other'] },
  season: { type: String, default: 'Spring/Summer 2026' },
  targetGSM: { type: Number, min: 0 },
  fabricComposition: { type: String, trim: true },
  items: [bomItemSchema],
  totalBOMCost: { type: Number, required: true, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const BOM = mongoose.model('BOM', bomSchema);
export default BOM;
