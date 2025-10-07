import { NextRequest, NextResponse } from "next/server";
import {
  ensureAccessToken,
  createSpreadsheet,
  listSpreadsheets,
} from "@/lib/google";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSession(request);
    const token = await ensureAccessToken(user.id);
    const sheets = await listSpreadsheets(token.accessToken);
    return NextResponse.json({ sheets });
  } catch (error) {
    console.error("Failed to list sheets", error);
    if (error instanceof Response) {
      return error;
    }
    return new NextResponse("Failed to list sheets", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request);
    const body = await request.json();
    const title = (body?.title as string | undefined)?.trim();
    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }
    const token = await ensureAccessToken(user.id);
    const sheet = await createSpreadsheet(token.accessToken, title);
    return NextResponse.json(sheet, { status: 201 });
  } catch (error) {
    console.error("Failed to create sheet", error);
    if (error instanceof Response) {
      return error;
    }
    return new NextResponse("Failed to create sheet", { status: 500 });
  }
}
