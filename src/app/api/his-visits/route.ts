import { NextRequest, NextResponse } from "next/server";
import { hisPool } from "@/lib/his/his-db";

export const runtime = "nodejs";

function reformatHn(hncode: string): string | null {
  if (!/^\d{2}-\d{2}-\d+$/.test(hncode)) return null;
  const yy = parseInt(hncode.substring(3, 5), 10);
  const serial = hncode.substring(6);
  return String((yy + 43) % 100) + serial.padStart(10, "0");
}

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("hn") ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!raw) return NextResponse.json({ error: "hn required" }, { status: 400 });

  try {
    // ── ขั้น 1: หา patient_id (เรียงจากวิธีที่ใช้ index ได้ก่อน) ──
    let patientId: string | null = null;

    // 1a. HN รูปแบบมีขีด ("67-16-025247") -> แปลงเป็นเลขภายใน
    //     ("590000025247") ซึ่งเป็นค่าที่อยู่ในคอลัมน์ hn ที่มี index
    const internalHn = reformatHn(raw);
    if (internalHn) {
      const { rows } = await hisPool.query(
        `SELECT patient_id FROM patient WHERE hn = $1 LIMIT 1`,
        [internalHn],
      );
      if (rows.length > 0) patientId = rows[0].patient_id;
    }

    // 1b. ค่าที่ส่งมาเป็นเลขภายในอยู่แล้ว
    if (!patientId) {
      const { rows } = await hisPool.query(
        `SELECT patient_id FROM patient WHERE hn = $1 LIMIT 1`,
        [digits],
      );
      if (rows.length > 0) patientId = rows[0].patient_id;
    }

    // 1c. ทางสำรอง: หาแบบเดิม (Seq Scan ช้ากว่า แต่ครอบคลุมรูปแบบที่เหลือ
    //     เช่น hncode ที่ไม่มี index) — ปกติไม่ถูกเรียกเพราะ 1a/1b เจอก่อน
    if (!patientId) {
      const { rows } = await hisPool.query(
        `SELECT patient_id
           FROM patient
          WHERE TRIM(hn) = $1
             OR TRIM(hncode) = $1
             OR REPLACE(TRIM(hncode), '-', '') = $2
          LIMIT 1`,
        [raw, digits],
      );
      if (rows.length > 0) patientId = rows[0].patient_id;
    }

    if (!patientId) return NextResponse.json([]);

    // ── ขั้น 2: visit ของคนไข้คนนั้น (ใช้ index visit_patient_id) ──
    const { rows } = await hisPool.query(
      `SELECT v.visit_id,
              TRIM(v.vn)                AS vn,
              format_vn(v.vn)           AS vn_formatted,
              NULLIF(TRIM(v.an), '')    AS an,
              CASE WHEN COALESCE(TRIM(v.an), '') <> ''
                   THEN format_an(v.an) END AS an_formatted,
              TRIM(v.visit_date)        AS visit_date,
              TRIM(v.visit_time)        AS visit_time,
              v.fix_visit_type_id       AS visit_type_id,
              TRIM(v.visit_spid)        AS visit_spid,
              TRIM(sp.description)      AS visit_spid_name,
              -- จุดบริการของ visit เป็นจุดที่ "ดูแลคนไข้" จริงไหม
              -- (เกณฑ์เดียวกับ /api/his-service-points)
              CASE WHEN (dp.is_treat_patient = '1'
                         OR sp.fix_service_point_type_id = '1')
                    AND sp.active = '1'
                    AND sp.description NOT ILIKE '%cashier%'
                   THEN '1' ELSE '0' END AS visit_spid_usable,
              -- ── จุดรักษาจริงของ visit ──
              -- visit_spid คือจุดที่ "เปิด VN" ซึ่งมักเป็น Registration/
              -- Admission ไม่ใช่จุดที่คนไข้ไปรักษาจริง (เช่น visit ที่
              -- ลงทะเบียน 67REG จริง ๆ ไปตรวจที่ 67ORTDR Orthopedics)
              -- order_item.order_spid บอกว่ารายการต่าง ๆ ถูกสั่งจากจุดไหน
              -- = จุดรักษาจริง เลือกจุดที่มีรายการมากสุด และต้องผ่าน filter
              -- "ดูแลคนไข้" เหมือนกัน (ตัดค่าลงทะเบียน/ค่าห้องออก)
              (
                SELECT TRIM(oi.order_spid)
                  FROM order_item oi
                  JOIN base_service_point osp
                    ON osp.base_service_point_id = TRIM(oi.order_spid)
                  LEFT JOIN base_department od
                    ON od.base_department_id = osp.base_department_id
                 WHERE oi.visit_id = v.visit_id
                   AND osp.active = '1'
                   AND (od.is_treat_patient = '1'
                        OR osp.fix_service_point_type_id = '1')
                   AND osp.description NOT ILIKE '%cashier%'
                 GROUP BY TRIM(oi.order_spid)
                 ORDER BY COUNT(*) DESC
                 LIMIT 1
              )                         AS treat_spid,
              -- ชื่อของจุดรักษาจริง (subquery เดียวกัน แต่เอา description)
              (
                SELECT TRIM(osp.description)
                  FROM order_item oi
                  JOIN base_service_point osp
                    ON osp.base_service_point_id = TRIM(oi.order_spid)
                  LEFT JOIN base_department od
                    ON od.base_department_id = osp.base_department_id
                 WHERE oi.visit_id = v.visit_id
                   AND osp.active = '1'
                   AND (od.is_treat_patient = '1'
                        OR osp.fix_service_point_type_id = '1')
                   AND osp.description NOT ILIKE '%cashier%'
                 GROUP BY TRIM(oi.order_spid), TRIM(osp.description)
                 ORDER BY COUNT(*) DESC
                 LIMIT 1
              )                         AS treat_spid_name
         FROM visit v
         -- ชื่อจุดบริการของ visit — เอาไปโชว์คู่กับ VN/AN ในช่องเดียวกัน
         -- ให้ผู้ใช้เห็นว่า visit นั้นมาจากจุดไหน ไม่ต้องเดาจากรหัสเปล่า ๆ
         LEFT JOIN base_service_point sp
                ON sp.base_service_point_id = TRIM(v.visit_spid)
         LEFT JOIN base_department dp
                ON dp.base_department_id = sp.base_department_id
        WHERE v.patient_id = $1
          AND v.active = '1'
        ORDER BY TRIM(v.visit_date) DESC, TRIM(v.visit_time) DESC
        LIMIT 30`,
      [patientId],
    );

    const visits = rows.map(
      (r: {
        visit_id: string;
        vn: string | null;
        vn_formatted: string | null;
        an: string | null;
        an_formatted: string | null;
        visit_date: string | null;
        visit_time: string | null;
        visit_type_id: string | null;
        visit_spid: string | null;
        visit_spid_name: string | null;
        visit_spid_usable: string | null;
        treat_spid: string | null;
        treat_spid_name: string | null;
      }) => {
        // fix_visit_type_id = '1' คือ IPD (คนไข้ใน) นอกนั้นเป็น OPD
        const isIpd = r.visit_type_id === "1" && !!r.an_formatted;
        const visitType: "IPD" | "OPD" = isIpd ? "IPD" : "OPD";
        // IPD ใช้ AN (ขึ้นต้น I) / OPD ใช้ VN (ขึ้นต้น O) — ค่านี้เอาไปใส่
        // ช่องที่ 2 ของ QR ได้ตรง ๆ
        const visitRef = isIpd ? r.an_formatted : r.vn_formatted;
        return {
          visitId: r.visit_id,
          vn: r.vn ?? "",
          vnFormatted: r.vn_formatted ?? "",
          an: r.an ?? null,
          anFormatted: r.an_formatted ?? null,
          visitDate: r.visit_date ?? "",
          visitTime: r.visit_time ?? "",
          visitType,
          visitRef: visitRef ?? "",
          visitSpid: r.visit_spid ?? "",
          visitSpidName: (r.visit_spid_name ?? "").replace(/\s+/g, " ").trim(),
          visitSpidUsable: r.visit_spid_usable === "1",
          treatSpid: r.treat_spid ?? "",
          treatSpidName: (r.treat_spid_name ?? "").replace(/\s+/g, " ").trim(),
        };
      },
    );

    return NextResponse.json(visits);
  } catch (err) {
    console.error("[his-visits] error:", err);
    const msg = err instanceof Error ? err.message : "query failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
