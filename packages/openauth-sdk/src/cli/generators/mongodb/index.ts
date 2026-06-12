import fs from 'fs';
import path from 'path';
import { DatabaseGenerator, GeneratorContext } from '../types';

export class MongodbGenerator implements DatabaseGenerator {
  id = 'mongodb';
  name = 'MongoDB Mongoose Document Store Integration';

  async generate(ctx: GeneratorContext): Promise<void> {
    const modelsDir = path.join(ctx.projectRoot, 'src', 'models', 'openauth');
    fs.mkdirSync(modelsDir, { recursive: true });

    let schemaProperties = `
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },`;

    if (ctx.options.providers.includes('email')) {
      schemaProperties += `\n  passwordHash: { type: String, required: false },`;
    }
    if (ctx.options.providers.includes('github')) {
      schemaProperties += `\n  githubId: { type: String, required: false, sparse: true },`;
    }

    const userModelFileContent = `import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({${schemaProperties}
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);`;

    fs.writeFileSync(path.join(modelsDir, 'User.ts'), userModelFileContent, 'utf-8');
    console.log('✅ Coordinated Mongoose identity documents data layer configurations.');
  }
}