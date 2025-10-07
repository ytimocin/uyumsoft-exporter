import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchGoogleUser } from "@/lib/google";
import { verifyStateToken } from "@/lib/oauthState";
import {
  sessionCookieOptions,
  createSessionToken,
  SESSION_COOKIE,
  Session,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new NextResponse(`Authorization failed: ${error}`, { status: 400 });
  }

  if (!code || !state) {
    return new NextResponse("Missing code or state", { status: 400 });
  }

  if (!verifyStateToken(state)) {
    return new NextResponse("Invalid OAuth state", { status: 400 });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const user = await fetchGoogleUser(tokens.accessToken);

    const session: Session = {
      id: user.id,
      email: user.email,
      name: user.name,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    };

    const sessionToken = await createSessionToken(session);
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);
    return response;
  } catch (err) {
    console.error("OAuth callback failure", err);
    return new NextResponse("Failed to complete authentication", {
      status: 500,
    });
  }
}
