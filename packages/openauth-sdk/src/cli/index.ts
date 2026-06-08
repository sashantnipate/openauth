#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const command = process.argv[2];

// ============================================================================
// MODULAR SCHEMA & ROUTE TEMPLATES
// ============================================================================

// Future Dev Note: We added 'canCreateOrganizations' directly to the user template 
// to decouple database permissions from local JSON structural configuration blocks.
const USER_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash?: string;
  providers: { githubId?: string; googleId?: string };
  canCreateOrganizations: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: false },
  providers: {
    githubId: { type: String, required: false, sparse: true },
    googleId: { type: String, required: false, sparse: true }
  },
  canCreateOrganizations: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
`;

const ORG_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

export interface IOrg extends Document {
  name: string;
  creatorId: mongoose.Types.ObjectId;
  maxMembers: number;
  createdAt: Date;
}

const OrgSchema = new Schema<IOrg>({
  name: { type: String, required: true },
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  maxMembers: { type: Number, default: 5 }, 
  createdAt: { type: Date, default: Date.now },
});

export const OrgModel = mongoose.models.Organization || mongoose.model<IOrg>('Organization', OrgSchema);
`;

const MEMBERSHIP_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

export interface IMembership extends Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

const MembershipSchema = new Schema<IMembership>({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});

MembershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1 });

export const MembershipModel = mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);
`;

// AUTOMATIC ROUTE SCAFFOLDER: Dropping this catch-all script allows the developer
// to get up and running without manually copying endpoints.
const API_CATCHALL_TEMPLATE = `import { NextRequest, NextResponse } from 'next/server';
import { OpenAuthEngine } from '@openauth/nextjs';
import { UserModel, OrgModel, MembershipModel } from '@/models/openauth';

const engine = new OpenAuthEngine({ UserModel, OrgModel, MembershipModel });

