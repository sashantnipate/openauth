import { redirect } from "next/navigation";
import { SessionVerificationResult } from "@openauth/sdk";

interface RequireAuthOptions {
  getSession: () => Promise<SessionVerificationResult>;
  redirectTo?: string;
}

/**
 * Guards Server Components or Actions. 
 * Automatically redirects unauthenticated traffic straight to your sign-in page.
 */
export function createRequireAuth({
  getSession,
  redirectTo = "/sign-in",
}: RequireAuthOptions) {
  return async function requireAuth() {
    const session = await getSession();

    if (!session.authenticated || !session.user) {
      redirect(redirectTo);
    }

    // Return the verified user and organization context for immediate server use
    return {
      user: session.user,
      organization: session.organization,
    };
  };
}