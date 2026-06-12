import jwt from 'jsonwebtoken';
import { OpenAuthContext } from '../types/config';

export async function verifySessionAction(
  ctx: OpenAuthContext,
  token: string
) {
  try {
    if (!token) {
      throw new Error("No authorization token supplied.");
    }

    // 1. Validate signature integrity against local system secret
    const decoded = jwt.verify(token, ctx.secret) as { userId: string };
    
    if (!decoded || !decoded.userId) {
      throw new Error("Malformed session parameters.");
    }

    // 2. Fetch fresh identity profile data directly from database source of truth
    const user = await ctx.UserModel.findById(decoded.userId).select('-passwordHash').lean();
    if (!user) {
      throw new Error("Authenticated identity signature no longer correlates with a valid user.");
    }

    // 3. Compile related multi-tenant context details if they exist
    const membership = await ctx.MembershipModel.findOne({ userId: user._id }).lean();
    let organization = null;
    
    if (membership) {
      organization = await ctx.OrgModel.findById(membership.orgId).lean();
    }

    return {
      authenticated: true,
      user: { id: user._id, email: user.email, name: user.name },
      organization: organization ? { id: organization._id, name: organization.name, role: membership.role } : null
    };

  } catch (error: any) {
    // Gracefully normalize JWT verification exceptions (expired/tampered tokens)
    return {
      authenticated: false,
      error: error.message || "Session verification evaluation fault.",
      user: null,
      organization: null
    };
  }
}