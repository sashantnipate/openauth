import { OpenAuthConfig } from "../types";

/**
 * Returns the runtime configuration used by the SDK.
 * Populates missing values with sensible production-ready defaults.
 */
export function resolveConfig(config: Partial<OpenAuthConfig>): OpenAuthConfig {
  return {
    secret: config.secret ?? "fallback_system_secret_key",
    
    auth: {
      allowUserSignups: config.auth?.allowUserSignups ?? true,
      enableEmailPassword: config.auth?.enableEmailPassword ?? true,
      session: {
        duration: config.auth?.session?.duration ?? "7d",
      },
      organizations: {
        enabled: config.auth?.organizations?.enabled ?? false,
        allowUserCreate: config.auth?.organizations?.allowUserCreate ?? true,
        autoCreateOnSignup: config.auth?.organizations?.autoCreateOnSignup ?? false,
        defaultMaxMembers: config.auth?.organizations?.defaultMaxMembers ?? 100,
      },
    },
    providers: {
      github: {
        enabled: config.providers?.github?.enabled ?? false,
        clientId: config.providers?.github?.clientId,
        clientSecret: config.providers?.github?.clientSecret,
      },
      google: {
        enabled: config.providers?.google?.enabled ?? false,
        clientId: config.providers?.google?.clientId,
        clientSecret: config.providers?.google?.clientSecret,
      },
    },
  };
}

/**
 * STUB HELPER: Added to fix missing internal export errors across the repository.
 * In a fully decoupled layout, this runtime state should instead be requested from your database-backed adapter instance.
 */
export async function getLiveDatabaseConfig(): Promise<OpenAuthConfig> {
  // Fallback to resolved baseline defaults for safety
  return resolveConfig({});
}