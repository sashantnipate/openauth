import { OpenAuthConfig } from "./types/index";
import { OpenAuthAdapter } from "./repository/index";
import { signupAction } from "./auth/signup";
import { signinAction } from "./auth/signin";
import { handleGitHubCallbackAction } from "./oauth/github";
import { handleGoogleCallbackAction } from "./oauth/google";
import { createOrganizationAction } from "./organizations/create-org";
import { logoutAction } from "./auth/logout";
import { verifySessionAction } from "./auth/session";

export class OpenAuth {
  constructor(
    public readonly adapter: OpenAuthAdapter,
    public readonly config: OpenAuthConfig 
  ) {}

  async signup(input: any) {
    return signupAction(this, input);
  }

  async signin(input: any) {
    return signinAction(this, input);
  }

  async handleGitHubCallback(input: { code: string }) {
    return handleGitHubCallbackAction(this, input);
  }

  async handleGoogleCallback(input: { code: string; redirectUri: string }) {
    return handleGoogleCallbackAction(this, input);
  }

  // Organization Hooks
  async createOrganization(userId: string, name: string) {
    return createOrganizationAction(this, userId, name);
  }

  async logout(token?: string) {
    return logoutAction(this, token);
  }

  async verifySession(token: string) {
    return verifySessionAction(this, token);
  }
}