import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/lib/env";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export const SESSION_COOKIE = "session";
const ALGORITHM = "HS256";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

async function getSecret() {
  const { SESSION_SECRET } = getEnv();
  return new TextEncoder().encode(SESSION_SECRET);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};

export async function createSessionToken(user: SessionUser): Promise<string> {
  const secret = await getSecret();
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const store = cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export function clearSessionCookie(): void {
  const store = cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  try {
    const secret = await getSecret();
    const result = await jwtVerify(token, secret);
    return {
      id: result.payload.sub as string,
      email: result.payload.email as string,
      name: result.payload.name as string,
    };
  } catch (error) {
    console.error("Failed to verify session", error);
    return null;
  }
}

export async function requireSession(
  request: NextRequest,
): Promise<SessionUser> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }
  try {
    const secret = await getSecret();
    const result = await jwtVerify(token, secret);
    return {
      id: result.payload.sub as string,
      email: result.payload.email as string,
      name: result.payload.name as string,
    };
  } catch (error) {
    console.error("Session verification failed", error);
    throw new Response("Unauthorized", { status: 401 });
  }
}

export function redirectToLogin(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
