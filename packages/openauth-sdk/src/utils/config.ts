import mongoose from "mongoose";
import { OpenAuthConfigMatrix } from "../types/config";

const DEFAULT_CONFIG: OpenAuthConfigMatrix = {
  settings: {
    sessionDuration: "1d",
    organizations: {
      enabled: false,
      allowUserCreate: false,
      autoCreateOnSignup: false,
      defaultMaxMembers: 5,
    },
    allowUserSignups: true,
  },
  providers: {
    github: { enabled: false },
    google: { enabled: false },
  },
};

export async function getLiveDatabaseConfig(): Promise<OpenAuthConfigMatrix> {
  try {
    const AuthSettings =
      mongoose.models.AuthSettings ||
      mongoose.model("AuthSettings", new mongoose.Schema({}, { strict: false }));

    const config = await AuthSettings.findOne().lean();

    return (config as OpenAuthConfigMatrix) || DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}