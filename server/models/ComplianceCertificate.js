import mongoose from 'mongoose';

const complianceCertificateSchema = new mongoose.Schema({
  certificateNumber: { type: String, required: [true, 'Certificate number is required'], unique: true, trim: true },
  certificationType: { type: String, enum: ['OEKO-TEX Standard 100', 'GOTS Organic', 'ZDHC Chemical Safety', 'ISO 9001 Quality', 'WRAP Social Audit', 'BSCI Audit'], required: true },
  issuingAuthority: { type: String, required: true, trim: true },
  supplierOrFacility: { type: String, required: true, trim: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Expiring Soon', 'Expired', 'Revoked'], default: 'Active' },
  scopeNotes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const ComplianceCertificate = mongoose.model('ComplianceCertificate', complianceCertificateSchema);
export default ComplianceCertificate;
