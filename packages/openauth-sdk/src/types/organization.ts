export interface Organization {
  /**
   * Unique organization identifier.
   */
  id: string;

  /**
   * Organization name.
   */
  name: string;

  /**
   * User who created the organization.
   */
  creatorId: string;

  /**
   * Maximum number of allowed members.
   */
  maxMembers: number;

  /**
   * Timestamp when the organization was created.
   */
  createdAt: Date;
}

/**
 * Public representation of an organization returned by the SDK.
 */
export interface OpenAuthOrgResponse {
  /**
   * Unique organization identifier.
   */
  id: string;

  /**
   * Organization name.
   */
  name: string;

  /**
   * Current user's role inside the organization.
   */
  role?: "admin" | "member";
}