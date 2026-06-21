/**
 * Supported OAuth providers.
 */
export type OAuthProvider =
  | "github"
  | "google";

/**
 * Represents an OAuth account linked to an OpenAuth user.
 *
 * A user can link multiple OAuth providers to the same account.
 */
export interface OAuthAccount {
  /**
   * Unique OAuth account identifier.
   */
  id: string;

  /**
   * User who owns this OAuth account.
   */
  userId: string;

  /**
   * OAuth provider.
   */
  provider: OAuthProvider;

  /**
   * Unique user identifier returned by the OAuth provider.
   */
  providerUserId: string;

  /**
   * OAuth access token.
   */
  accessToken?: string;

  /**
   * OAuth refresh token.
   */
  refreshToken?: string;

  /**
   * Access token expiration time.
   */
  expiresAt?: Date;

  /**
   * Timestamp when the provider was linked.
   */
  createdAt: Date;

  /**
   * Timestamp when the provider was last updated.
   */
  updatedAt: Date;
}