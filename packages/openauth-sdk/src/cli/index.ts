#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { promptUserSetup } from './prompts';
import { registry } from './registry';
import { NextjsGenerator } from './generators/nextjs';
import { MongodbGenerator } from './generators/mongodb';

// 1. Core Generator Registration Matrix Hook-ins
registry.registerFramework(new NextjsGenerator());
registry.registerDatabase(new MongodbGenerator());

async function runCliPipeline() {
  const [,, command] = process.argv;

  if (command !== 'init') {
    console.log('\n⚠️ Usage Error: Please initialize this framework using: npx openauth init\n');
    process.exit(1);
  }

  try {
    // 2. Fire interactive config prompts wizard
    const options = await promptUserSetup();
    const projectRoot = process.cwd();
    const context = { projectRoot, options };

    console.log('\n🏗️ Bootstrapping custom authentication infrastructure profiles...\n');

    // 3. Save options state metadata to openauth.json project file
    fs.writeFileSync(
      path.join(projectRoot, 'openauth.json'),
      JSON.stringify(options, null, 2),
      'utf-8'
    );
    console.log('📝 Initialized project setup metadata record at openauth.json');

    // 4. Resolve choices cleanly from the registry layer and generate codebase
    const dbGen = registry.getDatabase(options.database);
    const frameworkGen = registry.getFramework(options.framework);

    await dbGen.generate(context);
    await frameworkGen.generate(context);

    // 5. Generate dynamically allocated isolated environment variables line blocks
    let envLines = `\n# --- OpenAuth Auto-Generated Configurations ---\nOPENAUTH_SECRET=${Math.random().toString(36).substring(2, 15)}`;

    if (options.database === 'mongodb') {
      envLines += '\nMONGODB_URI="mongodb://localhost:27017/openauth_db"';
    }

    if (options.providers.includes('google')) {
      envLines += '\nGOOGLE_CLIENT_ID=""\nGOOGLE_CLIENT_SECRET=""';
    }
    if (options.providers.includes('github')) {
      envLines += '\nGITHUB_CLIENT_ID=""\nGITHUB_CLIENT_SECRET=""';
    }

    const envFilePath = path.join(projectRoot, '.env');
    fs.existsSync(envFilePath)
      ? fs.appendFileSync(envFilePath, `\n${envLines}`, 'utf-8')
      : fs.writeFileSync(envFilePath, envLines.trim(), 'utf-8');

    console.log('📝 Environmental parameter flags appended cleanly to local .env configuration file.');
    console.log('\n🎉 System initialization setup processed completely without faults!\n');

  } catch (error: any) {
    console.error('❌ Critical project template generation setup failed:', error.message);
    process.exit(1);
  }
}

runCliPipeline();