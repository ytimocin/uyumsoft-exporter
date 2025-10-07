import { NextRequest, NextResponse } from "next/server";
import { requireSession, toSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    return NextResponse.json({ user: toSessionUser(session) });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return new NextResponse("Unauthorized", { status: 401 });
  }
}
