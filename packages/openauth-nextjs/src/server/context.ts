import { cookies, headers } from "next/headers";
import { OpenAuth } from "@openauth/sdk";

export interface AuthContext {
  userId: string | null;
  orgId: string | null;
  role: "admin" | "member" | null;
  authenticated: boolean;
}

export function createServerContext(auth: OpenAuth, cookieName = "openauth.session") {
  
  // Internal helper to extract the raw token string from either cookies or HTTP Headers
  const resolveToken = async (): Promise<string | null> => {
    // 1. Try to fetch from browser cookie store first
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(cookieName)?.value;
    if (cookieToken) return cookieToken;

    // 2. Fall back to Authorization Bearer headers for API/JWT strategies
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    return null;
  };

  return {
    /**
     * Fast, lightweight session metadata validation block checker.
     */
    async auth(): Promise<AuthContext> {
      try {
        const token = await resolveToken();
        if (!token) {
          return { userId: null, orgId: null, role: null, authenticated: false };
        }

        const verification = await auth.verifySession(token);
        if (!verification.authenticated || !verification.user) {
          return { userId: null, orgId: null, role: null, authenticated: false };
        }

        return {
          userId: verification.user.id,
          orgId: verification.organization?.id || null,
          role: verification.organization?.role || null,
          authenticated: true,
        };
      } catch {
        return { userId: null, orgId: null, role: null, authenticated: false };
      }
    },

    /**
     * Database-level hydration helper fetching the complete active user row.
     */
    async currentUser() {
      try {
        const token = await resolveToken();
        if (!token) return null;

        const verification = await auth.verifySession(token);
        if (!verification.authenticated || !verification.user) return null;

        return await auth.adapter.users.findById(verification.user.id);
      } catch {
        return null;
      }
    }
  };
}