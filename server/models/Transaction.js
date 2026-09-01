import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: { type: String, required: [true, 'Type is required'], enum: ['Income', 'Expense'] },
  title: { type: String, required: [true, 'Title is required'], trim: true },
  amount: { type: Number, required: [true, 'Amount is required'], min: 0 },
  category: { type: String, required: [true, 'Category is required'], trim: true },
  date: { type: Date, required: [true, 'Date is required'] },
  description: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;