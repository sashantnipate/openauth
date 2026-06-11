import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import mongoose from 'mongoose';

const scryptAsync = promisify(crypto.scrypt);

// SECURITY ASSERTION: Prevent system compilation or bootstrap if core cryptographic key is omitted
if (!process.env.OPENAUTH_SECRET) {
  throw new Error(
    "🚨 [openAuth CRITICAL] The OPENAUTH_SECRET environment variable is missing! " +
    "Please define it in your environment variables to secure session tokens."
  );
}
const JWT_SECRET = process.env.OPENAUTH_SECRET;

/**
 * Helper to dynamically pull runtime settings directly from the MongoDB collection.
 * Falls back to default secure layout configurations if not initialized.
 */
async function getLiveDatabaseConfig(): Promise<any> {
  const AuthSettings = mongoose.models.AuthSettings || mongoose.model('AuthSettings', new mongoose.Schema({}, { strict: false }));
  const config = await AuthSettings.findOne().lean();
  return config || {
    settings: {
      sessionDuration: "1d",
      organizations: { enabled: false, allowUserCreate: false, autoCreateOnSignup: false, defaultMaxMembers: 5 },
      allowUserSignups: true
    },
    providers: {
      github: { enabled: false },
      google: { enabled: false }
    }
  };
}

export class OpenAuthEngine {
  private UserModel: any;
  private OrgModel: any;
  private MembershipModel: any;

  /**
   * Headless database constructor injecting local compilation identity matrices
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
   * Provisions a brand new identity account with defensive environment guard assertions.
   */
  async signup(input: { email: string; name: string; password?: string; githubId?: string; googleId?: string }) {
    const config = await getLiveDatabaseConfig();

    // 1. Enforce global activation guard flags
    if (!config.settings.allowUserSignups) {
      throw new Error("Registration is explicitly disabled by admin configurations.");
    }

    // 2. Strict OAuth Isolation Verification: Assert presence of server-side keys if provider toggles are true
    if (config.providers?.github?.enabled) {
      if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        throw new Error(
          "🚨 [openAuth CRITICAL] GitHub OAuth provider is enabled in database configurations, " +
          "but GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing from server memory environments."
        );
      }
    }

    if (config.providers?.google?.enabled) {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error(
          "🚨 [openAuth CRITICAL] Google OAuth provider is enabled in database configurations, " +
          "but GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from server memory environments."
        );
      }
    }

    // 3. Complete database unique check execution
    const existingUser = await this.UserModel.findOne({ email: input.email.toLowerCase() });
    if (existingUser) throw new Error("A user with this email address already exists.");

    const passwordHash = input.password ? await this.hashPassword(input.password) : undefined;
    
    const user = await this.UserModel.create({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      providers: { githubId: input.githubId, googleId: input.googleId },
      canCreateOrganizations: true 
    });

    let autoCreatedOrg = null;
    const orgConfig = config.settings.organizations;

    // RUNTIME FLAG ENFORCEMENT: Check multi-tenancy status before compiling organization data
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
   */
  async createOrganization(userId: string, targetOrgName: string) {
    const config = await getLiveDatabaseConfig();

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