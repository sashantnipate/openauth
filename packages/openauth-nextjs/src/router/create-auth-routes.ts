import { NextRequest, NextResponse } from "next/server";
import { OpenAuth } from "@openauth/sdk";

export function createAuthRoutes(auth: OpenAuth, cookieName = "openauth.session") {
  const isProd = process.env.NODE_ENV === "production";

  const setSessionCookie = (res: NextResponse, token: string) => {
    res.cookies.set({
      name: cookieName,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 Days
    });
  };

  const clearSessionCookie = (res: NextResponse) => {
    res.cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  };

  const handleRoute = async (
    request: NextRequest,
    context: { params: Promise<{ openauth: string[] }> }
  ) => {
    const { openauth } = await context.params;
    const action = openauth?.[0];
    const method = request.method;

    // Dynamically query strategy from the SDK configuration profile (default to cookie)
    const strategy = (auth.config.auth as any).strategy || "cookie";

    try {
      // 1. POST /api/auth/signup
      if (method === "POST" && action === "signup") {
        const body = await request.json();
        const result = await auth.signup(body);
        
        if (strategy === "cookie") {
          const res = NextResponse.json({ user: result.user, organization: result.organization });
          setSessionCookie(res, result.token);
          return res;
        }
        
        return NextResponse.json({ user: result.user, organization: result.organization, token: result.token });
      }

      // 2. POST /api/auth/signin
      if (method === "POST" && action === "signin") {
        const body = await request.json();
        const result = await auth.signin(body);
        
        if (strategy === "cookie") {
          const res = NextResponse.json({ user: result.user, organization: result.organization });
          setSessionCookie(res, result.token);
          return res;
        }
        
        return NextResponse.json({ user: result.user, organization: result.organization, token: result.token });
      }

      // 3. POST /api/auth/logout
      if (method === "POST" && action === "logout") {
        const res = NextResponse.json({ success: true, message: "Logged out successfully." });
        if (strategy === "cookie") {
          clearSessionCookie(res);
        }
        return res;
      }

      return NextResponse.json({ error: "Auth action endpoint not found." }, { status: 404 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Authentication routing failure." }, { status: 400 });
    }
  };

  return {
    GET: handleRoute,
    POST: handleRoute,
  };
}