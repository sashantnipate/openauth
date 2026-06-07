#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const command = process.argv[2];

// ============================================================================
// MODULAR SCHEMA TEMPLATES
// ============================================================================

const USER_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

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

// ============================================================================
// REACTIVE DIRECTORY ENGINE COMPILER FUNCTION
// ============================================================================

/**
 * Re-evaluates the config file layout and automatically updates the folder
 * state on the target machine without requiring a process restart.
 */
function compileWorkspaceStructure(configPath: string, baseModelsDir: string) {
  try {
    if (!fs.existsSync(configPath)) return;
    
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const currentConfig = JSON.parse(configContent);

    // Parse the current multi-tenancy setting state
    const areOrgsEnabled = currentConfig?.settings?.organizations && typeof currentConfig.settings.organizations === 'object'
      ? !!currentConfig.settings.organizations.enabled
      : !!currentConfig?.settings?.organizations;

    const openauthFolder = path.join(baseModelsDir, 'openauth');

    // Enforce folder creation rules
    if (!fs.existsSync(openauthFolder)) {
      fs.mkdirSync(openauthFolder, { recursive: true });
    }

    // Process and populate file modules
    fs.writeFileSync(path.join(openauthFolder, 'User.ts'), USER_TEMPLATE, 'utf-8');
    
    if (areOrgsEnabled) {
      fs.writeFileSync(path.join(openauthFolder, 'Organization.ts'), ORG_TEMPLATE, 'utf-8');
      fs.writeFileSync(path.join(openauthFolder, 'Membership.ts'), MEMBERSHIP_TEMPLATE, 'utf-8');
      console.log('🔄 [openAuth Engine] Config Change Detected: Multi-Tenant schemas synchronized.');
    } else {
      // Automatic removal loop when disabled via Dashboard UI
      if (fs.existsSync(path.join(openauthFolder, 'Organization.ts'))) fs.unlinkSync(path.join(openauthFolder, 'Organization.ts'));
      if (fs.existsSync(path.join(openauthFolder, 'Membership.ts'))) fs.unlinkSync(path.join(openauthFolder, 'Membership.ts'));
      console.log('🔄 [openAuth Engine] Config Change Detected: Single-Tenant active. Cleared multi-tenant outputs.');
    }

    // Regenerate the export index file
    let indexExportContent = `export { UserModel } from './User';\n`;
    if (areOrgsEnabled) {
      indexExportContent += `export { OrgModel } from './Organization';\n`;
      indexExportContent += `export { MembershipModel } from './Membership';\n`;
    }
    fs.writeFileSync(path.join(openauthFolder, 'index.ts'), indexExportContent, 'utf-8');

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
  
  // Initialize baseline file if it does not exist yet
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

  // Resolve target directory path structure
  const hasSrcDir = fs.existsSync(path.join(projectRoot, 'src'));
  const baseModelsDir = hasSrcDir ? path.join(projectRoot, 'src', 'models') : path.join(projectRoot, 'models');
  
  if (!fs.existsSync(baseModelsDir)) {
    fs.mkdirSync(baseModelsDir, { recursive: true });
  }

  // Clean old single-file layout if present from historical runs
  const legacySingleFile = path.join(baseModelsDir, 'openauth.ts');
  if (fs.existsSync(legacySingleFile)) {
    fs.unlinkSync(legacySingleFile);
  }

  // 1. Fire baseline generation pass immediately upon startup
  compileWorkspaceStructure(configPath, baseModelsDir);

  // 2. ACTIVE SYSTEM WATCHER: This fixes your issue. It listens for saves live!
  let watchDebounceTimeout: NodeJS.Timeout | null = null;
  fs.watch(configPath, (eventType) => {
    if (eventType === 'change') {
      // Debounce events to prevent overlapping double-write triggers
      if (watchDebounceTimeout) clearTimeout(watchDebounceTimeout);
      watchDebounceTimeout = setTimeout(() => {
        compileWorkspaceStructure(configPath, baseModelsDir);
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