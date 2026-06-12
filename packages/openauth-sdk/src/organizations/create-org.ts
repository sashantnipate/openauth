import { OpenAuthContext } from '../types/config';
import { getLiveDatabaseConfig } from '../utils/config';

/**
 * Custom Organization Provisioning Flow
 */
export async function createOrganizationAction(
  ctx: OpenAuthContext, 
  userId: string, 
  targetOrgName: string
) {
  const config = await getLiveDatabaseConfig();

  // 1. Evaluate architectural multi-tenancy status flag
  if (!config.settings.organizations?.enabled) {
    throw new Error("Enterprise multi-tenancy modules are currently deactivated on this instance.");
  }

  // 2. Locate the initiating individual account
  const user = await ctx.UserModel.findById(userId);
  if (!user) {
    throw new Error("The specified user identity could not be verified.");
  }

  // 3. Enforce precise permission lock constraints
  if (user.canCreateOrganizations === false) {
    throw new Error("Your account permissions restrict you from establishing new corporate workspaces.");
  }

  // 4. Everything matches -> Commit transaction documents safely
  const newWorkspace = await ctx.OrgModel.create({
    name: targetOrgName.trim(),
    creatorId: user._id,
    maxMembers: config.settings.organizations.defaultMaxMembers || 5
  });

  // 5. Automatically tie creator with admin authority contexts
  await ctx.MembershipModel.create({
    orgId: newWorkspace._id,
    userId: user._id,
    role: 'admin'
  });

  return {
    id: newWorkspace._id,
    name: newWorkspace.name,
    role: 'admin' as const
  };
}