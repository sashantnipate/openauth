/**
 * Represents a user's membership within an organization.
 * FIXED: Removed "owner" to match OpenAuthOrgResponse and database schemas.
 */
export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: Date;
}