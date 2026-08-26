import mongoose from "mongoose";

const buyerCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    label: { type: String, trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

buyerCodeSchema.index({ code: 1 }, { unique: true });

export default mongoose.models.BuyerCode || mongoose.model("BuyerCode", buyerCodeSchema);
