import { OAuthAccount, OAuthProvider } from "../types";

/**
 * Defines the operations required to manage linked OAuth accounts.
 */
export interface OAuthAccountRepository {
  /**
   * Links an OAuth account to a user.
   */
  create(
    data: Omit<OAuthAccount, "id">
  ): Promise<OAuthAccount>;

  /**
   * Finds an OAuth account by its unique identifier.
   */
  findById(id: string): Promise<OAuthAccount | null>;

  /**
   * Finds an OAuth account using the provider's user identifier.
   */
  findByProvider(
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<OAuthAccount | null>;

  /**
   * Returns every OAuth account linked to a user.
   */
  findByUserId(userId: string): Promise<OAuthAccount[]>;

  /**
   * Updates an existing OAuth account.
   */
  update(
    id: string,
    data: Partial<Omit<OAuthAccount, "id">>
  ): Promise<OAuthAccount>;

  /**
   * Removes a linked OAuth account.
   */
  delete(id: string): Promise<void>;
}