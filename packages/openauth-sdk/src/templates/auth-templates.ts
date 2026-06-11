// Replace API_CATCHALL_TEMPLATE inside packages/openauth-sdk/src/templates/auth-templates.ts

export const API_CATCHALL_TEMPLATE = `import { NextRequest, NextResponse } from 'next/server';
import { OpenAuthEngine } from '@openauth/nextjs';
import { getLocalConfig } from '@openauth/nextjs';
import { connectToDatabase } from '@/lib/db';
import { UserModel, OrgModel, MembershipModel } from '@/models/openauth';

const engine = new OpenAuthEngine({ UserModel, OrgModel, MembershipModel });

export async function GET() {
  await connectToDatabase();
  const config = await getLocalConfig();
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
  await connectToDatabase();
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
    return NextResponse.json({ error: \`Action '\${action}' path not found.\` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Engine execution fault.' }, { status: 400 });
  }
}
`;

export const AUTH_FORM_TEMPLATE = `'use client';

import React, { useEffect, useState } from 'react';

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/api/auth/signup')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="w-full max-w-md mx-auto p-8 text-center text-sm font-mono text-zinc-400">Loading authentication interface...</div>;
  }

  if (mode === 'signup' && config && !config.allowUserSignups) {
    return (
      <div className="w-full max-w-[440px] mx-auto bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Registration Closed</h2>
        <p className="text-sm text-zinc-500 mt-2">New account creation has been restricted by system settings.</p>
      </div>
    );
  }

  const hasOAuth = config?.providers && (config.providers.google?.enabled || config.providers.github?.enabled);

  return (
    <div className="w-full max-w-[440px] mx-auto bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm font-sans text-zinc-900">
      {hasOAuth && (
        <div className="flex flex-col gap-3 mb-6">
          {config.providers.google?.enabled && (
            <button type="button" className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 active:bg-zinc-100 cursor-pointer">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.39 3.66 1.48 7.56l3.8 2.95C6.2 7.56 8.9 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.41-4.94 3.41-8.6z"/><path fill="#FBBC05" d="M5.28 14.51c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 6.98C.67 8.59.18 10.39.18 12.3c0 1.91.49 3.71 1.3 5.32l3.8-3.11z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.11-4.26 1.11-3.1 0-5.8-2.52-6.72-5.47l-3.8 2.95C3.39 20.34 7.35 23 12 23z"/></svg>
              <span>Continue with Google</span>
            </button>
          )}
          {config.providers.github?.enabled && (
            <button type="button" className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 active:bg-zinc-100 cursor-pointer">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z"/></svg>
              <span>Continue with GitHub</span>
            </button>
          )}
          <hr className="border-t border-zinc-200 my-2" />
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-900 block">Email</label>
          <input id="email" type="email" required className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-900 block">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} required className="w-full h-12 pl-4 pr-12 rounded-xl border border-zinc-200 bg-white text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer">
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>
        </div>

        <div className="pt-2 space-y-4 text-center">
          <button type="submit" className="w-full h-12 bg-[#0066fe] hover:bg-[#0055d4] text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 cursor-pointer">
            {mode === 'signin' ? 'Log in' : 'Sign up'}
          </button>
          <p className="text-sm text-zinc-500">
            {mode === 'signin' ? (
              <>Don't have an account? <a href="/sign-up" className="text-zinc-900 font-medium hover:underline">Sign up</a></>
            ) : (
              <>Already have an account? <a href="/sign-in" className="text-zinc-900 font-medium hover:underline">Log in</a></>
            )}
          </p>
        </div>
      </form>
    </div>
  );
}
`;

export const SIGN_IN_PAGE_TEMPLATE = `import { AuthForm } from '@/components/openauth/auth-form';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <AuthForm mode="signin" />
    </div>
  );
}
`;

export const SIGN_UP_PAGE_TEMPLATE = `import { AuthForm } from '@/components/openauth/auth-form';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <AuthForm mode="signup" />
    </div>
  );
}
`;