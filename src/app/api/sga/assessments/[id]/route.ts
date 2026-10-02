import { NextResponse } from "next/server";
import { requireApiSession, isResponse } from "@/lib/api-helpers";
import { getAssessmentById } from "@/lib/sga/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  const { id } = await params;
  const assessment = await getAssessmentById(Number(id));
  if (!assessment) {
    return NextResponse.json({ error: "ไม่พบประวัติการประเมิน" }, { status: 404 });
  }

  return NextResponse.json({ assessment });
}
