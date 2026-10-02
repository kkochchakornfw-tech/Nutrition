import { NextResponse } from "next/server";
import { requireApiSession, isResponse } from "@/lib/api-helpers";
import { SGA_CRITERIA } from "@/lib/sga/data";
import { listAssessors } from "@/lib/sga/assessors";

export async function GET() {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  return NextResponse.json({
    criteria: SGA_CRITERIA,
    assessors: await listAssessors(),
  });
}
