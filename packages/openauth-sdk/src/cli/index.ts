#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const command = process.argv[2];

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

  // 2. Safe Dashboard Path Resolution
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