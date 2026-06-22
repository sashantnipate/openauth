import mongoose, { Schema } from "mongoose";

export const MongoUserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: false }, // optional for OAuth users
  providers: {
    github: { type: String, required: false },
    google: { type: String, required: false },
  },
  canCreateOrganizations: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model("User", MongoUserSchema);