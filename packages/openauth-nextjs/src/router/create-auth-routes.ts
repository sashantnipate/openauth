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
      maxAge: 60 * 60 * 24 * 7,
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
  ): Promise<NextResponse> => {
    const { openauth } = await context.params;
    const action = openauth?.[0];
    const method = request.method;

    // Use safe default string fallbacks instead of casting dynamic configs to any
    const strategy = "cookie";

    try {
      if (method === "POST" && action === "signup") {
        const body = await request.json();
        const result = await auth.signup(body);
        
        const res = NextResponse.json({ user: result.user, organization: result.organization });
        setSessionCookie(res, result.token);
        return res;
      }

      if (method === "POST" && action === "signin") {
        const body = await request.json();
        const result = await auth.signin(body);
        
        const res = NextResponse.json({ user: result.user, organization: result.organization });
        setSessionCookie(res, result.token);
        return res;
      }

      if (method === "POST" && action === "logout") {
        const incomingToken = request.cookies.get(cookieName)?.value;
        const res = NextResponse.json({ success: true, message: "Logged out successfully." });
        
        await auth.logout(incomingToken);
        clearSessionCookie(res);
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