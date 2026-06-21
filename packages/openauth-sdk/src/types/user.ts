export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  providers: {
    github?: string;
    google?: string;
  };
  canCreateOrganizations: boolean;
  createdAt: Date;
}

/**
 * Public representation of a user returned by the SDK.
 * FIXED: Included canCreateOrganizations so downstream apps can check permissions.
 */
export interface OpenAuthUserResponse {
  id: string;
  email: string;
  name: string;
  canCreateOrganizations: boolean;
}