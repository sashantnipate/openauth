import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  active: boolean;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
}

export const MongoSessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  token: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  userAgent: { type: String, required: false },
  ipAddress: { type: String, required: false },
  expiresAt: { type: Date, required: true },
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Optimize index structures so token lookups during verification loops happen in O(1) time
MongoSessionSchema.index({ token: 1 });
MongoSessionSchema.index({ userId: 1 });
// Automatically purge expired tokens using a Mongo TTL index
MongoSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = mongoose.models.Session || mongoose.model<ISession>("Session", MongoSessionSchema);