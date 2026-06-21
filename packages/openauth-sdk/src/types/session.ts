/**
 * Represents an authenticated session.
 *
 * A session is created after a successful authentication and
 * remains valid until it expires or is revoked.
 */
export interface Session {
  /**
   * Unique session identifier.
   */
  id: string;

  /**
   * User who owns this session.
   */
  userId: string;

  /**
   * Session token.
   */
  token: string;

  /**
   * Indicates whether the session is currently active.
   */
  active: boolean;

  /**
   * IP address from which the session was created.
   */
  ipAddress?: string;

  /**
   * User agent of the client that created the session.
   */
  userAgent?: string;

  /**
   * Session expiration timestamp.
   */
  expiresAt: Date;

  /**
   * Timestamp of the user's last activity.
   */
  lastActiveAt: Date;

  /**
   * Timestamp when the session was created.
   */
  createdAt: Date;
}