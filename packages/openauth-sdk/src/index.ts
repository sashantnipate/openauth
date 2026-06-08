import { getLocalConfig, OpenAuthConfig } from './backend/config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

export { getLocalConfig };
export type { OpenAuthConfig };

const scryptAsync = promisify(crypto.scrypt);

// SECURITY FIX: Never fall back to a public, plain-text string for cryptography.
// If a developer forgets to set this, we halt execution immediately before any tokens are compromised.
if (!process.env.OPENAUTH_SECRET) {
  throw new Error(
    "🚨 [openAuth CRITICAL] The OPENAUTH_SECRET environment variable is missing! " +
    "Please define it in your environment variables to secure session tokens."
  );
}
const JWT_SECRET = process.env.OPENAUTH_SECRET;

export class OpenAuthEngine {
  private UserModel: any;
  private OrgModel: any;
  private MembershipModel: any;

  /**
   * Future Dev Note: The engine acts as a headless database operator.
   * We pass models explicitly through the constructor so the SDK remains 
   * database-agnostic and won't get locked into a single specific connection instance.
   */
  constructor(models: { UserModel: any; OrgModel: any; MembershipModel: any }) {
    this.UserModel = models.UserModel;
    this.OrgModel = models.OrgModel;
    this.MembershipModel = models.MembershipModel;
  }
  
  /**
   * Generates a secure scrypt password hash accompanied by a unique salt.
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Uses timingSafeEqual to avoid timing side-channel attacks during authentication loops.
   */
  private async verifyPassword(password: string, storedValue: string): Promise<boolean> {
    const [salt, originalHash] = storedValue.split(':');
    const currentHashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
    const originalHashBuffer = Buffer.from(originalHash, 'hex');
    
    return crypto.timingSafeEqual(currentHashBuffer, originalHashBuffer);
  }

  /**
   * Provisions a brand new identity account.
   */
  async signup(input: { email: string; name: string; password?: string; githubId?: string; googleId?: string }) {
    const config = getLocalConfig();

    if (!config.settings.allowUserSignups) {
      throw new Error("Registration is explicitly disabled by admin configurations.");
    }

    const existingUser = await this.UserModel.findOne({ email: input.email.toLowerCase() });
    if (existingUser) throw new Error("A user with this email address already exists.");

    const passwordHash = input.password ? await this.hashPassword(input.password) : undefined;
    
    // Default system initialization: new users are marked as authorized to make workspaces
    const user = await this.UserModel.create({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      providers: { githubId: input.githubId, googleId: input.googleId },
      canCreateOrganizations: true 
    });

    let autoCreatedOrg = null;
    const orgConfig = config.settings.organizations;

    // RUNTIME FLAG ENFORCEMENT: We check if multi-tenancy is active before generating org data
    if (orgConfig && orgConfig.enabled && orgConfig.autoCreateOnSignup) {
      autoCreatedOrg = await this.OrgModel.create({
        name: `${user.name}'s Workspace`,
        creatorId: user._id,
        maxMembers: orgConfig.defaultMaxMembers || 5
      });

      await this.MembershipModel.create({
        orgId: autoCreatedOrg._id,
        userId: user._id,
        role: 'admin'
      });
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { 
      expiresIn: config.settings.sessionDuration as any
    });

    return { user, token, organization: autoCreatedOrg };
  }

  /**
   * Action: Custom Organization Provisioning Flow
   * Features: Enforces runtime feature flags and granular per-user restriction checks.
   */
  async createOrganization(userId: string, targetOrgName: string) {
    const config = getLocalConfig();

    // 1. Evaluate architectural capability switch
    if (!config.settings.organizations?.enabled) {
      throw new Error("Enterprise multi-tenancy modules are currently deactivated on this instance.");
    }

    // 2. Locate the initiating individual
    const user = await this.UserModel.findById(userId);
    if (!user) throw new Error("The specified user identity could not be verified.");

    // 3. Enforce precise permission restriction locks
    if (user.canCreateOrganizations === false) {
      throw new Error("Your account permissions restrict you from establishing new corporate workspaces.");
    }

    // 4. Everything matches -> Commit transaction safely
    const newWorkspace = await this.OrgModel.create({
      name: targetOrgName,
      creatorId: user._id,
      maxMembers: config.settings.organizations.defaultMaxMembers || 5
    });

    await this.MembershipModel.create({
      orgId: newWorkspace._id,
      userId: user._id,
      role: 'admin'
    });

    return newWorkspace;
  }
}