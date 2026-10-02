import { NextResponse } from "next/server";
import { requireApiSession, isResponse } from "@/lib/api-helpers";
import { getHISProvider } from "@/lib/his/provider";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ patients: [] });

  try {
    const patients = await getHISProvider().searchPatients(q);
    return NextResponse.json({ patients });
  } catch (err) {
    console.error("[patients] HIS error:", err);
    return NextResponse.json(
      { error: "เชื่อมต่อระบบ HIS ไม่ได้ กรุณาลองใหม่" },
      { status: 503 },
    );
  }
}
