import { OpenAuth } from "@openauth/sdk";
import { MongooseOpenAuthAdapter } from "@openauth/mongodb-adapter";

// Initialize the core SDK core with your custom MongoDB adapter
export const auth = new OpenAuth(
  new MongooseOpenAuthAdapter(),
  {
    secret: process.env.OPENAUTH_SECRET || "fallback_super_secure_32_char_secret_key",
    auth: {
      strategy: "cookie", // Using secure browser cookie manager strategy
      allowUserSignups: true,
      enableEmailPassword: true,
      session: { duration: "7d" },
      organizations: {
        enabled: true,
        allowUserCreate: true,
        autoCreateOnSignup: false,
        defaultMaxMembers: 5
      }
    },
    providers: {
      github: { enabled: false },
      google: { enabled: false }
    }
  }
);