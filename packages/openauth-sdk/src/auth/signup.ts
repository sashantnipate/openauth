import { OpenAuth } from "../OpenAuth";
import { AuthResult, SignupInput } from "../types";
import { generateToken } from "../utils/jwt";
import { hashPassword } from "../utils/password";
import { validateEmail, validatePassword, validateName } from "../utils/validation";
import { getLiveDatabaseConfig } from "../utils/config";

export async function signupAction(
  auth: OpenAuth,
  input: SignupInput
): Promise<AuthResult> {
  // 1. Resolve dynamic configuration rules directly from database layer before processing bounds
  const liveConfig = await getLiveDatabaseConfig(auth);
  if (!liveConfig.auth.allowUserSignups) {
    throw new Error("Registration is restricted. Public user signup modules are currently deactivated.");
  }

  // 2. Run basic structure validation checks
  validateName(input.name);
  validateEmail(input.email);
  if (!input.password) throw new Error("Password field requirement missing.");
  validatePassword(input.password);

  const normalizedEmail = input.email.toLowerCase().trim();

  // 3. Check for preexisting identity collisions via the repository layer
  const existingUser = await auth.adapter.users.findByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("An account with this email address already exists.");
  }

  // 4. Hash secret strings and commit records to database user document tables
  const passwordHash = await hashPassword(input.password);
  const user = await auth.adapter.users.create({
    email: normalizedEmail,
    name: input.name,
    passwordHash,
    providers: {},
    canCreateOrganizations: true,
    createdAt: new Date()
  });

  // 5. Generate signed cryptographic JWT map payload response
  const encryptionSecret = auth.config.secret || "fallback_system_secret_key";
  const token = generateToken(
    { userId: user.id },
    encryptionSecret,
    liveConfig.auth.session.duration as any
  );

  // 6. PERSIST REAL SESSION FOOTPRINT IN MONGODB
  await auth.adapter.sessions.create({
    userId: user.id,
    token: token,
    active: true,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // Aligns with 7d strategy parameter baseline
  });

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