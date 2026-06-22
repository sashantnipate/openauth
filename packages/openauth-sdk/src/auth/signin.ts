import { OpenAuth } from '../OpenAuth';
import { SigninInput, AuthResult } from '../types';
import { generateToken } from '../utils/jwt';
import { verifyPassword } from '../utils/password';
import { getLiveDatabaseConfig } from "../utils/config";

export async function signinAction(
  auth: OpenAuth,
  input: SigninInput
): Promise<AuthResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  // 1. Pull active settings rules straight out of the MongoDB collection parameters
  const liveConfig = await getLiveDatabaseConfig(auth);

  // 2. Locate user profile identity using the repository adapter contract
  const user = await auth.adapter.users.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error("Invalid email or password combinations.");
  }

  // 3. Validate traditional credential records
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

  // 4. Resolve active workspace contexts if tenant lookups are open
  let activeWorkspace = null;
  if (liveConfig.auth.organizations.enabled) {
    const memberships = await auth.adapter.organizationMemberships.findByUserId(user.id);
    const primaryMembership = memberships[0]; // Fetch their initial associated workspace link
    
    if (primaryMembership) {
      activeWorkspace = await auth.adapter.organizations.findById(primaryMembership.organizationId);
    }
  }

  // 5. Issue standard token using your built-in encryption utility helper function
  const encryptionSecret = auth.config.secret || "fallback_system_secret_key";
  const token = generateToken(
    { userId: user.id },
    encryptionSecret,
    liveConfig.auth.session.duration as any
  );

  // 6. TRACK ACTIVE SESSION DOCUMENT RECORD DIRECTLY IN DATABASE
  await auth.adapter.sessions.create({
    userId: user.id,
    token: token,
    active: true,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  });

  return {
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      canCreateOrganizations: user.canCreateOrganizations 
    },
    token,
    organization: activeWorkspace ? { id: activeWorkspace.id, name: activeWorkspace.name } : null
  };
}