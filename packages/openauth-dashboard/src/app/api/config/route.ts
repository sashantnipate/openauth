import { NextResponse } from "next/server";
import { AuthConfigModel } from "@openauth/mongodb-adapter/src/models/Config.model";
import mongoose from "mongoose";

async function ensureDbConnected() {
  const state = mongoose.connection.readyState;
  if (state !== 1 && state !== 2) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from your environment setup profile.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

// 1. GET: Pulls live data records straight out of model abstraction layer safely
export async function GET() {
  try {
    await ensureDbConnected();
    let config = await AuthConfigModel.findOne().lean();
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

// 2. POST: Securely patches granular fields using target database object merging paths ($set)
export async function POST(req: Request) {
  try {
    await ensureDbConnected();
    const body = await req.json();

    const updatePayload: any = {};
    
    // Construct safe atomic deep patch path pointers instead of dropping whole sub-objects over old values
    if (body.settings) {
      for (const key of Object.keys(body.settings)) {
        if (typeof body.settings[key] === 'object' && body.settings[key] !== null) {
          for (const subKey of Object.keys(body.settings[key])) {
            updatePayload[`settings.${key}.${subKey}`] = body.settings[key][subKey];
          }
        } else {
          updatePayload[`settings.${key}`] = body.settings[key];
        }
      }
    }

    if (body.providers) {
      for (const provider of Object.keys(body.providers)) {
        updatePayload[`providers.${provider}.enabled`] = !!body.providers[provider].enabled;
      }
    }

    // Atomic upsert operation: creates document with default settings if missing, otherwise targets changes cleanly
    await AuthConfigModel.updateOne(
      {},
      { $set: updatePayload },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update configuration matrix." }, { status: 400 });
  }
} 