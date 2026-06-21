/**
 * Represents a user's membership within an organization.
 *
 * Each record links a single user to a single organization
 * and defines the user's role within that organization.
 */
export interface OrganizationMembership {
  /**
   * Unique membership identifier.
   */
  id: string;

  /**
   * Organization this membership belongs to.
   */
  organizationId: string;

  /**
   * User associated with this membership.
   */
  userId: string;

  /**
   * Role assigned to the user within the organization.
   */
  role: "owner" | "admin" | "member";

  /**
   * Timestamp when the user joined the organization.
   */
  joinedAt: Date;
}