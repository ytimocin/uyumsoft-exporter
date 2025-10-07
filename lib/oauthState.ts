import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "crypto";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_SECONDS = 600; // 10 minutes

export function issueStateToken(): string {
  const token = randomBytes(24).toString("hex");
  const store = cookies();
  store.set(STATE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });
  return token;
}

export function verifyStateToken(state: string | null): boolean {
  if (!state) {
    return false;
  }
  const store = cookies();
  const stored = store.get(STATE_COOKIE)?.value;
  if (!stored) {
    return false;
  }
  const expected = Buffer.from(stored, "utf-8");
  const provided = Buffer.from(state, "utf-8");
  const valid =
    expected.length === provided.length && timingSafeEqual(expected, provided);
  if (valid) {
    store.delete(STATE_COOKIE);
  }
  return valid;
}
