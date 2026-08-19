import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ["local", "district", "state"],
      default: "local",
    },
    slaDays: {
      type: Number,
      default: 3,
      min: 1,
    },
    governanceScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Department =
  mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
export default Department;
