#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'process';

// Dynamic Template Modules Imports
import { USER_TEMPLATE, ORG_TEMPLATE, MEMBERSHIP_TEMPLATE, BARREL_TEMPLATE } from '../templates/database-templates';
import { API_CATCHALL_TEMPLATE, AUTH_FORM_TEMPLATE, SIGN_IN_PAGE_TEMPLATE, SIGN_UP_PAGE_TEMPLATE } from '../templates/auth-templates';
import { DB_TEMPLATE } from '../templates/database-templates';
const command = process.argv[2];

// ============================================================================
// AUXILIARY WORKSPACE BUILD HELPERS
// ============================================================================

function ensureBaseConfigFile(configPath: string) {
  if (!fs.existsSync(configPath)) {
    const defaultSettings = {
      settings: { allowUserSignups: false, organizations: { enabled: false } }
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
  }
}

function registerNpmScript(projectRoot: string) {
  const hostPackageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(hostPackageJsonPath)) return;

  const packageJson = JSON.parse(fs.readFileSync(hostPackageJsonPath, 'utf-8'));
  packageJson.scripts = packageJson.scripts || {};

  if (!packageJson.scripts.openauth) {
    packageJson.scripts.openauth = "openauth dev";
    fs.writeFileSync(hostPackageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  }
}

// ============================================================================
// CENTRAL GENERATION ENGINE
// ============================================================================

function compileWorkspaceStructure() {
  try {
    const projectRoot = process.env.APP_TARGET_PROJECT_ROOT || process.env.INIT_CWD || process.cwd();
    const configPath = path.join(projectRoot, 'openauth.json');
    const hasSrcDir = fs.existsSync(path.join(projectRoot, 'src'));

    ensureBaseConfigFile(configPath);

    const paths = {
      db: hasSrcDir ? path.join(projectRoot, 'src', 'lib') : path.join(projectRoot, 'lib'),
      models: hasSrcDir ? path.join(projectRoot, 'src', 'models', 'openauth') : path.join(projectRoot, 'models', 'openauth'),
      api: hasSrcDir ? path.join(projectRoot, 'src', 'app', 'api', 'auth', '[...openauth]') : path.join(projectRoot, 'app', 'api', 'auth', '[...openauth]'),
      components: hasSrcDir ? path.join(projectRoot, 'src', 'components', 'openauth') : path.join(projectRoot, 'components', 'openauth'),
      signIn: hasSrcDir ? path.join(projectRoot, 'src', 'app', '(auth)', 'sign-in') : path.join(projectRoot, 'app', '(auth)', 'sign-in'),
      signUp: hasSrcDir ? path.join(projectRoot, 'src', 'app', '(auth)', 'sign-up') : path.join(projectRoot, 'app', '(auth)', 'sign-up'),
    };

    const structuralFileMap = [
      { dir: paths.db, file: 'db.ts', content: DB_TEMPLATE },
      { dir: paths.models, file: 'User.ts', content: USER_TEMPLATE },
      { dir: paths.models, file: 'Organization.ts', content: ORG_TEMPLATE },
      { dir: paths.models, file: 'Membership.ts', content: MEMBERSHIP_TEMPLATE },
      { dir: paths.models, file: 'index.ts', content: BARREL_TEMPLATE },
      { dir: paths.api, file: 'route.ts', content: API_CATCHALL_TEMPLATE },
      { dir: paths.components, file: 'auth-form.tsx', content: AUTH_FORM_TEMPLATE },
      { dir: paths.signIn, file: 'page.tsx', content: SIGN_IN_PAGE_TEMPLATE },
      { dir: paths.signUp, file: 'page.tsx', content: SIGN_UP_PAGE_TEMPLATE },
    ];

    for (const item of structuralFileMap) {
      if (!fs.existsSync(item.dir)) {
        fs.mkdirSync(item.dir, { recursive: true });
      }
      fs.writeFileSync(path.join(item.dir, item.file), item.content, 'utf-8');
    }

    registerNpmScript(projectRoot);
    console.log('Original structural system mappings refreshed successfully.');
  } catch (error) {
    console.error('Core workspace generator faulted:', error);
  }
}

async function setupEnvironmentVariables(projectRoot: string) {
  const envPath = path.join(projectRoot, '.env');
  
  if (fs.existsSync(envPath)) {
    const currentEnv = fs.readFileSync(envPath, 'utf-8');
    if (/^MONGODB_URI=.+/m.test(currentEnv)) return;
  }

  const rl = readline.createInterface({ input, output });
  
  try {
    console.log('\n🔌 [openAuth Configuration] Setting up database layers...');
    const rawInput = await rl.question('Enter MongoDB Connection URI (Leave blank to configure later): ');
    const databaseUrl = rawInput.trim();

    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    
    if (!/^OPENAUTH_SECRET=/m.test(envContent)) {
      const randomSecret = crypto.randomBytes(32).toString('hex');
      envContent += `\nOPENAUTH_SECRET=${randomSecret}`;
    }

    if (/^MONGODB_URI=/m.test(envContent)) {
      envContent = envContent.replace(/^MONGODB_URI=.*$/m, `MONGODB_URI=${databaseUrl}`);
    } else {
      envContent = envContent.trim() + `\nMONGODB_URI=${databaseUrl}\n`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
    console.log(`✅ Environment file operationalized at root path.`);
  } catch (err) {
    console.error('⚠️ Encountered a fault establishing environment config file:', err);
  } finally {
    rl.close();
  }
}

// ============================================================================
// RUNTIME LIFECYCLE BRANCHES
// ============================================================================

async function runCliPipeline() {
  const projectRoot = process.env.APP_TARGET_PROJECT_ROOT || process.env.INIT_CWD || process.cwd();
  const configPath = path.join(projectRoot, 'openauth.json');

  if (command === 'init') {
    await setupEnvironmentVariables(projectRoot);
    compileWorkspaceStructure();
    
  } else if (command === 'dev') {
    await setupEnvironmentVariables(projectRoot);
    compileWorkspaceStructure();

    let watchDebounceTimeout: NodeJS.Timeout | null = null;
    
    fs.watch(configPath, (eventType: string) => {
      if (eventType === 'change') {
        if (watchDebounceTimeout) clearTimeout(watchDebounceTimeout);
        watchDebounceTimeout = setTimeout(() => {
          compileWorkspaceStructure();
        }, 100);
      }
    });

    const monorepoDashboardPath = path.join(path.resolve(projectRoot, '..'), 'packages', 'openauth-dashboard');
    const embeddedDashboardPath = path.join(__dirname, '..', 'dashboard');
    const dashboardPath = fs.existsSync(monorepoDashboardPath) ? monorepoDashboardPath : embeddedDashboardPath;

    if (!fs.existsSync(dashboardPath)) {
      process.exit(1);
    }

    // --- FIX: Read and parse .env into an environment map injection block ---
    const localEnvPath = path.join(projectRoot, '.env');
    const runtimeEnvPushed: Record<string, string> = {};
    
    if (fs.existsSync(localEnvPath)) {
      const lines = fs.readFileSync(localEnvPath, 'utf-8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          // Strip out outer string wrappers safely if wrapped
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          runtimeEnvPushed[key] = val;
        }
      }
    }

    const nextProcess = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '-p', '4000'], {
      cwd: dashboardPath,
      stdio: 'inherit',
      shell: true, 
      // Proxy all parsed context keys directly into the child workspace engine
      env: { ...process.env, ...runtimeEnvPushed, APP_TARGET_PROJECT_ROOT: projectRoot }
    });

    nextProcess.on('close', (code) => process.exit(code || 0));
  }
}

runCliPipeline();