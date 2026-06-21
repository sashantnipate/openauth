import { OpenAuth } from '../OpenAuth';

/**
 * Evaluates capability access states for target resource operations
 */
export async function verifyRolePermissionAction(
  auth: OpenAuth,
  userId: string,
  orgId: string,
  allowedRoles: ('admin' | 'member')[]
): Promise<boolean> {
  const membership = await auth.adapter.organizationMemberships.findByOrganizationAndUser(orgId, userId);

  if (!membership) return false;
  return allowedRoles.includes(membership.role);
}

/**
 * Modifies permission roles of an identity within a specific workspace
 */
export async function updateMemberRoleAction(
  auth: OpenAuth,
  adminUserId: string,
  targetOrgId: string,
  targetUserId: string,
  targetRoleWillBe: 'admin' | 'member'
) {
  // 1. Assert operation caller holds valid admin privileges
  const actingAdmin = await auth.adapter.organizationMemberships.findByOrganizationAndUser(
    targetOrgId,
    adminUserId
  );

  if (!actingAdmin || actingAdmin.role !== 'admin') {
    throw new Error("Unauthorized. Administration authority parameters required.");
  }

  // 2. Locate target user allocation path
  const targetMembership = await auth.adapter.organizationMemberships.findByOrganizationAndUser(
    targetOrgId,
    targetUserId
  );

  if (!targetMembership) {
    throw new Error("No target member profile located inside specified tenant context bounds.");
  }

  // 3. Commit update action via the adapter repository layer
  const updated = await auth.adapter.organizationMemberships.update(targetMembership.id, {
    role: targetRoleWillBe
  });

  return {
    success: true,
    userId: targetUserId,
    updatedRole: updated.role
  };
}