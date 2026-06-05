import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Get the root directory parsed by the npx openauth daemon CLI
const targetProjectRoot = process.env.APP_TARGET_PROJECT_ROOT || process.cwd();
const configPath = path.join(targetProjectRoot, 'openauth.json');

// GET handler to retrieve current configurations
export async function GET   () {
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

// POST handler to update the configuration file live from dashboard inputs
export async function POST(request: Request) {
  try {
    const updatedConfig = await request.json();
    
    // Write back directly into the host user's local directory file structural array
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    return NextResponse.json({ success: true, updatedConfig });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write configuration changes' }, { status: 500 });
  }
}