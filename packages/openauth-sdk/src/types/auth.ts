import { OpenAuthUserResponse } from './user';
import { OpenAuthOrgResponse } from './organization';

/**
 * Inbound structural parameters expected during new profile creation attempts
 */
export interface SignupInput {
  email: string;
  name: string;
  password?: string;
  githubId?: string;
  googleId?: string;
}

/**
 * Inbound structural parameters expected during profile verification loops
 */
export interface SigninInput {
  email: string;
  password?: string;
}

/**
 * Central transaction output returned from successful registration or credential verification hooks
 */
export interface AuthEngineResult {
  user: OpenAuthUserResponse;
  token: string;
  organization: OpenAuthOrgResponse | null;
}

/**
 * State container data signature evaluated during active browser session inspection tasks
 */
export interface SessionVerificationResult {
  authenticated: boolean;
  user: OpenAuthUserResponse | null;
  organization: OpenAuthOrgResponse | null;
  error?: string;
}

/**
 * Formal contract detailing standardized server responses generated when processing user logouts
 */
export interface LogoutEngineResult {
  success: boolean;
  message: string;
}