import fs from 'fs';
import path from 'path';

export interface OpenAuthConfig {
  settings: {
    sessionDuration: string;
    organizations: boolean;
    allowUserSignups: boolean;
  };
  providers: {
    github: { enabled: boolean; clientId?: string; clientSecret?: string };
    google: { enabled: boolean; clientId?: string; clientSecret?: string };
  };
}

// Fallback configuration if the developer hasn't generated their openauth.json yet
const DEFAULT_CONFIG: OpenAuthConfig = {
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

/**
 * Dynamically reads and parses the 'openauth.json' configuration matrix
 * directly from the root of the hosting Next.js application.
 */
export function getLocalConfig(): OpenAuthConfig {
  try {
    // process.cwd() resolves to the root folder of the Next.js app running our package
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