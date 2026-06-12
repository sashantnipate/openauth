import jwt from 'jsonwebtoken';
import { OpenAuthContext } from '../types/config';
import { getLiveDatabaseConfig } from '../utils/config';
import { hashPassword } from '../utils/password';

export async function signupAction(
  ctx: OpenAuthContext,
  input: { email: string; name: string; password?: string; githubId?: string; googleId?: string }
) {
  const config = await getLiveDatabaseConfig();

  // 1. Enforce admin-controlled registration restriction flags
  if (!config.settings.allowUserSignups) {
    throw new Error("Registration is explicitly disabled by admin configurations.");
  }

  // 2. Defensive environment check for OAuth providers if flagged active in MongoDB
  if (config.providers?.github?.enabled && (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET)) {
    throw new Error("🚨 [openAuth] GitHub OAuth is enabled, but client keys are missing from server environments.");
  }

  if (config.providers?.google?.enabled && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
    throw new Error("🚨 [openAuth] Google OAuth is enabled, but client keys are missing from server environments.");
  }

  // 3. Prevent duplicate accounts
  const normalizedEmail = input.email.toLowerCase().trim();
  const existingUser = await ctx.UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error("A user with this email address already exists.");
  }

  // 4. Securely process credentials
  const passwordHash = input.password ? await hashPassword(input.password) : undefined;
  
  const user = await ctx.UserModel.create({
    email: normalizedEmail,
    name: input.name,
    passwordHash,
    providers: { githubId: input.githubId, googleId: input.googleId },
    canCreateOrganizations: true 
  });

  // 5. Automatic multi-tenant workspace isolation routing
  let autoCreatedOrg = null;
  const orgConfig = config.settings.organizations;

  if (orgConfig && orgConfig.enabled && orgConfig.autoCreateOnSignup) {
    autoCreatedOrg = await ctx.OrgModel.create({
      name: `${user.name}'s Workspace`,
      creatorId: user._id,
      maxMembers: orgConfig.defaultMaxMembers || 5
    });

    await ctx.MembershipModel.create({
      orgId: autoCreatedOrg._id,
      userId: user._id,
      role: 'admin'
    });
  }

  // 6. Sign secure crypt session token
  const token = jwt.sign({ userId: user._id.toString() }, ctx.secret, { 
    expiresIn: config.settings.sessionDuration as any
  });

  return { 
    user: { id: user._id, email: user.email, name: user.name }, 
    token, 
    organization: autoCreatedOrg 
  };
}