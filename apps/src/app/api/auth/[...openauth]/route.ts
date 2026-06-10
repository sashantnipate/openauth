import { NextRequest, NextResponse } from 'next/server';
import { OpenAuthEngine } from '@openauth/nextjs';
import { getLocalConfig } from '@openauth/nextjs';
import { UserModel, OrgModel, MembershipModel } from '@/models/openauth';

const engine = new OpenAuthEngine({ UserModel, OrgModel, MembershipModel });

export async function GET() {
  const config = getLocalConfig();
  return NextResponse.json({
    allowUserSignups: config.settings?.allowUserSignups || false,
    organizationsEnabled: config.settings?.organizations?.enabled || false,
    providers: {
      github: { enabled: !!config.providers?.github?.enabled },
      google: { enabled: !!config.providers?.google?.enabled }
    }
  });
}

export async function POST(request: NextRequest, context: any) {
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
    return NextResponse.json({ error: err.message || 'Engine execution fault.' }, { status: 400 });
  }
}
