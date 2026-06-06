import { getLocalConfig, OpenAuthConfig } from './backend/config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
export { getLocalConfig };
export type { OpenAuthConfig };

const JWT_SECRET = process.env.OPENAUTH_SECRET || 'fallback-super-secret-key-change-me';

export class OpenAuthEngine {
  private UserModel: any;
  private OrgModel: any;
  private MembershipModel: any;

  // Accept the customizable models directly from the developer's application space
  constructor(models: { UserModel: any; OrgModel: any; MembershipModel: any }) {
    this.UserModel = models.UserModel;
    this.OrgModel = models.OrgModel;
    this.MembershipModel = models.MembershipModel;
  }
  
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedValue: string): boolean {
    const [salt, originalHash] = storedValue.split(':');
    const currentHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(currentHash, 'hex'));
  }

  async signup(input: { email: string; name: string; password?: string; githubId?: string; googleId?: string }) {
    const config = getLocalConfig();

    if (!config.settings.allowUserSignups) {
      throw new Error("Registration is explicitly disabled by admin configurations.");
    }

    const existingUser = await this.UserModel.findOne({ email: input.email.toLowerCase() });
    if (existingUser) throw new Error("A user with this email address already exists.");

    const passwordHash = input.password ? this.hashPassword(input.password) : undefined;
    const user = await this.UserModel.create({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      providers: { githubId: input.githubId, googleId: input.googleId }
    });

    let autoCreatedOrg = null;
    const orgConfig = config.settings.organizations;

    // Use our fresh MembershipModel to handle the infinite scale schema structure
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

    // Cast 'expiresIn' using 'as any' to satisfy the strict library type validation
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { 
      expiresIn: config.settings.sessionDuration as any
    });

    return { user, token, organization: autoCreatedOrg };
  }
}