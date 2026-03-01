// models/Lead.ts
import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema({
  fromStatus: String,
  toStatus: String,
  notes: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
});

// Dynamic field schema
const dynamicFieldSchema = new mongoose.Schema({
  key: String,
  value: String,
});

const leadSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  dateOfBirth: Date,
  address: String,
  applicationType: String,
  lawsuit: String,
  notes: String,
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  fields: [dynamicFieldSchema], // Array of dynamic fields
  status: {
    type: String,
   enum: [
  "PENDING",
  "REJECTED",
  "VERIFIED",
  "REJECTED_BY_CLIENT",
  "PAID",
  "DUPLICATE",
  "NOT_RESPONDING",
  "FELONY",
  "DEAD_LEAD",
  "WORKING",
  "CALL_BACK",
  "ATTEMPT_1",
  "ATTEMPT_2",
  "ATTEMPT_3",
  "ATTEMPT_4",
  "CHARGEBACK",
  "WAITING_ID",
  "SENT_TO_CLIENT",
  "QC",
  "ID_VERIFIED",
  "BILLABLE",
  "CAMPAIGN_PAUSED",
  "SENT_TO_LAW_FIRM"
],

    default: "PENDING",
  },
  statusHistory: [statusHistorySchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  buyerCode: { type: String },
}, { timestamps: true });

// Indexes to speed up filtering by creator and buyer code
leadSchema.index({ createdBy: 1, createdAt: -1 });
leadSchema.index({ buyerCode: 1, createdAt: -1 });

export default mongoose.models.Lead || mongoose.model("Lead", leadSchema);
