import { OpenAuth } from '../OpenAuth';
import { AuthenticatedSession } from '../types';
import { verifyToken } from '../utils/jwt';

export async function verifySessionAction(
  auth: OpenAuth,
  token: string
): Promise<AuthenticatedSession> {
  try {
    if (!token) {
      throw new Error("No authorization token supplied.");
    }

    // 1. Validate signature integrity using your built-in utility helper function
    const encryptionSecret = (auth.config as any).secret || "fallback_system_secret_key";
    const decoded = verifyToken<{ userId: string }>(token, encryptionSecret);
    
    if (!decoded || !decoded.userId) {
      throw new Error("Malformed session parameters.");
    }

  // 2. Fetch fresh identity profile data directly from your database repository adapter
    const user = await auth.adapter.users.findById(decoded.userId);
    if (!user) {
      throw new Error("Authenticated identity signature no longer correlates with a valid user.");
    }

    // 3. Compile related multi-tenant context details if they exist
    let organization = null;
    if (auth.config.auth.organizations.enabled) {
      const memberships = await auth.adapter.organizationMemberships.findByUserId(user.id);
      const primaryMembership = memberships[0];

      if (primaryMembership) {
        const orgDoc = await auth.adapter.organizations.findById(primaryMembership.organizationId);
        if (orgDoc) {
          organization = {
            id: orgDoc.id,
            name: orgDoc.name,
            role: primaryMembership.role // Matches your fixed "admin" | "member" enum!
          };
        }
      }
    }

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