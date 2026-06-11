import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Inline schema definition - KEEP GLOBAL SCOPE CLEAN OF INSTANT CONNECTION EXECUTIONS
const AuthSettingsSchema = new mongoose.Schema({
  settings: {
    sessionDuration: { type: String, default: '1d' },
    organizations: {
      enabled: { type: Boolean, default: false },
      allowUserCreate: { type: Boolean, default: false },
      autoCreateOnSignup: { type: Boolean, default: false },
      defaultMaxMembers: { type: Number, default: 5 }
    },
    allowUserSignups: { type: Boolean, default: true }
  },
  providers: {
    github: { enabled: { type: Boolean, default: false } },
    google: { enabled: { type: Boolean, default: false } }
  }
});

const AuthSettingsModel = mongoose.models.AuthSettings || mongoose.model('AuthSettings', AuthSettingsSchema);

const DEFAULT_CONFIG = {
  settings: {
    sessionDuration: "1d",
    organizations: { enabled: false, allowUserCreate: false, autoCreateOnSignup: false, defaultMaxMembers: 5 },
    allowUserSignups: true
  },
  providers: { github: { enabled: false }, google: { enabled: false } }
};

export async function GET() {
  try {
    // 1. Guard check before doing anything else
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ 
        error: 'MONGODB_URI environment variable is missing or unreadable by the dashboard process.' 
      }, { status: 500 });
    }

    // 2. LAZY CONNECTION: Connect only when the route handler is invoked!
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    let config = await AuthSettingsModel.findOne().lean();
    if (!config) {
      config = await AuthSettingsModel.create(DEFAULT_CONFIG);
    }

    const responsePayload = {
      ...config,
      envStatus: {
        githubKeysPresent: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        googleKeysPresent: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      }
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to sync with database server.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'MONGODB_URI is missing.' }, { status: 500 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const updatedConfig = await request.json();
    
    const cleanUpdatePayload = {
      settings: updatedConfig.settings,
      providers: {
        github: { enabled: !!updatedConfig.providers?.github?.enabled },
        google: { enabled: !!updatedConfig.providers?.google?.enabled }
      }
    };

    const doc = await AuthSettingsModel.findOneAndUpdate({}, cleanUpdatePayload, { new: true, upsert: true });
    return NextResponse.json({ success: true, updatedConfig: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database write operational failure.' }, { status: 500 });
  }
}