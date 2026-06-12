import { OpenAuthContext } from '../types/config';

/**
 * Evaluates capability access states for target resource operations
 */
export async function verifyRolePermissionAction(
  ctx: OpenAuthContext,
  userId: string,
  orgId: string,
  allowedRoles: ('admin' | 'member')[]
): Promise<boolean> {
  const membership = await ctx.MembershipModel.findOne({
    orgId,
    userId
  }).lean();

  if (!membership) return false;
  return allowedRoles.includes(membership.role);
}

/**
 * Modifies permission roles of an identity within a specific workspace
 */
export async function updateMemberRoleAction(
  ctx: OpenAuthContext,
  adminUserId: string,
  targetOrgId: string,
  targetUserId: string,
  targetRoleWillBe: 'admin' | 'member'
) {
  // 1. Assert operation caller holds valid admin privileges
  const actingAdmin = await ctx.MembershipModel.findOne({
    orgId: targetOrgId,
    userId: adminUserId,
    role: 'admin'
  });

  if (!actingAdmin) {
    throw new Error("Unauthorized. Administration authority parameters required.");
  }

  // 2. Locate target user allocation path
  const targetMembership = await ctx.MembershipModel.findOne({
    orgId: targetOrgId,
    userId: targetUserId
  });

  if (!targetMembership) {
    throw new Error("No target member profile located inside specified tenant context bounds.");
  }

  // 3. Commit update action to MongoDB document
  targetMembership.role = targetRoleWillBe;
  await targetMembership.save();

  return {
    success: true,
    userId: targetUserId,
    updatedRole: targetMembership.role
  };
}