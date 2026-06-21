// packages/openauth-sdk/src/auth/signup.ts
import { OpenAuth } from "../OpenAuth";
import { AuthResult, SignupInput } from "../types";
import { generateToken } from "../utils/jwt";
import { hashPassword } from "../utils/password";
import { validateEmail, validatePassword, validateName } from "../utils/validation";

export async function signupAction(
  auth: OpenAuth,
  input: SignupInput
): Promise<AuthResult> {
  // 1. Run basic structure validation checks
  validateName(input.name);
  validateEmail(input.email);
  if (!input.password) throw new Error("Password field requirement missing.");
  validatePassword(input.password);

  const normalizedEmail = input.email.toLowerCase().trim();

  // 2. Check for preexisting collisions via the adapter repository layer
  const existingUser = await auth.adapter.users.findByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("An account with this email address already exists.");
  }

  // 3. Hash secret strings and commit records to database tracking tables
  const passwordHash = await hashPassword(input.password);
  const user = await auth.adapter.users.create({
    email: normalizedEmail,
    name: input.name,
    passwordHash,
    providers: {},
    canCreateOrganizations: true,
    createdAt: new Date()
  });

  // 4. Generate core signed crypto token map payload responses
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
    organization: null
  };
}