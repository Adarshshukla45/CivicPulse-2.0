import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'dept_admin', 'super_admin'], default: 'citizen' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  refreshToken: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
