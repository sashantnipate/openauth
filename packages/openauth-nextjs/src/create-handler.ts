// packages/openauth-nextjs/src/create-handler.ts
import { NextRequest, NextResponse } from "next/server";
import { OpenAuth } from "@openauth/sdk";

interface HandlerConfig {
  auth: OpenAuth;
  cookieName?: string;
  secure?: boolean;
}

export function createOpenAuthHandler({
  auth,
  cookieName = "openauth.session",
  secure = process.env.NODE_ENV === "production"
}: HandlerConfig) {

  // Centralized helper to set the secure session cookie
  const setSessionCookie = (response: NextResponse, token: string) => {
    response.cookies.set({
      name: cookieName,
      value: token,
      httpOnly: true,
      secure: secure,
      sameSite: "lax",
      path: "/",
      // Match token duration or default to 1 day
      maxAge: 60 * 60 * 24 
    });
  };

  // Centralized helper to clear the session cookie
  const clearSessionCookie = (response: NextResponse) => {
    response.cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      secure: secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
  };

  async function handleRoute(
    request: NextRequest,
    context: { params: Promise<{ openauth: string[] }> }
  ) {
    const { openauth } = await context.params;
    const action = openauth?.[0];
    const method = request.method;

    try {
      // ------------------------------------------------------------------------
      // GET /api/auth/session -> Read cookie & check signature
      // ------------------------------------------------------------------------
      if (method === "GET" && action === "session") {
        const token = request.cookies.get(cookieName)?.value;
        if (!token) {
          return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
        }

        const verification = await auth.verifySession(token);
        if (!verification.authenticated) {
          const failResponse = NextResponse.json(verification, { status: 401 });
          clearSessionCookie(failResponse);
          return failResponse;
        }

        return NextResponse.json(verification);
      }

      // ------------------------------------------------------------------------
      // POST /api/auth/signup -> Register user & set session cookie
      // ------------------------------------------------------------------------
      if (method === "POST" && action === "signup") {
        const body = await request.json();
        const result = await auth.signup(body);
        
        const response = NextResponse.json({ user: result.user, organization: result.organization });
        setSessionCookie(response, result.token);
        return response;
      }

      // ------------------------------------------------------------------------
      // POST /api/auth/signin -> Validate credentials & set session cookie
      // ------------------------------------------------------------------------
      if (method === "POST" && action === "signin") {
        const body = await request.json();
        const result = await auth.signin(body);

        const response = NextResponse.json({ user: result.user, organization: result.organization });
        setSessionCookie(response, result.token);
        return response;
      }

      // ------------------------------------------------------------------------
      // POST /api/auth/logout -> Clear core instance & drop cookie wrapper
      // ------------------------------------------------------------------------
      if (method === "POST" && action === "logout") {
        const token = request.cookies.get(cookieName)?.value;
        await auth.logout(token);

        const response = NextResponse.json({ success: true, message: "Logged out successfully" });
        clearSessionCookie(response);
        return response;
      }

      return NextResponse.json({ error: `Path not found.` }, { status: 404 });

    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Internal authentication endpoint failure." },
        { status: 400 }
      );
    }
  }

  return {
    GET: handleRoute,
    POST: handleRoute
  };
}