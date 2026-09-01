import mongoose from 'mongoose';

const defectItemSchema = new mongoose.Schema({
  defectType: { type: String, required: true }, // e.g. Holes, Stains, Shade Variation, Broken Stitch
  severity: { type: String, enum: ['Minor', 'Major', 'Critical'], required: true },
  defectCount: { type: Number, required: true, min: 1 },
  pointsPenalty: { type: Number, required: true, min: 0 },
});

const qualityInspectionSchema = new mongoose.Schema({
  inspectionNumber: { type: String, required: [true, 'Inspection number is required'], unique: true, trim: true },
  inspectionType: { type: String, enum: ['4-Point Fabric Inspection', 'Garment AQL 2.5', 'In-Line Sewing Audit'], required: true },
  batchOrOrderId: { type: String, required: true, trim: true },
  inspectedQuantity: { type: Number, required: true, min: 1 },
  sampleSize: { type: Number, required: true, min: 1 },
  totalDefects: { type: Number, default: 0 },
  fourPointScore: { type: Number, default: 0 }, // Points per 100 sq yards
  status: { type: String, enum: ['PASSED', 'FAILED', 'CONDITIONAL_ACCEPTANCE'], required: true },
  defects: [defectItemSchema],
  inspectorName: { type: String, required: true },
  remarks: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const QualityInspection = mongoose.model('QualityInspection', qualityInspectionSchema);
export default QualityInspection;
