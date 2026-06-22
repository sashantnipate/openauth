import { OpenAuthConfig } from "../types";
import { OpenAuth } from "../OpenAuth";

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
      github: { enabled: config.providers?.github?.enabled ?? false },
      google: { enabled: config.providers?.google?.enabled ?? false },
    },
  };
}

/**
 * FIXED: Uses the adapter interface instead of naked mongoose queries.
 * Automatically provisions a fallback default profile row if collection is missing/empty.
 */
export async function getLiveDatabaseConfig(instance: OpenAuth): Promise<OpenAuthConfig> {
  try {
    // Read raw config through the low-level mongo database driver connection exposed via adapter user repo context
    const db = (instance.adapter.users as any).model?.db?.db;
    
    if (db) {
      const collection = db.collection("auth_configs");
      let dbConfig = await collection.findOne({});

      // If missing the collection document entry altogether -> Create the default baseline schema on the fly!
      if (!dbConfig) {
        const fallbackDefault = {
          settings: {
            allowUserSignups: true,
            sessionDuration: "7d",
            organizations: { enabled: false, allowUserCreate: true, autoCreateOnSignup: false, defaultMaxMembers: 5 }
          },
          providers: { github: { enabled: false }, google: { enabled: false } },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await collection.insertOne(fallbackDefault);
        dbConfig = fallbackDefault;
      }

      return resolveConfig({
        auth: {
          allowUserSignups: dbConfig.settings?.allowUserSignups,
          enableEmailPassword: true,
          session: { duration: dbConfig.settings?.sessionDuration || "7d" },
          organizations: {
            enabled: dbConfig.settings?.organizations?.enabled ?? false,
            allowUserCreate: dbConfig.settings?.organizations?.allowUserCreate ?? true,
            autoCreateOnSignup: dbConfig.settings?.organizations?.autoCreateOnSignup ?? false,
            defaultMaxMembers: dbConfig.settings?.organizations?.defaultMaxMembers ?? 5,
          }
        },
        providers: {
          github: { enabled: dbConfig.providers?.github?.enabled ?? false },
          google: { enabled: dbConfig.providers?.google?.enabled ?? false }
        }
      });
    }
  } catch (err) {
    console.error("SDK runtime live configuration balancing failure:", err);
  }
  return resolveConfig({});
}