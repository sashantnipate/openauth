import { OpenAuthContext } from '../types/config';

/**
 * Registers an identity link connecting a user to an active team space
 */
export async function addTeamMemberAction(
  ctx: OpenAuthContext,
  adminUserId: string,
  targetOrgId: string,
  inviteeEmail: string,
  assignedRole: 'admin' | 'member' = 'member'
) {
  // 1. Assert action is executed by an authorized tenant admin
  const operationalCaller = await ctx.MembershipModel.findOne({
    orgId: targetOrgId,
    userId: adminUserId,
    role: 'admin'
  });
  
  if (!operationalCaller) {
    throw new Error("Unauthorized access. Workspace administration authority matches required.");
  }

  // 2. Evaluate current member density bounds against max bounds
  const organization = await ctx.OrgModel.findById(targetOrgId);
  if (!organization) {
    throw new Error("Target organization workspace profile not found.");
  }

  const currentActiveSeats = await ctx.MembershipModel.countDocuments({ orgId: targetOrgId });
  if (currentActiveSeats >= (organization.maxMembers || 5)) {
    throw new Error("Workspace seat limit reached. Upgrade tiers to introduce additional profiles.");
  }

  // 3. Verify target profile exists inside the identity core table
  const inviteeUser = await ctx.UserModel.findOne({ email: inviteeEmail.toLowerCase().trim() });
  if (!inviteeUser) {
    throw new Error("No registered identity correlates with the provided email address.");
  }

  // 4. Prevent compilation of duplicate link entries
  const existingLink = await ctx.MembershipModel.findOne({
    orgId: targetOrgId,
    userId: inviteeUser._id
  });
  if (existingLink) {
    throw new Error("Target identity is already an active member of this workspace space.");
  }

  // 5. Everything fits -> Provision linkage document
  const link = await ctx.MembershipModel.create({
    orgId: organization._id,
    userId: inviteeUser._id,
    role: assignedRole
  });

  return {
    success: true,
    membershipId: link._id,
    userId: inviteeUser._id,
    role: link.role
  };
}

/**
 * Drops an assignment block clearing accounts from active space teams
 */
export async function removeTeamMemberAction(
  ctx: OpenAuthContext,
  adminUserId: string,
  targetOrgId: string,
  targetUserId: string
) {
  // 1. Prevent creators or administrators from executing accidental self-purges
  if (adminUserId === targetUserId) {
    throw new Error("Self-removal operations invalid. Revoke workspaces or pass authority roles first.");
  }

  // 2. Validate authority bounds before executing target deletions
  const actingAdmin = await ctx.MembershipModel.findOne({
    orgId: targetOrgId,
    userId: adminUserId,
    role: 'admin'
  });
  
  if (!actingAdmin) {
    throw new Error("Unauthorized. Administration privileges required to modify member layouts.");
  }

  // 3. Complete linkage erasure
  const operation = await ctx.MembershipModel.findOneAndDelete({
    orgId: targetOrgId,
    userId: targetUserId
  });

  if (!operation) {
    throw new Error("No correlation record identified for the selected parameters.");
  }

  return { success: true };
}