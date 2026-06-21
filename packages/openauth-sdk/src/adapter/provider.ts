import { SignupInput } from "../types/auth";
import {
  UserRecord,
  OrgRecord,
  MembershipRecord,
} from "./records";
import { OpenAuthConfig } from "../types/config";


/* ============================================================================
 * User Repository
 * ========================================================================== */

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;

  findByEmail(email: string): Promise<UserRecord | null>;

  findByGitHubId(githubId: string): Promise<UserRecord | null>;

  findByGoogleId(googleId: string): Promise<UserRecord | null>;

  create(
    data: SignupInput & {
      passwordHash?: string;
    }
  ): Promise<UserRecord>;
}

/* ============================================================================
 * Organization Repository
 * ========================================================================== */

export interface OrganizationRepository {
  findById(id: string): Promise<OrgRecord | null>;

  create(
    name: string,
    creatorId: string,
    maxMembers: number
  ): Promise<OrgRecord>;
}

/* ============================================================================
 * Membership Repository
 * ========================================================================== */

export interface MembershipRepository {
  find(
    orgId: string,
    userId: string
  ): Promise<MembershipRecord | null>;

  findByUser(
    userId: string
  ): Promise<MembershipRecord | null>;

  count(orgId: string): Promise<number>;

  create(
    orgId: string,
    userId: string,
    role: "admin" | "member"
  ): Promise<MembershipRecord>;

  remove(
    orgId: string,
    userId: string
  ): Promise<boolean>;

  updateRole(
    orgId: string,
    userId: string,
    role: "admin" | "member"
  ): Promise<MembershipRecord>;
}

/* ============================================================================
 * OpenAuth Adapter
 * ========================================================================== */

export interface OpenAuthAdapter {
  User: UserRepository;

  Organization: OrganizationRepository;

  Membership: MembershipRepository;
}


export interface OpenAuthContext {
  adapter: OpenAuthAdapter;

  config: OpenAuthConfig;

  secret: string;
}