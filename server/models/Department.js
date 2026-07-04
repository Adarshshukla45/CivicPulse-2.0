import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tier: { type: String, enum: ['local', 'district', 'state'], default: 'local' },
  slaDays: { type: Number, default: 3 },
  governanceScore: { type: Number, default: 100, min: 0, max: 100 },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export default mongoose.model('Department', departmentSchema);
