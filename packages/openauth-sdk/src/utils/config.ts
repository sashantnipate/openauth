import mongoose from 'mongoose';
import { OpenAuthConfigMatrix } from '../types/config';

export async function getLiveDatabaseConfig(): Promise<OpenAuthConfigMatrix> {
  // Safe lookup strategy guarding against HMR compilation states
  const AuthSettings = mongoose.models.AuthSettings || 
    mongoose.model('AuthSettings', new mongoose.Schema({}, { strict: false }));
    
  const config = await AuthSettings.findOne().lean();
  
  return (config as OpenAuthConfigMatrix) || {
    settings: {
      sessionDuration: "1d",
      organizations: { enabled: false, allowUserCreate: false, autoCreateOnSignup: false, defaultMaxMembers: 5 },
      allowUserSignups: true
    },
    providers: { github: { enabled: false }, google: { enabled: false } }
  };
}