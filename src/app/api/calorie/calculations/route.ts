import { NextResponse } from "next/server";
import {
  requireApiSession,
  isResponse,
  requireSameOrigin,
} from "@/lib/api-helpers";
import { safeErrorMessage } from "@/lib/errors";
import { createCalculation, listCalculationsByHn } from "@/lib/calorie/store";
import { ensureUserRow } from "@/lib/db";
import type { CreateCalorieInput } from "@/lib/calorie/types";
import { listAssessors } from "@/lib/sga/assessors";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  const hn = new URL(request.url).searchParams.get("hn");
  if (!hn) {
    return NextResponse.json({ error: "ต้องระบุ HN" }, { status: 400 });
  }
  return NextResponse.json({ calculations: await listCalculationsByHn(hn) });
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const session = await requireApiSession();
  if (isResponse(session)) return session;

  let body: CreateCalorieInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (!body.hn?.trim() || !body.patientNameSnapshot?.trim() || !body.inputs) {
    return NextResponse.json(
      { error: "กรอกข้อมูลที่จำเป็นไม่ครบ" },
      { status: 400 },
    );
  }

  const performedBy = body.performedBy?.trim();
  if (!performedBy) {
    return NextResponse.json(
      { error: "กรุณาเลือกผู้คำนวณ (Dietitian)" },
      { status: 400 },
    );
  }
  const assessors = await listAssessors();
  if (!assessors.some((a) => a.fullName === performedBy)) {
    return NextResponse.json(
      { error: "ผู้คำนวณไม่อยู่ในรายชื่อนักกำหนดอาหาร" },
      { status: 400 },
    );
  }
  try {
    await ensureUserRow(session);
    const calculation = await createCalculation({
      hn: body.hn.trim(),
      patientNameSnapshot: body.patientNameSnapshot.trim(),
      note: body.note?.trim() || null,
      inputs: body.inputs,
      foods: Array.isArray(body.foods) ? body.foods : [],
      performedBy, // ← แทน session.fullName
      createdByUserId: session.id,
    });
    return NextResponse.json({ calculation }, { status: 201 });
  } catch (err) {
    const { message, status } = safeErrorMessage(err, "บันทึกไม่สำเร็จ");
    return NextResponse.json({ error: message }, { status });
  }
}
