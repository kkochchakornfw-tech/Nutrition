import { NextResponse } from "next/server";
import { requireApiSession, isResponse } from "@/lib/api-helpers";
import { MIS_CRITERIA } from "@/lib/mis/data";
import { listAssessors } from "@/lib/sga/assessors";

export async function GET() {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  return NextResponse.json({
    criteria: MIS_CRITERIA,
    assessors: await listAssessors(),
  });
}
