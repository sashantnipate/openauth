#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const command = process.argv[2];

// The new infinite-scale 3-model template dropped directly into the developer's project folder
const MODEL_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

// 1. USER MODEL
export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash?: string;
  providers: { githubId?: string; googleId?: string };
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
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);


// 2. ORGANIZATION MODEL
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


// 3. MEMBERSHIP MODEL (Junction Collection)
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

// Crucial indexing layers to enforce safety rules and maintain high-performance lookups
MembershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1 });

export const MembershipModel = mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);
`;

if (command === 'dev') {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, 'openauth.json');

  // 1. Generate openauth.json template automatically if missing
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      settings: {
        sessionDuration: "1d",
        organizations: false,
        allowUserSignups: true
      },
      providers: {
        github: { enabled: false, clientId: "", clientSecret: "" },
        google: { enabled: false, clientId: "", clientSecret: "" }
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    console.log('✨ Created baseline openauth.json configuration matrix.');
  }

  // Build or verify the models file layout inside the user's host space
  const hasSrcDir = fs.existsSync(path.join(projectRoot, 'src'));
  const targetModelsDir = hasSrcDir 
    ? path.join(projectRoot, 'src', 'models') 
    : path.join(projectRoot, 'models');
  
  const targetModelsFile = path.join(targetModelsDir, 'openauth.ts');

  if (!fs.existsSync(targetModelsFile)) {
    fs.mkdirSync(targetModelsDir, { recursive: true });
    fs.writeFileSync(targetModelsFile, MODEL_TEMPLATE, 'utf-8');
    console.log(`Auto-generated infinite-scale DB schemas at: ${hasSrcDir ? 'src/models/openauth.ts' : 'models/openauth.ts'}`);
  }

  // Safe Dashboard Path Resolution
  const monorepoRoot = path.resolve(projectRoot, '..'); 
  const dashboardPath = path.join(monorepoRoot, 'packages', 'openauth-dashboard');

  if (!fs.existsSync(dashboardPath)) {
    console.error(`❌ Error: Could not locate the dashboard repository directory at: ${dashboardPath}`);
    process.exit(1);
  }

  console.log('🚀 Launching openAuth Local Dashboard Engine on http://localhost:4000...');

  // 3. The Cross-Platform Fix
  const isWindows = process.platform === 'win32';
  
  // Windows requires 'npm.cmd' WITH 'shell: true' to prevent EINVAL or ENOENT errors
  const npmCommand = isWindows ? 'npm.cmd' : 'npm';

  const nextProcess = spawn(npmCommand, ['run', 'dev', '--', '-p', '4000'], {
    cwd: dashboardPath,
    stdio: 'inherit',
    shell: true, // Forces Windows to correctly parse the .cmd extension execution context
    env: {
      ...process.env,
      APP_TARGET_PROJECT_ROOT: projectRoot
    }
  });

  nextProcess.on('error', (err) => {
    console.error('❌ Failed to start the dashboard process:', err);
  });

  nextProcess.on('close', (code) => {
    process.exit(code || 0);
  });
} else {
  console.log('Unknown command. Please use: npx openauth dev');
}