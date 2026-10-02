import { NextResponse } from "next/server";
import { requireAdminApiSession, isResponse, requireSameOrigin } from "@/lib/api-helpers";
import { updateFoodExchangeItem } from "@/lib/calorie/foodsRepo";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const session = await requireAdminApiSession();
  if (isResponse(session)) return session;

  const { key } = await params;
  let body: { labelTh?: string; facCho?: number; facPro?: number; facFat?: number; facKcal?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const numFields = [body.facCho, body.facPro, body.facFat, body.facKcal];
  if (numFields.some((n) => n !== undefined && (typeof n !== "number" || !Number.isFinite(n) || n < 0))) {
    return NextResponse.json({ error: "ค่า fac ต้องเป็นตัวเลขไม่ติดลบ" }, { status: 400 });
  }
  const labelTh = body.labelTh?.trim();
  if (body.labelTh !== undefined && !labelTh) {
    return NextResponse.json({ error: "ชื่อรายการห้ามว่าง" }, { status: 400 });
  }

  await updateFoodExchangeItem(key, {
    labelTh,
    facCho: body.facCho,
    facPro: body.facPro,
    facFat: body.facFat,
    facKcal: body.facKcal,
  });
  return NextResponse.json({ ok: true });
}
