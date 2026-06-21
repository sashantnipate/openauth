import {
  OpenAuthAdapter,
  OpenAuthContext,
} from "./adapter";

import { OpenAuthConfig } from "./types/config";

import {
  SignupInput,
  AuthEngineResult,
  SessionVerificationResult,
  LogoutEngineResult,
} from "./types/auth";

import { signupAction } from "./auth/signup";
import { signinAction } from "./auth/signin";
import { verifySessionAction } from "./auth/session";
import { logoutAction } from "./auth/logout";
import { createOrganizationAction } from "./organizations/create-org";

export class OpenAuth {
  private readonly ctx: OpenAuthContext;

  constructor(options: {
    adapter: OpenAuthAdapter;
    config: OpenAuthConfig;
  }) {
    const secret = process.env.OPENAUTH_SECRET;

    if (!secret) {
      throw new Error(
        [
          "[OpenAuth]",
          "OPENAUTH_SECRET is missing.",
          "Please define OPENAUTH_SECRET in your environment.",
        ].join(" ")
      );
    }

    this.ctx = {
      adapter: options.adapter,
      config: options.config,
      secret,
    };
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  async signup(input: SignupInput): Promise<AuthEngineResult> {
    return signupAction(this.ctx, input);
  }

  async signin(
    input: Parameters<typeof signinAction>[1]
  ): Promise<AuthEngineResult> {
    return signinAction(this.ctx, input);
  }

  async verifySession(
    token: string
  ): Promise<SessionVerificationResult> {
    return verifySessionAction(this.ctx, token);
  }

  async logout(
    token?: string
  ): Promise<LogoutEngineResult> {
    return logoutAction(this.ctx, token);
  }

  // ============================================================================
  // Organizations
  // ============================================================================

  async createOrganization(
    userId: string,
    organizationName: string
  ) {
    return createOrganizationAction(
      this.ctx,
      userId,
      organizationName
    );
  }
}