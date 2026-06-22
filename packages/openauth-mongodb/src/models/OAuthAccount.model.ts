import mongoose, { Schema } from "mongoose";

export const MongoOAuthAccountSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  provider: { type: String, enum: ["github", "google"], required: true },
  providerUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

MongoOAuthAccountSchema.index({ provider: 1, providerUserId: 1 }, { unique: true });

export const OAuthAccountModel = mongoose.models.OAuthAccount || mongoose.model("OAuthAccount", MongoOAuthAccountSchema);