export async function POST(request: NextRequest, context: any) {
  // Gracefully handles parameters across varying versions of Next.js dynamic routing signatures
  const params = await context.params;
  const action = params.openauth?.[0];
  const body = await request.json();

  try {
    if (action === 'signup') {
      const payload = await engine.signup(body);
      return NextResponse.json(payload);
    }
    
    if (action === 'create-org') {
      const { userId, orgName } = body;
      const newOrg = await engine.createOrganization(userId, orgName);
      return NextResponse.json({ success: true, organization: newOrg });
    }

    return NextResponse.json({ error: \`Action '\${action}' path not found.\` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Engine execution transaction fault.' }, { status: 400 });
  }
}
`;

// ============================================================================
// REACTIVE DIRECTORY ENGINE COMPILER FUNCTION
// ============================================================================

function compileWorkspaceStructure(configPath: string, baseModelsDir: string, projectRoot: string) {
  try {
    if (!fs.existsSync(configPath)) return;
    
    const openauthFolder = path.join(baseModelsDir, 'openauth');

    if (!fs.existsSync(openauthFolder)) {
      fs.mkdirSync(openauthFolder, { recursive: true });
    }

    // BEST PRACTICE REVISION: We always write all database files out to disk permanently.
    // Toggling multi-tenancy should NOT remove files; otherwise, static imports like
    // "import { OrgModel } from '@/models/openauth'" will crash the developer's compilers.
    fs.writeFileSync(path.join(openauthFolder, 'User.ts'), USER_TEMPLATE, 'utf-8');
    fs.writeFileSync(path.join(openauthFolder, 'Organization.ts'), ORG_TEMPLATE, 'utf-8');
    fs.writeFileSync(path.join(openauthFolder, 'Membership.ts'), MEMBERSHIP_TEMPLATE, 'utf-8');

    // Keep exports constant to maintain robust, break-proof workspace import layouts
    const indexExportContent = 
      `export { UserModel } from './User';\n` +
      `export { OrgModel } from './Organization';\n` +
      `export { MembershipModel } from './Membership';\n`;
    
    fs.writeFileSync(path.join(openauthFolder, 'index.ts'), indexExportContent, 'utf-8');
    console.log('🔄 [openAuth Engine] Database templates synchronized successfully.');

    // ========================================================================
    // NEXT.JS API ENDPOINT AUTO-GEN STEP
    // ========================================================================
    const hasSrcDir = fs.existsSync(path.join(projectRoot, 'src'));
    const apiRouteFolder = hasSrcDir
      ? path.join(projectRoot, 'src', 'app', 'api', 'auth', '[...openauth]')
      : path.join(projectRoot, 'app', 'api', 'auth', '[...openauth]');

    if (!fs.existsSync(apiRouteFolder)) {
      fs.mkdirSync(apiRouteFolder, { recursive: true });
    }

    const targetRouteFile = path.join(apiRouteFolder, 'route.ts');
    if (!fs.existsSync(targetRouteFile)) {
      fs.writeFileSync(targetRouteFile, API_CATCHALL_TEMPLATE, 'utf-8');
      console.log('✨ [openAuth Engine] Automatically scaffolded Next.js unified catch-all router endpoint.');
    }

  } catch (error) {
    console.error('⚠️ [openAuth Engine] Failed to compile structural updates reactively:', error);
  }
}

// ============================================================================
// CORE DEV EXECUTION ROUTINE
// ============================================================================

if (command === 'dev') {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, 'openauth.json');
  
  if (!fs.existsSync(configPath)) {
    const baselineConfig = {
      settings: {
        sessionDuration: "1d",
        organizations: { enabled: false, allowUserCreate: false, autoCreateOnSignup: false, defaultMaxMembers: 5 },
        allowUserSignups: true
      },
      providers: {
        github: { enabled: false, clientId: "", clientSecret: "" },
        google: { enabled: false, clientId: "", clientSecret: "" }
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(baselineConfig, null, 2), 'utf-8');
    console.log('✨ Created baseline openauth.json configuration matrix.');
  }

  const hasSrcDir = fs.existsSync(path.join(projectRoot, 'src'));
  const baseModelsDir = hasSrcDir ? path.join(projectRoot, 'src', 'models') : path.join(projectRoot, 'models');
  
  if (!fs.existsSync(baseModelsDir)) {
    fs.mkdirSync(baseModelsDir, { recursive: true });
  }

  const legacySingleFile = path.join(baseModelsDir, 'openauth.ts');
  if (fs.existsSync(legacySingleFile)) {
    fs.unlinkSync(legacySingleFile);
  }

  // 1. Fire initialization routine mapping out structures directly onto the hard drive
  compileWorkspaceStructure(configPath, baseModelsDir, projectRoot);

  // 2. Active hot-reload listener capturing dashboard adjustments live
  let watchDebounceTimeout: NodeJS.Timeout | null = null;
  fs.watch(configPath, (eventType) => {
    if (eventType === 'change') {
      if (watchDebounceTimeout) clearTimeout(watchDebounceTimeout);
      watchDebounceTimeout = setTimeout(() => {
        compileWorkspaceStructure(configPath, baseModelsDir, projectRoot);
      }, 100);
    }
  });

  // 3. Resolve and launch companion dashboard code
  const monorepoDashboardPath = path.join(path.resolve(projectRoot, '..'), 'packages', 'openauth-dashboard');
  const embeddedDashboardPath = path.join(__dirname, '..', 'dashboard');
  const dashboardPath = fs.existsSync(monorepoDashboardPath) ? monorepoDashboardPath : embeddedDashboardPath;

  if (!fs.existsSync(dashboardPath)) {
    console.error(`❌ Error: Could not locate companion UI dashboard assets.`);
    process.exit(1);
  }

  console.log('🚀 Launching openAuth Local Dashboard Engine on http://localhost:4000...');
  
  const isWindows = process.platform === 'win32';
  const npmCommand = isWindows ? 'npm.cmd' : 'npm';

  const nextProcess = spawn(npmCommand, ['run', 'dev', '--', '-p', '4000'], {
    cwd: dashboardPath,
    stdio: 'inherit',
    shell: true, 
    env: { ...process.env, APP_TARGET_PROJECT_ROOT: projectRoot }
  });

  nextProcess.on('close', (code) => process.exit(code || 0));
} else {
  console.log('Unknown execution command. Please use: npx openauth dev');
}