import {
  OrganizationRepository,
  OrganizationMembershipRepository,
  OAuthAccountRepository,
  SessionRepository,
  UserRepository,
} from ".";

/**
 * Defines the contract every OpenAuth database adapter must implement.
 *
 * Database adapters expose repositories that allow the SDK to
 * perform authentication and organization operations without
 * depending on a specific database or ORM.
 */
export interface OpenAuthAdapter {
  /**
   * User repository.
   */
  users: UserRepository;

  /**
   * Session repository.
   */
  sessions: SessionRepository;

  /**
   * Organization repository.
   */
  organizations: OrganizationRepository;

  /**
   * Organization membership repository.
   */
  organizationMemberships: OrganizationMembershipRepository;

  /**
   * OAuth account repository.
   */
  oauthAccounts: OAuthAccountRepository;
}