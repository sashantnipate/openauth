import { OpenAuth } from '../OpenAuth';

/**
 * Registers an identity link connecting a user to an active team space
 */
export async function addTeamMemberAction(
  auth: OpenAuth,
  adminUserId: string,
  targetOrgId: string,
  inviteeEmail: string,
  assignedRole: 'admin' | 'member' = 'member'
) {
  // 1. Assert action is executed by an authorized tenant admin
  const operationalCaller = await auth.adapter.organizationMemberships.findByOrganizationAndUser(
    targetOrgId,
    adminUserId
  );
  
  if (!operationalCaller || operationalCaller.role !== 'admin') {
    throw new Error("Unauthorized access. Workspace administration authority matches required.");
  }

  // 2. Evaluate current member density bounds against max bounds
  const organization = await auth.adapter.organizations.findById(targetOrgId);
  if (!organization) {
    throw new Error("Target organization workspace profile not found.");
  }

  const currentActiveMembers = await auth.adapter.organizationMemberships.findByOrganizationId(targetOrgId);
  if (currentActiveMembers.length >= (organization.maxMembers ?? 5)) {
    throw new Error("Workspace seat limit reached. Upgrade tiers to introduce additional profiles.");
  }

  // 3. Verify target profile exists inside the identity core table
  const inviteeUser = await auth.adapter.users.findByEmail(inviteeEmail.toLowerCase().trim());
  if (!inviteeUser) {
    throw new Error("No registered identity correlates with the provided email address.");
  }

  // 4. Prevent compilation of duplicate link entries
  const existingLink = await auth.adapter.organizationMemberships.findByOrganizationAndUser(
    targetOrgId,
    inviteeUser.id
  );
  if (existingLink) {
    throw new Error("Target identity is already an active member of this workspace space.");
  }

  // 5. Everything fits -> Provision linkage document
  const link = await auth.adapter.organizationMemberships.create({
    organizationId: organization.id,
    userId: inviteeUser.id,
    role: assignedRole,
    joinedAt: new Date()
  });

  return {
    success: true,
    membershipId: link.id,
    userId: inviteeUser.id,
    role: link.role
  };
}

/**
 * Drops an assignment block clearing accounts from active space teams
 */
export async function removeTeamMemberAction(
  auth: OpenAuth,
  adminUserId: string,
  targetOrgId: string,
  targetUserId: string
) {
  // 1. Prevent creators or administrators from executing accidental self-purges
  if (adminUserId === targetUserId) {
    throw new Error("Self-removal operations invalid. Revoke workspaces or pass authority roles first.");
  }

  // 2. Validate authority bounds before executing target deletions
  const actingAdmin = await auth.adapter.organizationMemberships.findByOrganizationAndUser(
    targetOrgId,
    adminUserId
  );
  
  if (!actingAdmin || actingAdmin.role !== 'admin') {
    throw new Error("Unauthorized. Administration privileges required to modify member layouts.");
  }

  // 3. Complete linkage erasure
  const existingLink = await auth.adapter.organizationMemberships.findByOrganizationAndUser(
    targetOrgId,
    targetUserId
  );
  if (!existingLink) {
    throw new Error("No correlation record identified for the selected parameters.");
  }

  await auth.adapter.organizationMemberships.delete(existingLink.id);

  return { success: true };
}