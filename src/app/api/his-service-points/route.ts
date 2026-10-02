import { NextRequest, NextResponse } from "next/server";
import { hisPool } from "@/lib/his/his-db";

export const runtime = "nodejs";

// GET /api/his-service-points?q=rehab
// คืนรายการจุดบริการ (base_service_point) สำหรับ dropdown เลือก location
// default กรองเฉพาะที่ชื่อมี "rehab" ถ้าไม่ส่ง q
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "Nutrition";
  // q รับได้หลายคำคั่นด้วยคอมมา (เช่น "rehab,physio") ต้องแยกก่อน —
  // ถ้าส่งทั้งก้อนเข้า ILIKE จะกลายเป็นหาสตริง "rehab,physio" ตรงๆ แล้วไม่เจออะไรเลย
  const terms = q
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `%${t}%`);
  if (terms.length === 0) terms.push("%rehab%");

  try {
    const { rows } = await hisPool.query(
      `SELECT base_service_point_id AS id, TRIM(description) AS name
         FROM base_service_point
        WHERE description ILIKE ANY($1::text[])
        ORDER BY description
        LIMIT 50`,
      [terms],
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[his-service-points] error:", err);
    const msg = err instanceof Error ? err.message : "query failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
