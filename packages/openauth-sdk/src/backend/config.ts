import fs from 'fs';
import path from 'path';

export interface OpenAuthConfig {
  settings: {
    sessionDuration: string;
    organizations: {
      enabled: boolean;
      allowUserCreate?: boolean;
      autoCreateOnSignup?: boolean;
      defaultMaxMembers?: number;
    };
    allowUserSignups: boolean;
  };
  providers: {
    github: { enabled: boolean; clientId?: string; clientSecret?: string };
    google: { enabled: boolean; clientId?: string; clientSecret?: string };
  };
}

// Default fallback configuration if the developer hasn't generated their openauth.json yet
const DEFAULT_CONFIG: OpenAuthConfig = {
  settings: {
    sessionDuration: "1d",
    organizations: {
      enabled: false,
      allowUserCreate: false,
      autoCreateOnSignup: false,
      defaultMaxMembers: 5
    },
    allowUserSignups: true
  },
  providers: {
    github: { enabled: false, clientId: "", clientSecret: "" },
    google: { enabled: false, clientId: "", clientSecret: "" }
  }
};

/**
 * Dynamically reads and parses the 'openauth.json' configuration matrix
 */
export function getLocalConfig(): OpenAuthConfig {
  try {
    const configPath = path.join(process.cwd(), 'openauth.json');
    
    if (!fs.existsSync(configPath)) {
      return DEFAULT_CONFIG;
    }

    const fileContents = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(fileContents) as OpenAuthConfig;
  } catch (error) {
    console.warn('⚠️ openAuth: Failed to parse openauth.json. Falling back to default system layout safely.');
    return DEFAULT_CONFIG;
  }
}