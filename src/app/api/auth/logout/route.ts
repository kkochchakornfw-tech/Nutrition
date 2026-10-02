import { NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/api-helpers";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
