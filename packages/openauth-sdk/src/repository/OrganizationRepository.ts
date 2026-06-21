import { Organization } from "../types";

/**
 * Defines the operations required to manage organizations.
 */
export interface OrganizationRepository {
  /**
   * Creates a new organization.
   */
  create(data: Omit<Organization, "id">): Promise<Organization>;

  /**
   * Finds an organization by its unique identifier.
   */
  findById(id: string): Promise<Organization | null>;

  /**
   * Finds an organization by its name.
   */
  findByName(name: string): Promise<Organization | null>;

  /**
   * Returns all organizations created by a user.
   */
  findByCreatorId(userId: string): Promise<Organization[]>;

  /**
   * Updates an existing organization.
   */
  update(
    id: string,
    data: Partial<Omit<Organization, "id">>
  ): Promise<Organization>;

  /**
   * Deletes an organization.
   */
  delete(id: string): Promise<void>;
}