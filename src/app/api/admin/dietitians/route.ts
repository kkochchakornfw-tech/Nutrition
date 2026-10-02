import { NextResponse } from "next/server";
import { requireAdminApiSession, isResponse, requireSameOrigin } from "@/lib/api-helpers";
import { createDietitian, listAllDietitians } from "@/lib/sga/assessors";

export async function GET() {
  const session = await requireAdminApiSession();
  if (isResponse(session)) return session;

  return NextResponse.json({ dietitians: await listAllDietitians() });
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const session = await requireAdminApiSession();
  if (isResponse(session)) return session;

  let body: { fullName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const fullName = body.fullName?.trim();
  if (!fullName) {
    return NextResponse.json({ error: "กรุณากรอกชื่อผู้ประเมิน" }, { status: 400 });
  }

  try {
    const dietitian = await createDietitian(fullName);
    return NextResponse.json({ dietitian }, { status: 201 });
  } catch (err) {
    const duplicate = err instanceof Error && /Duplicate entry/.test(err.message);
    return NextResponse.json(
      { error: duplicate ? "มีชื่อนี้อยู่แล้ว" : "บันทึกไม่สำเร็จ" },
      { status: duplicate ? 409 : 500 }
    );
  }
}
