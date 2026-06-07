import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const targetProjectRoot = process.env.APP_TARGET_PROJECT_ROOT || process.cwd();
const configPath = path.join(targetProjectRoot, 'openauth.json');

export async function GET() {
  try {
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: 'Configuration matrix missing' }, { status: 404 });
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse configuration matrix' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updatedConfig = await request.json();
    
    // Light structural sanity verification layer protecting local configurations from corruption
    if (!updatedConfig || typeof updatedConfig !== 'object') {
      return NextResponse.json({ error: 'Invalid configuration object formatting' }, { status: 400 });
    }
    if (!updatedConfig.settings || !updatedConfig.providers) {
      return NextResponse.json({ error: 'Missing necessary system control object definitions' }, { status: 400 });
    }

    // Safely enforce consistent object schema transformations prior to write operations
    if (typeof updatedConfig.settings.organizations === 'boolean') {
      updatedConfig.settings.organizations = {
        enabled: updatedConfig.settings.organizations,
        allowUserCreate: false,
        autoCreateOnSignup: false,
        defaultMaxMembers: 5
      };
    }

    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    return NextResponse.json({ success: true, updatedConfig });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write configuration changes securely' }, { status: 500 });
  }
}