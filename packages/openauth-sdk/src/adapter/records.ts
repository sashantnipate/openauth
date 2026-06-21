import { SignupInput } from "../types/auth";

/**
 * Pure domain objects.
 * These are NOT tied to MongoDB, Prisma, Drizzle, etc.
 */

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;

  providers: {
    githubId?: string;
    googleId?: string;
  };

  canCreateOrganizations: boolean;

  createdAt: Date;
}

export interface OrgRecord {
  id: string;
  name: string;
  creatorId: string;
  maxMembers: number;
  createdAt: Date;
}

export interface MembershipRecord {
  id: string;

  orgId: string;

  userId: string;

  role: "admin" | "member";

  joinedAt: Date;
}

export interface SessionRecord {
  id: string;

  userId: string;

  token: string;

  expiresAt: Date;

  createdAt: Date;
}

export interface VerificationRecord {
  id: string;

  userId: string;

  token: string;

  expiresAt: Date;

  type: "email" | "password-reset";
}