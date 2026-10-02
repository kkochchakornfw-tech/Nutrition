import { NextRequest, NextResponse } from "next/server";
import { hisPool } from "@/lib/his/his-db";

// GET /api/his-patient?hn=xxx
// ดึงข้อมูลผู้ป่วยรายคนจาก iMed (imed_pih.patient) ตรง ๆ
// รับได้ทั้ง hncode (เช่น 67-21-001223) และ hn ดิบ 12 หลัก
export const runtime = "nodejs";

function ageFromBirthdate(birthdate: unknown): number | undefined {
  if (!birthdate) return undefined;
  const d = new Date(String(birthdate));
  if (isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : undefined;
}

// helper allergy ของ HIS (imed_get_all_*) คืน string ชื่อยา/สารคั่นด้วย comma
// และมักซ้ำ (แพ้ยาเดิมถูกบันทึกหลาย visit) → split + dedupe (case-insensitive) คง order แรก
// หมายเหตุ: ไม่ normalize การสะกด (เช่น Ergotamine vs Ergotarmine) — ปล่อยแสดงเกิน
// ปลอดภัยกว่าตัดชื่อยาจริงทิ้งโดยพลาด
function splitDedupeAllergies(...sources: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of sources) {
    if (!src) continue;
    for (const raw of String(src).split(/[,;]/)) {
      const name = raw.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const hn = req.nextUrl.searchParams.get("hn")?.trim();
  if (!hn)
    return NextResponse.json({ error: "hn is required" }, { status: 400 });

  // อนุญาต ตัวเลข ตัวอักษร และ "-" (สำหรับ hncode)
  if (!/^[\w-]{3,20}$/.test(hn)) {
    return NextResponse.json({ error: "Invalid HN" }, { status: 400 });
  }

  const hnNorm = hn.replace(/\s+/g, "");

  try {
    // ดึงการแพ้สดจาก HIS ด้วย helper imed_get_all_* (รับ patient_id)
    // drug = แพ้ยา, other = แพ้อื่น ๆ (อาหาร/สาร) → รวมเป็น allergies[] เดียว
    const { rows } = await hisPool.query(
      `SELECT p.hn, p.hncode,
              p.prename, p.firstname, p.lastname,
              p.birthdate,
              g.gender_name,
              imed_get_all_drug_allergy(p.patient_id)  AS drug_allergy,
              imed_get_all_other_allergy(p.patient_id) AS other_allergy
         FROM patient p
         LEFT JOIN fix_gender g ON g.fix_gender_id = p.fix_gender_id
        WHERE p.active = '1'
          AND (p.hn = $1 OR p.hncode = $1)
        LIMIT 1`,
      [hnNorm],
    );

    if (rows.length === 0)
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });

    const r = rows[0];
    return NextResponse.json({
      hn: r.hn,
      hn_formatted: r.hncode || r.hn,
      prename: r.prename ?? "",
      firstname: r.firstname ?? "",
      lastname: r.lastname ?? "",
      birthdate: r.birthdate ?? undefined,
      gender: r.gender_name ?? undefined,
      age: ageFromBirthdate(r.birthdate),
      allergies: splitDedupeAllergies(r.drug_allergy, r.other_allergy),
    });
  } catch (err) {
    console.error("[his-patient] lookup error:", err);
    return NextResponse.json({ error: "HIS unavailable" }, { status: 503 });
  }
}
