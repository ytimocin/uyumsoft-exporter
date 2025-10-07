import { getEnv } from "@/lib/env";
import { GOOGLE_OAUTH_SCOPES } from "@/lib/constants";
import type { Session } from "@/lib/auth";

export type GoogleTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  tokenType: string;
};

export type GoogleUser = {
  id: string;
  email: string;
  name: string;
};

export type SpreadsheetSummary = {
  id: string;
  name: string;
  modifiedTime?: string;
};

export function getSpreadsheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

function getClientCredentials() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    getEnv();
  return { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI };
}

export function buildAuthUrl(state: string): string {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleTokens> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    getClientCredentials();
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to exchange code: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
  };

  if (!data.refresh_token) {
    throw new Error("Google did not return a refresh token");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<GoogleTokens> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getClientCredentials();
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken,
    expiresIn: data.expires_in,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

export async function fetchGoogleUser(
  accessToken: string,
): Promise<GoogleUser> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch user info: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    id: string;
    email: string;
    name: string;
  };

  return {
    id: data.id,
    email: data.email,
    name: data.name,
  };
}

export async function ensureAccessToken(session: Session): Promise<Session> {
  const now = Date.now();
  const expiresSoon = session.expiresAt - now < 60_000;

  if (!expiresSoon) {
    return session;
  }

  const refreshed = await refreshAccessToken(session.refreshToken);
  return {
    ...session,
    accessToken: refreshed.accessToken,
    expiresAt: Date.now() + refreshed.expiresIn * 1000,
  };
}

async function authorizedFetch(
  accessToken: string,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (
    !headers.has("Content-Type") &&
    init?.body &&
    !(init?.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}

export async function listSpreadsheets(
  accessToken: string,
): Promise<SpreadsheetSummary[]> {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set(
    "q",
    "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
  );
  url.searchParams.set("fields", "files(id,name,modifiedTime)");
  url.searchParams.set("orderBy", "modifiedTime desc");
  url.searchParams.set("pageSize", "50");

  const response = await authorizedFetch(accessToken, url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to list spreadsheets: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    files: Array<{ id: string; name: string; modifiedTime?: string }>;
  };

  return data.files ?? [];
}

export async function createSpreadsheet(
  accessToken: string,
  title: string,
): Promise<SpreadsheetSummary> {
  const response = await authorizedFetch(
    accessToken,
    "https://sheets.googleapis.com/v4/spreadsheets",
    {
      method: "POST",
      body: JSON.stringify({ properties: { title } }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create spreadsheet: ${response.status} ${text}`);
  }
  const data = (await response.json()) as {
    spreadsheetId: string;
    properties: { title: string };
  };
  return { id: data.spreadsheetId, name: data.properties.title };
}

export async function overwriteSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  values: string[][],
): Promise<void> {
  const range = `${sheetName}!A1`;
  const encodedSheet = encodeURIComponent(sheetName);

  const clearResponse = await authorizedFetch(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheet}:clear`,
    {
      method: "POST",
    },
  );

  if (!clearResponse.ok) {
    const text = await clearResponse.text();
    throw new Error(`Failed to clear sheet: ${clearResponse.status} ${text}`);
  }

  const updateResponse = await authorizedFetch(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values }),
    },
  );

  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    throw new Error(`Failed to update sheet: ${updateResponse.status} ${text}`);
  }
}
