import { getLocalConfig, OpenAuthConfig } from './backend/config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

export { getLocalConfig };
export type { OpenAuthConfig };

const scryptAsync = promisify(crypto.scrypt);
const JWT_SECRET = process.env.OPENAUTH_SECRET || 'fallback-super-secret-key-change-me';

export class OpenAuthEngine {
  private UserModel: any;
  private OrgModel: any;
  private MembershipModel: any;

  constructor(models: { UserModel: any; OrgModel: any; MembershipModel: any }) {
    this.UserModel = models.UserModel;
    this.OrgModel = models.OrgModel;
    this.MembershipModel = models.MembershipModel;
  }
  
  private async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedValue: string): Promise<boolean> {
    const [salt, originalHash] = storedValue.split(':');
    const currentHashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
    const originalHashBuffer = Buffer.from(originalHash, 'hex');
    
    return crypto.timingSafeEqual(currentHashBuffer, originalHashBuffer);
  }

  async signup(input: { email: string; name: string; password?: string; githubId?: string; googleId?: string }) {
    const config = getLocalConfig();

    if (!config.settings.allowUserSignups) {
      throw new Error("Registration is explicitly disabled by admin configurations.");
    }

    const existingUser = await this.UserModel.findOne({ email: input.email.toLowerCase() });
    if (existingUser) throw new Error("A user with this email address already exists.");

    const passwordHash = input.password ? await this.hashPassword(input.password) : undefined;
    const user = await this.UserModel.create({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      providers: { githubId: input.githubId, googleId: input.googleId }
    });

    let autoCreatedOrg = null;
    const orgConfig = config.settings.organizations;

    // Fixed schema verification strategy evaluating structural properties safely
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
}