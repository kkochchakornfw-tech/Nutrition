import { NextResponse } from "next/server";
import { requireApiSession, isResponse, requireSameOrigin } from "@/lib/api-helpers";
import { safeErrorMessage } from "@/lib/errors";
import { ensureUserRow } from "@/lib/db";
import { getMisAssessmentById, updateMisAssessment } from "@/lib/mis/store";
import { diffMis, logAudit } from "@/lib/audit";
import type { CreateMisAssessmentInput } from "@/lib/mis/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  const { id } = await params;
  const assessment = await getMisAssessmentById(Number(id));
  if (!assessment) {
    return NextResponse.json({ error: "ไม่พบประวัติการประเมิน" }, { status: 404 });
  }

  return NextResponse.json({ assessment });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const session = await requireApiSession();
  if (isResponse(session)) return session;

  let body: Omit<CreateMisAssessmentInput, "createdByUserId">;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!body.hn || !body.assessedAt || !body.assessorName) {
    return NextResponse.json({ error: "กรอกข้อมูลที่จำเป็นไม่ครบ" }, { status: 400 });
  }
  if (!body.answers?.length) {
    return NextResponse.json({ error: "กรุณาเลือกคำตอบให้ครบทุกหัวข้อ" }, { status: 400 });
  }

  const { id } = await params;
  try {
    await ensureUserRow(session);
    const before = await getMisAssessmentById(Number(id));
    const assessment = await updateMisAssessment(Number(id), { ...body, createdByUserId: session.id });
    if (!assessment) {
      return NextResponse.json({ error: "ไม่พบประวัติการประเมิน" }, { status: 404 });
    }
    if (before) {
      await logAudit({ kind: "mis", recordId: assessment.id, hn: assessment.hn, user: session, changes: diffMis(before, assessment) });
    }
    return NextResponse.json({ assessment });
  } catch (err) {
    const { message, status } = safeErrorMessage(err, "บันทึกไม่สำเร็จ");
    return NextResponse.json({ error: message }, { status });
  }
}
