import { NextResponse } from "next/server";
import { requireApiSession, isResponse } from "@/lib/api-helpers";
import { getHISProvider } from "@/lib/his/provider";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hn: string }> },
) {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  const { hn } = await params;

  try {
    const patient = await getHISProvider().getPatientByHN(hn);
    if (!patient) {
      return NextResponse.json(
        { error: `ไม่พบข้อมูลผู้ป่วย HN ${hn} ใน HIS` },
        { status: 404 },
      );
    }
    return NextResponse.json({ patient });
  } catch (err) {
    console.error("[patients/hn] HIS error:", err);
    return NextResponse.json(
      { error: "เชื่อมต่อระบบ HIS ไม่ได้ กรุณาลองใหม่" },
      { status: 503 },
    );
  }
}
