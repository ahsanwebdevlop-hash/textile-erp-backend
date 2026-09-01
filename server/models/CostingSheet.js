import mongoose from 'mongoose';

const costingSheetSchema = new mongoose.Schema({
  costingNumber: { type: String, required: [true, 'Costing number is required'], unique: true, trim: true },
  styleNumber: { type: String, required: true, trim: true },
  customerName: { type: String, required: true, trim: true },
  currency: { type: String, default: 'USD' },
  orderQuantity: { type: Number, required: true, min: 1 },
  
  yarnCostPerPiece: { type: Number, required: true, min: 0 },
  knittingWeavingCostPerPiece: { type: Number, required: true, min: 0 },
  dyeingFinishingCostPerPiece: { type: Number, required: true, min: 0 },
  trimsCostPerPiece: { type: Number, required: true, min: 0 },
  cmtCostPerPiece: { type: Number, required: true, min: 0 }, // Cut Make Trim
  freightAndLogisticsPerPiece: { type: Number, default: 0, min: 0 },
  
  subtotalCostPerPiece: { type: Number, required: true, min: 0 },
  targetMarginPercent: { type: Number, required: true, min: 0 },
  quotedFOBPricePerPiece: { type: Number, required: true, min: 0 },
  totalOrderFOBValue: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Draft', 'Quoted', 'Approved', 'Rejected'], default: 'Draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const CostingSheet = mongoose.model('CostingSheet', costingSheetSchema);
export default CostingSheet;
