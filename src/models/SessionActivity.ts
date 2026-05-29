import mongoose, { Schema, Types } from "mongoose";

export type SessionLogoutReason =
  | "user_logout"
  | "heartbeat_timeout"
  | "token_expired"
  | "forced_logout"
  | "unknown";

export interface SessionActivityDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  sessionId: string;
  isActive: boolean;
  loginAt: Date;
  logoutAt?: Date;
  lastSeenAt: Date;
  loginIp?: string;
  logoutIp?: string;
  userAgent?: string;
  logoutReason?: SessionLogoutReason;
  createdAt: Date;
  updatedAt: Date;
}

const sessionActivitySchema = new Schema<SessionActivityDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    loginAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    logoutAt: {
      type: Date,
      required: false,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    loginIp: {
      type: String,
      required: false,
    },
    logoutIp: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    logoutReason: {
      type: String,
      enum: [
        "user_logout",
        "heartbeat_timeout",
        "token_expired",
        "forced_logout",
        "unknown",
      ],
      required: false,
    },
  },
  { timestamps: true }
);

sessionActivitySchema.index({ sessionId: 1, userId: 1 }, { unique: true });
sessionActivitySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SessionActivity ||
  mongoose.model<SessionActivityDocument>("SessionActivity", sessionActivitySchema);
