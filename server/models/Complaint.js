import mongoose from "mongoose";

const StatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["pending", "in_review", "resolved", "rejected", "escalated"],
    },
    changedBy: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId of User or "system"
      default: "system",
    },
    role: {
      type: String,
      default: "citizen",
    },
    remark: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ComplaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_review", "resolved", "rejected", "escalated"],
      default: "pending",
    },
    tier: {
      type: String,
      enum: ["local", "district", "state"],
      default: "local",
    },
    photos: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    escalatedAt: {
      type: Date,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Complaint =
  mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);
export default Complaint;
