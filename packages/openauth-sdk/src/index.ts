import { getLocalConfig, OpenAuthConfig } from './backend/config';

export { getLocalConfig };
export type { OpenAuthConfig };

/**
 * High-performance route guard matrix validator to be run inside Next.js Middleware/Server targets
 */
export function validateAccessContext(): { allowed: boolean; reason?: string } {
  const config = getLocalConfig();
  
  if (!config.settings.allowUserSignups) {
    // Implement internal operational system logic using the variables defined in the local file
    return { allowed: false, reason: "Registration window is locked by local configuration parameters." };
  }
  
  return { allowed: true };
}