import { NextResponse } from "next/server";
import { requireApiSession, isResponse, requireSameOrigin } from "@/lib/api-helpers";
import { safeErrorMessage } from "@/lib/errors";
import { ensureUserRow } from "@/lib/db";
import { getCalculationById, updateCalculation } from "@/lib/calorie/store";
import { diffCalorie, logAudit } from "@/lib/audit";
import { listAssessors } from "@/lib/sga/assessors";
import type { CreateCalorieInput } from "@/lib/calorie/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  const { id } = await params;
  const calculation = await getCalculationById(Number(id));
  if (!calculation) {
    return NextResponse.json({ error: "ไม่พบประวัติการคำนวณ" }, { status: 404 });
  }
  return NextResponse.json({ calculation });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const session = await requireApiSession();
  if (isResponse(session)) return session;

  let body: CreateCalorieInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!body.hn?.trim() || !body.patientNameSnapshot?.trim() || !body.inputs) {
    return NextResponse.json({ error: "กรอกข้อมูลที่จำเป็นไม่ครบ" }, { status: 400 });
  }

  const performedBy = body.performedBy?.trim();
  if (!performedBy) {
    return NextResponse.json({ error: "กรุณาเลือกผู้คำนวณ (Dietitian)" }, { status: 400 });
  }
  const assessors = await listAssessors();
  if (!assessors.some((a) => a.fullName === performedBy)) {
    return NextResponse.json({ error: "ผู้คำนวณไม่อยู่ในรายชื่อนักกำหนดอาหาร" }, { status: 400 });
  }

  const { id } = await params;
  try {
    await ensureUserRow(session);
    const before = await getCalculationById(Number(id));
    const calculation = await updateCalculation(Number(id), {
      hn: body.hn.trim(),
      patientNameSnapshot: body.patientNameSnapshot.trim(),
      note: body.note?.trim() || null,
      inputs: body.inputs,
      foods: Array.isArray(body.foods) ? body.foods : [],
      performedBy,
    });
    if (!calculation) {
      return NextResponse.json({ error: "ไม่พบประวัติการคำนวณ" }, { status: 404 });
    }
    if (before) {
      await logAudit({ kind: "calorie", recordId: calculation.id, hn: calculation.hn, user: session, changes: diffCalorie(before, calculation) });
    }
    return NextResponse.json({ calculation });
  } catch (err) {
    const { message, status } = safeErrorMessage(err, "บันทึกไม่สำเร็จ");
    return NextResponse.json({ error: message }, { status });
  }
}
