import { NextResponse } from "next/server";
import { requireApiSession, isResponse, requireSameOrigin } from "@/lib/api-helpers";
import { safeErrorMessage } from "@/lib/errors";
import { createAssessment, listAssessmentsByHn } from "@/lib/sga/store";
import { ensureUserRow } from "@/lib/db";
import type { CreateAssessmentInput } from "@/lib/sga/types";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  const hn = new URL(request.url).searchParams.get("hn");
  if (!hn) {
    return NextResponse.json({ error: "ต้องระบุ HN" }, { status: 400 });
  }

  return NextResponse.json({ assessments: await listAssessmentsByHn(hn) });
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const session = await requireApiSession();
  if (isResponse(session)) return session;

  let body: Omit<CreateAssessmentInput, "createdByUserId">;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!body.hn || !body.visitNo || !body.assessedAt || !body.heightCm || !body.weightKg) {
    return NextResponse.json({ error: "กรอกข้อมูลที่จำเป็นไม่ครบ" }, { status: 400 });
  }
  if (!body.answers?.length) {
    return NextResponse.json({ error: "กรุณาเลือกคำตอบอย่างน้อย 1 หมวด" }, { status: 400 });
  }

  try {
    await ensureUserRow(session);
    const assessment = await createAssessment({ ...body, createdByUserId: session.id });
    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    const { message, status } = safeErrorMessage(err, "บันทึกไม่สำเร็จ");
    return NextResponse.json({ error: message }, { status });
  }
}
