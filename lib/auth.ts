import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/lib/env";

export type Session = {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type SessionUser = Pick<Session, "id" | "email" | "name">;

export function toSessionUser(session: Session): SessionUser {
  return {
    id: session.id,
    email: session.email,
    name: session.name,
  };
}

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

export async function createSessionToken(session: Session): Promise<string> {
  const secret = await getSecret();
  return new SignJWT({
    sub: session.id,
    email: session.email,
    name: session.name,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

export async function setSessionCookie(session: Session): Promise<void> {
  const token = await createSessionToken(session);
  const store = cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export function clearSessionCookie(): void {
  const store = cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
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
      accessToken: result.payload.accessToken as string,
      refreshToken: result.payload.refreshToken as string,
      expiresAt: Number(result.payload.expiresAt),
    };
  } catch (error) {
    console.error("Failed to verify session", error);
    return null;
  }
}

export async function requireSession(request: NextRequest): Promise<Session> {
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
      accessToken: result.payload.accessToken as string,
      refreshToken: result.payload.refreshToken as string,
      expiresAt: Number(result.payload.expiresAt),
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
