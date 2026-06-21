import { Session } from "../types";

/**
 * Defines the operations required to manage user sessions.
 */
export interface SessionRepository {
  /**
   * Creates a new session.
   */
  create(data: Omit<Session, "id">): Promise<Session>;

  /**
   * Finds a session by its unique identifier.
   */
  findById(id: string): Promise<Session | null>;

  /**
   * Finds a session by its token.
   */
  findByToken(token: string): Promise<Session | null>;

  /**
   * Returns all active sessions for a user.
   */
  findByUserId(userId: string): Promise<Session[]>;

  /**
   * Updates an existing session.
   */
  update(
    id: string,
    data: Partial<Omit<Session, "id">>
  ): Promise<Session>;

  /**
   * Deletes a session.
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes every session belonging to a user.
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Deletes all expired sessions.
   */
  deleteExpired(): Promise<void>;
}