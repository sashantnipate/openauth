import { cookies } from "next/headers";
import { OpenAuth } from "@openauth/sdk";

interface GetSessionOptions {
  auth: OpenAuth;
  cookieName?: string;
}

/**
 * Server-side helper to retrieve and verify the current user session.
 * Safe for use in Server Components, Server Actions, and Route Handlers.
 */
export async function createGetSession({
  auth,
  cookieName = "openauth.session",
}: GetSessionOptions) {
  return async function getSession() {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(cookieName)?.value;

      if (!token) {
        return {
          authenticated: false,
          user: null,
          organization: null,
        };
      }

      // Hand off the raw token string to the SDK core for verification
      const result = await auth.verifySession(token);
      return result;
    } catch (error) {
      return {
        authenticated: false,
        user: null,
        organization: null,
        error: "Failed to resolve session context.",
      };
    }
  };
}