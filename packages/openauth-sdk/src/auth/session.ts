import { OpenAuth } from '../OpenAuth';
import { AuthenticatedSession } from '../types';
import { verifyToken } from '../utils/jwt';
import { getLiveDatabaseConfig } from "../utils/config";

export async function verifySessionAction(
  auth: OpenAuth,
  token: string
): Promise<AuthenticatedSession> {
  try {
    if (!token) {
      throw new Error("No authorization token supplied.");
    }

    // 1. Fetch real runtime configurations to confirm if features are active
    const liveConfig = await getLiveDatabaseConfig(auth);

    // 2. Validate token signature integrity using your built-in crypto utility helper
    const encryptionSecret = auth.config.secret || "fallback_system_secret_key";
    const decoded = verifyToken<{ userId: string }>(token, encryptionSecret);
    
    if (!decoded || !decoded.userId) {
      throw new Error("Malformed session parameters.");
    }

    // 3. HARD VALIDATION CONTEXT ENFORCEMENT: Check token session tracking row in database
    const activeDbSession = await auth.adapter.sessions.findByToken(token);
    if (!activeDbSession || !activeDbSession.active) {
      throw new Error("This token session has been invalidated or forced logged out.");
    }

    // 4. Fetch fresh identity profile data directly from your database repository adapter
    const user = await auth.adapter.users.findById(decoded.userId);
    if (!user) {
      throw new Error("Authenticated identity signature no longer correlates with a valid user.");
    }

    // 5. Compile related multi-tenant context details if they exist and are explicitly enabled
    let organization = null;
    if (liveConfig.auth.organizations.enabled) {
      const memberships = await auth.adapter.organizationMemberships.findByUserId(user.id);
      const primaryMembership = memberships[0];

      if (primaryMembership) {
        const orgDoc = await auth.adapter.organizations.findById(primaryMembership.organizationId);
        if (orgDoc) {
          organization = {
            id: orgDoc.id,
            name: orgDoc.name,
            role: primaryMembership.role
          };
        }
      }
    }

    // Update active loop timestamp log for analytics and TTL lifecycle support
    await auth.adapter.sessions.update(activeDbSession.id, { lastActiveAt: new Date() });

    return {
      authenticated: true,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        canCreateOrganizations: user.canCreateOrganizations 
      },
      organization
    };

  } catch (error: any) {
    return {
      authenticated: false,
      error: error.message || "Session verification evaluation fault.",
      user: null,
      organization: null
    };
  }
}