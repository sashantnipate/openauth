/**
 * Configuration for session management.
 */
export interface SessionConfig {
  /**
   * Session lifetime.
   * Examples: "1h", "1d", "7d", "30d"
   */
  duration: string;
}

/**
 * Configuration for organization features.
 */
export interface OrganizationConfig {
  enabled: boolean;
  allowUserCreate: boolean;
  autoCreateOnSignup: boolean;
  defaultMaxMembers: number;
}

/**
 * Configuration for an OAuth provider.
 */
export interface OAuthProviderConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Global authentication settings.
 */
export interface AuthenticationConfig {
  allowUserSignups: boolean;
  enableEmailPassword: boolean;
  session: SessionConfig;
  organizations: OrganizationConfig;
}

/**
 * Root configuration for the OpenAuth SDK.
 */
export interface OpenAuthConfig {
  secret: string,
  auth: AuthenticationConfig;
  providers: {
    github: OAuthProviderConfig;
    google: OAuthProviderConfig;
  };
}