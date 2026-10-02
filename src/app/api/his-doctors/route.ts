import { NextRequest, NextResponse } from "next/server";
import { hisPool } from "@/lib/his/his-db";

export const runtime = "nodejs";

// GET /api/his-doctors?visit_id=<visit_id>   ← แพทย์ใน visit นั้น (ใช้ใน modal)
// GET /api/his-doctors?q=<คำค้น>             ← ค้นทั้งโรงพยาบาล (ทางสำรอง)
//
// care_provider_code (เช่น "67ORT10") คือช่องที่ 4 ส่วนหน้าของ QR —
// เป็นรหัสของ "แพทย์ที่ระบุในเอกสาร" ไม่ใช่รหัสของ ward ที่คนไข้นอน
// เอาเฉพาะคนที่มี care_provider_code จริง (คนที่ไม่มีใส่ใน QR ไม่ได้)
//
// คืน spid ของแต่ละคนมาด้วย — จุดบริการที่คู่กับแพทย์คนนั้น เอาไปตั้งเป็น
// ค่าเริ่มต้นของช่อง "จุดบริการที่สั่งพิมพ์" ใน modal
//
// ── ทำไมต้องกรองตาม visit ──
// แพทย์ที่ควรขึ้นใน QR คือแพทย์ของ visit นั้นจริง ๆ ไม่ใช่รายชื่อทั้ง รพ.
// ให้ผู้ใช้เลื่อนหา ตรวจกับเคสจริงแล้ว visit ที่ออกเอกสารมี "นพ. ศุษณะ
// (67ORT10)" อยู่ในลิสต์ ตรงกับ QR ของเอกสารพอดี
//
// แหล่งข้อมูลมี 2 ที่ ต้องรวมกัน:
//   attending_physician      → ผูกกับ visit_id (ใช้ได้ทั้ง OPD/IPD)
//   ipd_attending_physician  → ผูกกับ admit_id (เฉพาะเคสที่ admit)
// รวมด้วย UNION ALL แล้วค่อย GROUP BY code — ถ้า DISTINCT ก่อน union
// คนเดียวกันที่มีหลาย priority จะโผล่ซ้ำ
export async function GET(req: NextRequest) {
  const visitId = (req.nextUrl.searchParams.get("visit_id") ?? "").trim();
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  try {
    if (visitId) {
      const { rows } = await hisPool.query(
        `WITH src AS (
           SELECT TRIM(e.care_provider_code) AS code,
                  TRIM(COALESCE(e.prename, '') || ' ' ||
                       COALESCE(e.firstname, '') || ' ' ||
                       COALESCE(e.lastname, '')) AS name,
                  ap.priority AS priority
             FROM attending_physician ap
             JOIN employee e ON e.employee_id = ap.employee_id
            WHERE ap.visit_id = $1
              AND COALESCE(TRIM(e.care_provider_code), '') <> ''
           UNION ALL
           SELECT TRIM(e.care_provider_code),
                  TRIM(COALESCE(e.prename, '') || ' ' ||
                       COALESCE(e.firstname, '') || ' ' ||
                       COALESCE(e.lastname, '')),
                  iap.priority
             FROM admit a
             JOIN ipd_attending_physician iap ON iap.admit_id = a.admit_id
             JOIN employee e ON e.employee_id = iap.employee_id
            WHERE a.visit_id = $1
              AND iap.is_current = '1'
              AND COALESCE(TRIM(e.care_provider_code), '') <> ''
         )
         SELECT g.code, MIN(g.name) AS name, MIN(g.priority) AS priority,
                -- ── จุดบริการที่คู่กับแพทย์คนนี้ ──
                -- รหัสแพทย์กับรหัสจุด "After seen DR" ใช้ prefix เดียวกัน
                -- (67ORT40 -> 67ORTDRA, 67ENT02 -> 67ENTDRA) ซึ่งตรงกับ
                -- จุดที่ออกเอกสารจริง ใช้ prefix ไม่ใช่ department เพราะ
                -- หมอ Ortho กับ Surgery อยู่แผนกเดียวกัน (3020) แยกไม่ได้
                dra.base_service_point_id AS spid,
                TRIM(dra.description)     AS spid_name
           FROM src g
           LEFT JOIN base_service_point dra
                  ON dra.base_service_point_id =
                     substring(g.code from '^([0-9]+[A-Za-z]+)') || 'DRA'
                 AND dra.active = '1'
          GROUP BY g.code, dra.base_service_point_id, dra.description
          ORDER BY MIN(g.priority), MIN(g.name)
          LIMIT 50`,
        [visitId],
      );
      return NextResponse.json(
        rows.map(
          (r: {
            code: string;
            name: string;
            spid: string | null;
            spid_name: string | null;
          }) => ({
            code: r.code,
            // ชื่อจาก HIS มีช่องว่างซ้อน (เช่น "นพ.ก  ข") → ยุบให้เหลือช่องเดียว
            name: (r.name ?? "").replace(/\s+/g, " ").trim(),
            spid: r.spid ?? "",
            spidName: (r.spid_name ?? "").replace(/\s+/g, " ").trim(),
          }),
        ),
      );
    }

    // ── ทางสำรอง: ค้นทั้ง รพ. เผื่อ visit นั้นไม่มีแพทย์ผูกไว้ ──
    const like = `%${q}%`;
    const { rows } = await hisPool.query(
      `SELECT TRIM(e.care_provider_code) AS code,
              TRIM(COALESCE(e.prename, '') || ' ' ||
                   COALESCE(e.firstname, '') || ' ' ||
                   COALESCE(e.lastname, '')) AS name
         FROM employee e
        WHERE e.care_provider_code IS NOT NULL
          AND TRIM(e.care_provider_code) <> ''
          AND e.active = '1'
          AND ($1 = '' OR
               e.firstname ILIKE $2 OR
               e.lastname ILIKE $2 OR
               e.care_provider_code ILIKE $2 OR
               TRIM(COALESCE(e.prename, '') || ' ' ||
                    COALESCE(e.firstname, '') || ' ' ||
                    COALESCE(e.lastname, '')) ILIKE $2)
        ORDER BY e.firstname, e.lastname
        LIMIT 50`,
      [q, like],
    );

    return NextResponse.json(
      rows.map((r: { code: string; name: string }) => ({
        code: r.code,
        name: (r.name ?? "").replace(/\s+/g, " ").trim(),
      })),
    );
  } catch (err) {
    console.error("[his-doctors] error:", err);
    const msg = err instanceof Error ? err.message : "query failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
