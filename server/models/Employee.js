import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  department: { type: String, required: [true, 'Department is required'], enum: ['Production', 'Quality Control', 'Warehouse', 'Design', 'Sales', 'Administration', 'Maintenance'] },
  role: { type: String, required: [true, 'Role is required'] },
  phone: { type: String, required: [true, 'Phone is required'], trim: true },
  joiningDate: { type: Date, required: [true, 'Joining date is required'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
