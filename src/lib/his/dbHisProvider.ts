import "server-only";
import { hisPool } from "./his-db";
import { formatHn } from "./hn";
import type { HISProvider, PatientInfo } from "./types";

// Schema อ้างอิงจาก iMed (imed_pih) ที่ใช้ในระบบ rehab
const BASE_SELECT = `
  SELECT p.hn::text AS hn, p.hncode,
         p.prename, p.firstname, p.lastname,
         p.birthdate,
         g.gender_name,
                  br.description AS religion_desc,
         TRIM(p.religion::text) AS religion_code,
         imed_get_all_drug_allergy(p.patient_id) AS drug_allergy,
         fa.food_allergy_text,
         cv.vn_an, cv.visit_date, cv.ward, cv.dx_code, cv.dx_name,
         cv.chief_complaint
    FROM patient p
    LEFT JOIN fix_gender g ON g.fix_gender_id = p.fix_gender_id
    LEFT JOIN base_religion br
           ON br.base_religion_id::text = TRIM(p.religion::text)
           AND TRIM(p.religion::text) <> '99'
    -- แผนกโภชนาการใช้ "แพ้อาหาร" จาก nt_allergy (ไม่ใช่แพ้ยา) — เอาจาก nt_patient_nutrition
    -- ชุดล่าสุดของผู้ป่วยรายนี้ (nt_patient_nutrition.patient_id -> patient.patient_id)
    LEFT JOIN LATERAL (
      SELECT npn.nt_patient_nutrition_id
        FROM nt_patient_nutrition npn
       WHERE npn.patient_id = p.patient_id
       ORDER BY npn.nt_patient_nutrition_id DESC
       LIMIT 1
    ) latest_npn ON TRUE
    LEFT JOIN LATERAL (
      SELECT STRING_AGG(DISTINCT NULLIF(TRIM(na.note), ''), ', ') AS food_allergy_text
        FROM nt_allergy na
       WHERE na.nt_patient_nutrition_id = latest_npn.nt_patient_nutrition_id
    ) fa ON TRUE
    LEFT JOIN LATERAL (
      SELECT CASE WHEN NULLIF(TRIM(v.an), '') IS NOT NULL
                  THEN format_an(v.an) ELSE format_vn(v.vn) END AS vn_an,
             v.visit_date,
             CASE WHEN v.fix_visit_type_id = '1'
                  THEN imed_get_current_ward_name(a.admit_id) END AS ward,
             dx.code AS dx_code,
             dx.name AS dx_name,
             cc.chief_complaint
        FROM visit v
        LEFT JOIN admit a ON a.visit_id = v.visit_id AND a.active = '1'
        LEFT JOIN LATERAL (
          SELECT d.icd10_code AS code,
                 COALESCE(NULLIF(TRIM(d.icd10_description), ''),
                          NULLIF(TRIM(d.beginning_diagnosis), ''),
                          NULLIF(TRIM(d.beginning_diagnosis_th), ''), '') AS name
            FROM diagnosis_icd10 d
           WHERE d.visit_id = v.visit_id
             AND d.fix_diagnosis_type_id = '1'
           ORDER BY d.diagnosis_date DESC, d.diagnosis_time DESC
           LIMIT 1
        ) dx ON TRUE
        LEFT JOIN LATERAL (
          SELECT TRIM(n.chief_complaint) AS chief_complaint
            FROM nursing_admit_assessment n
           WHERE n.visit_id = v.visit_id
             AND NULLIF(TRIM(n.chief_complaint), '') IS NOT NULL
           ORDER BY n.admission_date DESC, n.admission_time DESC,
                    n.nursing_admit_assessment_id DESC
           LIMIT 1
        ) cc ON TRUE
       WHERE v.patient_id = p.patient_id
         AND v.active = '1'
       ORDER BY (v.fix_visit_type_id = '1' AND v.doctor_discharge IS DISTINCT FROM '1') DESC,
                v.visit_date DESC, v.visit_time DESC
       LIMIT 1
    ) cv ON TRUE
   WHERE p.active = '1'
`;

export async function getChiefComplaint(visitId: string) {
  const { rows } = await hisPool.query(
    `SELECT chief_complaint, admission_date, admission_time
     FROM nursing_admit_assessment
     WHERE visit_id = $1 AND NULLIF(TRIM(chief_complaint), '') IS NOT NULL
     ORDER BY admission_date DESC, admission_time DESC, nursing_admit_assessment_id DESC
     LIMIT 1`,
    [visitId],
  );
  return rows[0] ?? null; // { chief_complaint, admission_date, admission_time } | null
}

const SEARCH_LIMIT = 20;

