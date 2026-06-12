import { OpenAuthConfig } from './types';
import mongoose from 'mongoose';

export const DEFAULT_CONFIG: OpenAuthConfig = {
  settings: {
    sessionDuration: "1d",
    organizations: { enabled: false, allowUserCreate: false, autoCreateOnSignup: false, defaultMaxMembers: 5 },
    allowUserSignups: true
  },
  providers: { github: { enabled: false }, google: { enabled: false } }
};

export async function getLiveDatabaseConfig(): Promise<OpenAuthConfig> {
  try {
    const AuthSettings = mongoose.models.AuthSettings || mongoose.model('AuthSettings', new mongoose.Schema({}, { strict: false }));
    const config = await AuthSettings.findOne().lean();
    return (config as OpenAuthConfig) || DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}