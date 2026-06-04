#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const command = process.argv[2];

if (command === 'dev') {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, 'openauth.json');

  // Generate openauth.json template automatically if missing
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

  console.log('🚀 Launching openAuth Local Dashboard Engine on http://localhost:4000...');


  const dashboardPath = path.join(__dirname, '../../../../openauth-dashboard');

  const nextProcess = spawn('npm', ['run', 'dev', '--', '-p', '4000'], {
    cwd: dashboardPath,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      // Pass down the current working directory path context so the 
      // Next.js API routes know exactly where to read/write the configuration file
      APP_TARGET_PROJECT_ROOT: projectRoot
    }
  });

  nextProcess.on('close', (code) => {
    process.exit(code || 0);
  });
} else {
  console.log('Unknown command. Please use: npx openauth dev');
}