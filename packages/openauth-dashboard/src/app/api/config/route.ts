import { NextResponse } from "next/server";
import mongoose from "mongoose";

// A quick helper to guarantee that Mongoose is fully connected before query calls
async function ensureDbConnected() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from your environment setup profile.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

// Simple schema to track persistent configurations dynamically in MongoDB
const ConfigSchema = new mongoose.Schema({
  settings: {
    allowUserSignups: { type: Boolean, default: true },
    organizations: {
      enabled: { type: Boolean, default: false },
      allowUserCreate: { type: Boolean, default: false },
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

const AuthConfigModel = mongoose.models.AuthConfig || mongoose.model("AuthConfig", ConfigSchema);

// 1. GET: Pulls live data records straight out of MongoDB collections
export async function GET() {
  try {
    await ensureDbConnected();
    let config = await AuthConfigModel.findOne();
    if (!config) {
      config = await AuthConfigModel.create({});
    }

    return NextResponse.json({
      settings: config.settings,
      providers: config.providers,
      envStatus: {
        githubKeysPresent: !!(process.env.GITHUB_CLIENT_ID || process.env.GITHUB_ID),
        googleKeysPresent: !!(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to contact database." }, { status: 500 });
  }
}

// 2. POST: Saves state updates whenever the developer toggles any frontend button
export async function POST(req: Request) {
  try {
    await ensureDbConnected();
    const body = await req.json();

    let config = await AuthConfigModel.findOne();
    if (!config) {
      config = new AuthConfigModel();
    }

    if (body.settings) config.settings = body.settings;
    if (body.providers) config.providers = body.providers;

    await config.save();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update configuration matrix." }, { status: 400 });
  }
}