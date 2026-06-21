import { OrganizationMembership } from "../types";

/**
 * Defines the operations required to manage organization memberships.
 */
export interface OrganizationMembershipRepository {
  /**
   * Adds a user to an organization.
   */
  create(
    data: Omit<OrganizationMembership, "id">
  ): Promise<OrganizationMembership>;

  /**
   * Finds a membership by its unique identifier.
   */
  findById(id: string): Promise<OrganizationMembership | null>;

  /**
   * Finds a user's membership within an organization.
   */
  findByOrganizationAndUser(
    organizationId: string,
    userId: string
  ): Promise<OrganizationMembership | null>;

  /**
   * Returns all members of an organization.
   */
  findByOrganizationId(
    organizationId: string
  ): Promise<OrganizationMembership[]>;

  /**
   * Returns every organization a user belongs to.
   */
  findByUserId(
    userId: string
  ): Promise<OrganizationMembership[]>;

  /**
   * Updates an existing membership.
   */
  update(
    id: string,
    data: Partial<Omit<OrganizationMembership, "id">>
  ): Promise<OrganizationMembership>;

  /**
   * Removes a membership.
   */
  delete(id: string): Promise<void>;

  /**
   * Removes a user from an organization.
   */
  deleteByOrganizationAndUser(
    organizationId: string,
    userId: string
  ): Promise<void>;
}