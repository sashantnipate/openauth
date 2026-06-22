import mongoose, { Schema } from "mongoose";

export const MongoMembershipSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  role: { type: String, enum: ["admin", "member"], required: true },
  joinedAt: { type: Date, default: Date.now },
});

// Enforce unique composite key constraint so a user can't join the same org twice
MongoMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const MembershipModel = mongoose.models.OrganizationMembership || mongoose.model("OrganizationMembership", MongoMembershipSchema);