interface PatientRow {
  hn: string;
  hncode: string | null;
  prename: string | null;
  firstname: string | null;
  lastname: string | null;
  birthdate: string | Date | null;
  gender_name: string | null;
  drug_allergy: string | null;
  food_allergy_text: string | null;
  vn_an: string | null;
  visit_date: string | null;
  ward: string | null;
  dx_code: string | null;
  dx_name: string | null;
  religion_desc: string | null;
  religion_code: string | null;
  chief_complaint: string | null;
}

function buildDiagnosis(
  code: string | null,
  name: string | null,
): string | null {
  const c = (code ?? "").trim();
  const n = decodeEntities(name).trim();
  if (!c && !n) return null;
  return n ? `${c} - ${n}` : c;
}

function cleanReligion(desc: string | null): string | null {
  const s = (desc ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  return s || null;
}

// ⚠️ เช็คค่าจริง: SELECT DISTINCT gender_name FROM fix_gender;
function mapGender(name: string | null): PatientInfo["gender"] {
  const n = (name ?? "").trim().toLowerCase();
  if (n === "ชาย" || n === "male" || n === "m") return "M";
  if (n === "หญิง" || n === "female" || n === "f") return "F";
  return "Other";
}

// รองรับทั้งกรณี pg คืนเป็น Date และเป็น string
function toIsoDate(v: string | Date | null): string {
  if (!v) return "";
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
}

// allergy จาก HIS มักซ้ำหลาย visit → split + dedupe (แบบเดียวกับ rehab)
function dedupeList(src: string | null): string | null {
  if (!src) return null;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of src.split(/[,;]/)) {
    const name = raw.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  return out.length ? out.join(", ") : null;
}

function toPatient(r: PatientRow): PatientInfo {
  return {
    hn: r.hncode || formatHn(r.hn),
    fullName: [
      decodeEntities(r.prename),
      decodeEntities(r.firstname),
      decodeEntities(r.lastname),
    ]
      .filter(Boolean)
      .join(" ")
      .trim(),
    gender: mapGender(r.gender_name),
    dateOfBirth: toIsoDate(r.birthdate),
    // ⚠️ ยังไม่ได้ต่อตาราง visit/admit — รอ schema
    vnAn: r.vn_an,
    admitDate: /^\d{4}-\d{2}-\d{2}/.test(r.visit_date ?? "")
      ? r.visit_date!.slice(0, 10)
      : null,
    ward: r.ward,
    diagnosisText: buildDiagnosis(r.dx_code, r.dx_name),
    allergiesText:
      decodeEntities(dedupeList(r.drug_allergy)) || "ไม่พบประวัติแพ้ยา",
    foodAllergiesText:
      decodeEntities(r.food_allergy_text) || "ไม่พบประวัติแพ้อาหาร",
    religion:
      cleanReligion(r.religion_desc) ??
      (r.religion_code === "99" ? "ไม่ระบุ" : null),
    chiefComplaint: decodeEntities(r.chief_complaint).trim() || null,
  };
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

// แปลง &#1055; และ &#x41F; กลับเป็นตัวอักษร (HIS เก็บชื่อต่างชาติเป็น HTML entity)
function decodeEntities(s: string | null): string {
  if (!s) return "";
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
}

export class DbHISProvider implements HISProvider {
  async getPatientByHN(hn: string): Promise<PatientInfo | null> {
    const q = hn.replace(/\s+/g, "");
    if (!q) return null;
    const { rows } = await hisPool.query<PatientRow>(
      `${BASE_SELECT} AND (p.hn::text = $1 OR p.hncode = $1) LIMIT 1`,
      [q],
    );
    return rows[0] ? toPatient(rows[0]) : null;
  }

  async searchPatients(query: string): Promise<PatientInfo[]> {
    const term = query.trim();
    if (term.length < 2) return [];

    // ตัวเลข / hncode
    if (/^[0-9-]+$/.test(term)) {
      const digits = term.replace(/[^0-9]/g, "");
      const { rows } = await hisPool.query<PatientRow>(
        `${BASE_SELECT}
           AND (p.hn::text LIKE $1 OR p.hncode = $2 OR p.hn::text = $2)
         ORDER BY p.hn
         LIMIT ${SEARCH_LIMIT}`,
        [`${escapeLike(digits)}%`, term],
      );
      return rows.map(toPatient);
    }

    // ชื่อ / นามสกุล (prefix match แบบ rehab)
    const { rows } = await hisPool.query<PatientRow>(
      `${BASE_SELECT}
         AND (UPPER(p.firstname) LIKE $1 OR UPPER(p.lastname) LIKE $1)
       ORDER BY p.firstname, p.lastname
       LIMIT ${SEARCH_LIMIT}`,
      [`${escapeLike(term.toUpperCase())}%`],
    );
    return rows.map(toPatient);
  }
}
