import { OpenAuthConfig } from "../types";

/**
 * Returns the runtime configuration used by the SDK.
 *
 * Missing values are populated with sensible defaults.
 */
export function resolveConfig(
  config: Partial<OpenAuthConfig>
): OpenAuthConfig {
  return {
    auth: {
      allowUserSignups: config.auth?.allowUserSignups ?? true,

      enableEmailPassword:
        config.auth?.enableEmailPassword ?? true,

      session: {
        duration:
          config.auth?.session?.duration ?? "7d",
      },

      organizations: {
        enabled:
          config.auth?.organizations?.enabled ?? false,

        allowUserCreate:
          config.auth?.organizations?.allowUserCreate ??
          true,

        autoCreateOnSignup:
          config.auth?.organizations
            ?.autoCreateOnSignup ?? false,

        defaultMaxMembers:
          config.auth?.organizations
            ?.defaultMaxMembers ?? 100,
      },
    },

    providers: {
      github: {
        enabled:
          config.providers?.github?.enabled ?? false,

        clientId:
          config.providers?.github?.clientId,

        clientSecret:
          config.providers?.github?.clientSecret,
      },

      google: {
        enabled:
          config.providers?.google?.enabled ?? false,

        clientId:
          config.providers?.google?.clientId,

        clientSecret:
          config.providers?.google?.clientSecret,
      },
    },
  };
}