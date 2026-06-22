import mongoose, { Schema } from "mongoose";

export const MongoOrganizationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  creatorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  maxMembers: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
});

export const OrganizationModel = mongoose.models.Organization || mongoose.model("Organization", MongoOrganizationSchema);