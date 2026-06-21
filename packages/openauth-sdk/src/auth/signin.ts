import { OpenAuth } from '../OpenAuth';
import { SigninInput, AuthResult } from '../types';
import { generateToken } from '../utils/jwt';
import { verifyPassword } from '../utils/password';

export async function signinAction(
  auth: OpenAuth,
  input: SigninInput
): Promise<AuthResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  // 1. Locate user profile identity using the repository adapter contract
  const user = await auth.adapter.users.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error("Invalid email or password combinations.");
  }

  // 2. Validate traditional credential records
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
  if (auth.config.auth.organizations.enabled) {
    const memberships = await auth.adapter.organizationMemberships.findByUserId(user.id);
    const primaryMembership = memberships[0]; // Fetch their initial associated workspace link
    
    if (primaryMembership) {
      activeWorkspace = await auth.adapter.organizations.findById(primaryMembership.organizationId);
    }
  }

  // 4. Issue standard token using your built-in utility helper function
  // In a production environment, pass a secure environment variable key instead of a static string fallback
  const encryptionSecret = (auth.config as any).secret || "fallback_system_secret_key";
  const token = generateToken(
    { userId: user.id },
    encryptionSecret,
    auth.config.auth.session.duration as any
  );

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