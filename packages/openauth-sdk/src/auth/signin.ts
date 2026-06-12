import jwt from 'jsonwebtoken';
import { OpenAuthContext } from '../types/config';
import { getLiveDatabaseConfig } from '../utils/config';
import { verifyPassword } from '../utils/password';

export async function signinAction(
  ctx: OpenAuthContext,
  input: { email: string; password?: string }
) {
  const config = await getLiveDatabaseConfig();
  const normalizedEmail = input.email.toLowerCase().trim();

  // 1. Locate user profile identity
  const user = await ctx.UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error("Invalid email or password combinations.");
  }

  // 2. Validate traditional credential records if a password is provided
  if (input.password) {
    if (!user.passwordHash) {
      throw new Error("This account relies on third-party single sign-on providers. Please log in using OAuth.");
    }

    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password combinations.");
    }
  } else {
    throw new Error("Password context requirements missing.");
  }

  // 3. Resolve active workspace contexts if tenant lookups are open
  let activeWorkspace = null;
  if (config.settings.organizations?.enabled) {
    const membership = await ctx.MembershipModel.findOne({ userId: user._id }).lean();
    if (membership) {
      activeWorkspace = await ctx.OrgModel.findById(membership.orgId).lean();
    }
  }

  // 4. Issue standard stateless session credentials
  const token = jwt.sign({ userId: user._id.toString() }, ctx.secret, {
    expiresIn: config.settings.sessionDuration as any
  });

  return {
    user: { id: user._id, email: user.email, name: user.name },
    token,
    organization: activeWorkspace ? { id: activeWorkspace._id, name: activeWorkspace.name } : null
  };
}