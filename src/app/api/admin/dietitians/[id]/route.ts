import { NextResponse } from "next/server";
import { requireAdminApiSession, isResponse, requireSameOrigin } from "@/lib/api-helpers";
import { updateDietitian } from "@/lib/sga/assessors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const session = await requireAdminApiSession();
  if (isResponse(session)) return session;

  const { id } = await params;
  let body: { fullName?: string; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const fullName = body.fullName?.trim();
  if (body.fullName !== undefined && !fullName) {
    return NextResponse.json({ error: "ชื่อห้ามว่าง" }, { status: 400 });
  }

  try {
    await updateDietitian(Number(id), { fullName, isActive: body.isActive });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const duplicate = err instanceof Error && /Duplicate entry/.test(err.message);
    return NextResponse.json(
      { error: duplicate ? "มีชื่อนี้อยู่แล้ว" : "บันทึกไม่สำเร็จ" },
      { status: duplicate ? 409 : 500 }
    );
  }
}
