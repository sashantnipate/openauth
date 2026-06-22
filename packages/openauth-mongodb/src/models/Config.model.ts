import mongoose, { Schema, Document } from "mongoose";

export interface IAuthConfig extends Document {
  settings: {
    allowUserSignups: boolean;
    organizations: {
      enabled: boolean;
      allowUserCreate: boolean;
      autoCreateOnSignup: boolean;
      defaultMaxMembers: number;
    };
    sessionDuration: string;
  };
  providers: {
    github: { enabled: boolean };
    google: { enabled: boolean };
  };
}

export const AuthConfigSchema = new Schema<IAuthConfig>({
  settings: {
    allowUserSignups: { type: Boolean, default: true },
    organizations: {
      enabled: { type: Boolean, default: false },
      allowUserCreate: { type: Boolean, default: true },
      autoCreateOnSignup: { type: Boolean, default: false },
      defaultMaxMembers: { type: Number, default: 5 }
    },
    sessionDuration: { type: String, default: "7d" }
  },
  providers: {
    github: { enabled: { type: Boolean, default: false } },
    google: { enabled: { type: Boolean, default: false } }
  }
}, { timestamps: true, collection: "auth_configs" });

export const AuthConfigModel = mongoose.models.AuthConfig || mongoose.model<IAuthConfig>("AuthConfig", AuthConfigSchema);