
/**
 * ============================================================================
 * OpenAuth Configuration Types
 * ============================================================================
 * These types describe how the authentication engine is configured.
 * They are completely independent of any database or framework.
 * ============================================================================
 */

export interface SessionConfig {
  /**
   * Session lifetime.
   * Examples:
   * "1h"
   * "1d"
   * "7d"
   * "30d"
   */
  duration: string;
}

export interface OrganizationConfig {
  enabled: boolean;
  allowUserCreate: boolean;
  autoCreateOnSignup: boolean;
  defaultMaxMembers: number;
}

export interface OAuthProviderConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
}

export interface OpenAuthConfig {
  session: SessionConfig;

  organizations: OrganizationConfig;

  providers: {
    github: OAuthProviderConfig;
    google: OAuthProviderConfig;
  };
}