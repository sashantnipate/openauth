import { NextRequest, NextResponse } from 'next/server';
import { OpenAuthEngine } from '@openauth/nextjs';
import { UserModel, OrgModel, MembershipModel } from '@/models/openauth';

const engine = new OpenAuthEngine({ UserModel, OrgModel, MembershipModel });

export async function POST(request: NextRequest, context: any) {
  // Gracefully handles parameters across varying versions of Next.js dynamic routing signatures
  const params = await context.params;
  const action = params.openauth?.[0];
  const body = await request.json();

  try {
    if (action === 'signup') {
      const payload = await engine.signup(body);
      return NextResponse.json(payload);
    }
    
    if (action === 'create-org') {
      const { userId, orgName } = body;
      const newOrg = await engine.createOrganization(userId, orgName);
      return NextResponse.json({ success: true, organization: newOrg });
    }

    return NextResponse.json({ error: `Action '${action}' path not found.` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Engine execution transaction fault.' }, { status: 400 });
  }
}
