import { handleSignup } from '../auth/signup';
import { handleCreateOrganization } from '../auth/organization';

export class OpenAuthEngine {
  constructor(private models: { UserModel: any; OrgModel: any; MembershipModel: any }) {}

  private extractSecret(): string {
    const secret = process.env.OPENAUTH_SECRET;
    if (!secret) {
      throw new Error(
        "🚨 [openAuth CRITICAL] The OPENAUTH_SECRET environment variable is missing! " +
        "Please define it in your environment variables to secure session tokens."
      );
    }
    return secret;
  }

  async signup(input: { email: string; name: string; password?: string; githubId?: string; googleId?: string }) {
    return handleSignup(this.models, this.extractSecret(), input);
  }

  async createOrganization(userId: string, targetOrgName: string) {
    return handleCreateOrganization(this.models, userId, targetOrgName);
  }
}