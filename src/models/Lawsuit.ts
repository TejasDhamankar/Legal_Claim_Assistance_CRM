import mongoose from "mongoose";

const lawsuitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Lawsuit || mongoose.model("Lawsuit", lawsuitSchema);
