import { OpenAuthUserResponse } from "./user";
import { OpenAuthOrgResponse } from "./organization";

/**
 * Data required to register a new user account.
 */
export interface SignupInput {
  email: string;
  name: string;
  password?: string;

  githubId?: string;
  googleId?: string;
}

/**
 * Data required to authenticate an existing user.
 */
export interface SigninInput {
  email: string;
  password?: string;
}

/**
 * Result returned after a successful authentication.
 *
 * This contract is shared across every authentication flow,
 * including email/password, OAuth, magic links, and future
 * authentication methods.
 */
export interface AuthResult {
  user: OpenAuthUserResponse;
  token: string;
  organization: OpenAuthOrgResponse | null;
}

/**
 * Represents the current authentication state of a session.
 */
export interface AuthenticatedSession {
  authenticated: boolean;
  user: OpenAuthUserResponse | null;
  organization: OpenAuthOrgResponse | null;
  error?: string;
}

/**
 * Result returned after a logout operation.
 */
export interface LogoutResult {
  success: boolean;
  message: string;
}