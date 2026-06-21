import { User } from "../types";

export interface UserRepository {
  /**
   * Creates a new user.
   */
  create(data: Omit<User, "id">): Promise<User>;

  /**
   * Finds a user by its unique identifier.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by email address.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Updates an existing user.
   */
  update(
    id: string,
    data: Partial<Omit<User, "id">>
  ): Promise<User>;

  /**
   * Deletes a user.
   */
  delete(id: string): Promise<void>;
}