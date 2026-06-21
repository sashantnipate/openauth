import { OpenAuth } from '../OpenAuth';

/**
 * Custom Organization Provisioning Flow
 */
export async function createOrganizationAction(
  auth: OpenAuth, 
  userId: string, 
  targetOrgName: string
) {
  // 1. Evaluate architectural multi-tenancy status flag
  if (!auth.config.auth.organizations.enabled) {
    throw new Error("Enterprise multi-tenancy modules are currently deactivated on this instance.");
  }

  // 2. Locate the initiating individual account using repository adapter
  const user = await auth.adapter.users.findById(userId);
  if (!user) {
    throw new Error("The specified user identity could not be verified.");
  }

  // 3. Enforce precise permission lock constraints
  if (user.canCreateOrganizations === false) {
    throw new Error("Your account permissions restrict you from establishing new corporate workspaces.");
  }

  // 4. Everything matches -> Commit transaction documents via repository
  const newWorkspace = await auth.adapter.organizations.create({
    name: targetOrgName.trim(),
    creatorId: user.id,
    maxMembers: auth.config.auth.organizations.defaultMaxMembers ?? 5,
    createdAt: new Date()
  });

  // 5. Automatically tie creator with admin authority contexts
  await auth.adapter.organizationMemberships.create({
    organizationId: newWorkspace.id,
    userId: user.id,
    role: 'admin',
    joinedAt: new Date()
  });

  return {
    id: newWorkspace.id,
    name: newWorkspace.name,
    role: 'admin' as const
  };
}