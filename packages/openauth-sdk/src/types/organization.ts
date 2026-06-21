export interface Organization {
  id: string;
  name: string;
  creatorId: string;
  maxMembers: number;
  createdAt: Date;
}

/**
 * Public representation of an organization returned by the SDK.
 */
export interface OpenAuthOrgResponse {
  id: string;
  name: string;
  role?: "admin" | "member";
}