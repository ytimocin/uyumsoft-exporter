export type StoredToken = {
  userId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

const TOKENS = new Map<string, StoredToken>();

export async function upsertToken(token: StoredToken): Promise<void> {
  TOKENS.set(token.userId, { ...token });
}

export async function getToken(userId: string): Promise<StoredToken | null> {
  const token = TOKENS.get(userId);
  return token ? { ...token } : null;
}

export async function deleteToken(userId: string): Promise<void> {
  TOKENS.delete(userId);
}

export function clearTokens(): void {
  TOKENS.clear();
}
