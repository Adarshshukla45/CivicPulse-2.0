import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.Mixed, default: null },
  role: { type: String, required: true },
  remark: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['roads', 'water', 'power', 'sanitation', 'health', 'other'], required: true },
  location: { type: String, required: true },
  photos: [{ type: String }],
  status: { type: String, enum: ['pending', 'in_review', 'resolved', 'rejected', 'escalated'], default: 'pending' },
  tier: { type: String, enum: ['local', 'district', 'state'], default: 'local' },
  statusHistory: [statusHistorySchema],
  escalatedAt: { type: Date, default: null },
  satisfactionRating: { type: Number, min: 1, max: 5, default: null },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
