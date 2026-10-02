import { NextResponse } from "next/server";
import { requireApiSession, isResponse } from "@/lib/api-helpers";
import { getCalculationById } from "@/lib/calorie/store";

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
