import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/google";
import { issueStateToken } from "@/lib/oauthState";

export async function GET() {
  const state = issueStateToken();
  const url = buildAuthUrl(state);
  return NextResponse.redirect(url);
}
