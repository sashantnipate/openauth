import { OpenAuthModels, OpenAuthContext } from './types/config';
import { SignupInput, AuthEngineResult, SessionVerificationResult, LogoutEngineResult } from './types/auth';

// Action Import Vectors
import { signupAction } from './auth/signup';
import { signinAction } from './auth/signin';
import { verifySessionAction } from './auth/session';
import { logoutAction } from './auth/logout';
import { createOrganizationAction } from './organizations/create-org';
import { addTeamMemberAction, removeTeamMemberAction } from './organizations/membership';
import { updateMemberRoleAction, verifyRolePermissionAction } from './organizations/roles';

export class OpenAuth {
  private ctx: OpenAuthContext;

  /**
   * Initializes the self-hosted authentication engine container layer.
   * Inject your dynamic host Mongoose models directly here.
   */
  constructor(models: OpenAuthModels) {
    if (!process.env.OPENAUTH_SECRET) {
      throw new Error(
        "🚨 [openAuth CRITICAL] The OPENAUTH_SECRET environment variable is missing!\n" +
        "Please define it in your environment variables to secure session signatures."
      );
    }

    this.ctx = {
      ...models,
      secret: process.env.OPENAUTH_SECRET
    };
  }

  // ============================================================================
  // IDENTITY & ACCESS AGENT ROOT ROUTINES
  // ============================================================================

  /**
   * Registers a brand new account identity within local persistence structures.
   */
  async signup(input: SignupInput): Promise<AuthEngineResult> {
    return signupAction(this.ctx, input);
  }

  /**
   * Verifies account credentials and issues state credentials if valid.
   */
  async signin(input: Parameters<typeof signinAction>[1]): Promise<AuthEngineResult> {
    return signinAction(this.ctx, input);
  }

  /**
   * Parses and validates raw browser context token strings securely.
   */
  async verifySession(token: string): Promise<SessionVerificationResult> {
    return verifySessionAction(this.ctx, token);
  }

  /**
   * Invalidates local runtime interaction configurations on call.
   */
  async logout(token?: string): Promise<LogoutEngineResult> {
    return logoutAction(this.ctx, token);
  }

  // ============================================================================
  // ENTERPRISE MULTI-TENANCY COMPASS ROUTINES
  // ============================================================================

  /**
   * Provisions an independent organizational unit container bound to an owner account.
   */
  async createOrganization(userId: string, targetOrgName: string) {
    return createOrganizationAction(this.ctx, userId, targetOrgName);
  }

  /**
   * Adds an identity link connecting an account user profile to an active workspace team.
   */
  async addTeamMember(
    adminUserId: string,
    targetOrgId: string,
    inviteeEmail: string,
    assignedRole: 'admin' | 'member' = 'member'
  ) {
    return addTeamMemberAction(this.ctx, adminUserId, targetOrgId, inviteeEmail, assignedRole);
  }

  /**
   * Revokes workspace membership linking structures for a user profile.
   */
  async removeTeamMember(adminUserId: string, targetOrgId: string, targetUserId: string) {
    return removeTeamMemberAction(this.ctx, adminUserId, targetOrgId, targetUserId);
  }

  /**
   * Modifies authorization permissions assigned to a member inside a workspace.
   */
  async updateMemberRole(
    adminUserId: string,
    targetOrgId: string,
    targetUserId: string,
    targetRoleWillBe: 'admin' | 'member'
  ) {
    return updateMemberRoleAction(this.ctx, adminUserId, targetOrgId, targetUserId, targetRoleWillBe);
  }

  /**
   * Evaluates if a specific user possesses authorized capability rules for an event context.
   */
  async verifyRolePermission(userId: string, orgId: string, allowedRoles: ('admin' | 'member')[]): Promise<boolean> {
    return verifyRolePermissionAction(this.ctx, userId, orgId, allowedRoles);
  }
}