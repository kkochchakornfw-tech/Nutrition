import { NextRequest, NextResponse } from "next/server";
import { requireApiSession, isResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";

const IMAGE_BASE =
  process.env.HIS_IMAGE_BASE?.replace(/\/+$/, "") ||
  "http://10.161.13.13:8080/imed-image-folder/patient/patientImage.jsp";

export async function GET(req: NextRequest) {
  // [1] เช็ค session ก่อน — เป็นรูประบุตัวผู้ป่วย
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  const hn = req.nextUrl.searchParams.get("hn")?.trim() || "";
  if (!/^[0-9-]{3,20}$/.test(hn)) {
    return NextResponse.json({ error: "hn ไม่ถูกต้อง" }, { status: 400 });
  }

  const url = `${IMAGE_BASE}?hn=${encodeURIComponent(hn)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const upstream = await fetch(url, { signal: controller.signal });
    if (!upstream.ok) {
      return NextResponse.json({ error: "ไม่พบรูป" }, { status: 404 });
    }

    // [2] JSP บางตัวตอบ 200 เป็นหน้า HTML ตอนไม่มีรูป → ต้องเป็น image/* เท่านั้น
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "ไม่พบรูป" }, { status: 404 });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // [3] private: ห้าม proxy/shared cache เก็บรูปผู้ป่วย
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[patient-image] error:", err);
    return NextResponse.json({ error: "โหลดรูปไม่สำเร็จ" }, { status: 404 });
  } finally {
    clearTimeout(timer);
  }
}
