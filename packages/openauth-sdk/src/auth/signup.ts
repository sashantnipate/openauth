import { OpenAuth } from "../OpenAuth";
import { AuthResult, SignupInput } from "../types";

/**
 * Registers a new user account.
 *
 * @param auth OpenAuth instance.
 * @param input User registration data.
 * @returns Authentication result.
 */
export async function signupAction(
  auth: OpenAuth,
  input: SignupInput
): Promise<AuthResult> {
  throw new Error("Not implemented.");
}