/**
 * Configuration for session management.
 */
export interface SessionConfig {
  /**
   * Session lifetime.
   *
   * Examples:
   * - "1h"
   * - "1d"
   * - "7d"
   * - "30d"
   */
  duration: string;
}

/**
 * Configuration for organization features.
 */
export interface OrganizationConfig {
  /**
   * Enables organization support.
   */
  enabled: boolean;

  /**
   * Allows users to create organizations.
   */
  allowUserCreate: boolean;

  /**
   * Automatically creates an organization when a user signs up.
   */
  autoCreateOnSignup: boolean;

  /**
   * Default member limit for newly created organizations.
   */
  defaultMaxMembers: number;
}

/**
 * Configuration for an OAuth provider.
 */
export interface OAuthProviderConfig {
  /**
   * Enables the provider.
   */
  enabled: boolean;

  /**
   * OAuth client identifier.
   */
  clientId?: string;

  /**
   * OAuth client secret.
   */
  clientSecret?: string;
}

/**
 * Global authentication settings.
 */
export interface AuthenticationConfig {
  /**
   * Allows new users to register.
   */
  allowUserSignups: boolean;

  /**
   * Enables email and password authentication.
   */
  enableEmailPassword: boolean;

  /**
   * Enables session management.
   */
  session: SessionConfig;

  /**
   * Organization configuration.
   */
  organizations: OrganizationConfig;
}

/**
 * Root configuration for the OpenAuth SDK.
 */
export interface OpenAuthConfig {
  /**
   * Core authentication settings.
   */
  auth: AuthenticationConfig;

  /**
   * OAuth providers.
   */
  providers: {
    github: OAuthProviderConfig;
    google: OAuthProviderConfig;
  };
}