import {
  AuthenticatedSession,
  AuthResult,
  LogoutResult,
  OpenAuthConfig,
  SigninInput,
  SignupInput,
} from "./types";
import { OpenAuthAdapter } from "./repository";

import { signupAction } from "./auth/signup";
import { signinAction } from "./auth/signin";
import { sessionAction } from "./auth/session";
import { logoutAction } from "./auth/logout";

/**
 * The main entry point for the OpenAuth SDK.
 */
export class OpenAuth {
  /**
   * Creates a new OpenAuth instance.
   */
  constructor(
    public readonly adapter: OpenAuthAdapter,
    public readonly config: OpenAuthConfig
  ) {}

  /**
   * Registers a new user.
   */
  async signup(input: SignupInput): Promise<AuthResult> {
    return signupAction(this, input);
  }

  /**
   * Authenticates an existing user.
   */
  async signin(input: SigninInput): Promise<AuthResult> {
    return signinAction(this, input);
  }

  /**
   * Returns the current authenticated session.
   */
  async getSession(token: string): Promise<AuthenticatedSession> {
    return sessionAction(this, token);
  }

  /**
   * Logs out the current session.
   */
  async logout(token: string): Promise<LogoutResult> {
    return logoutAction(this, token);
  }
}