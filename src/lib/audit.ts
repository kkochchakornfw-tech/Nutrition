import type { RowDataPacket } from "mysql2/promise";
import { pool, toDbDateTime, fromDbDateTime } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/types";
import type { Assessment } from "@/lib/sga/types";
import type { MisAssessment } from "@/lib/mis/types";
import type { CalorieCalculation } from "@/lib/calorie/types";

/**
 * บันทึกว่าใครแก้อะไรในฟอร์มไหน — เก็บเป็นรายการ "ช่อง: ค่าเดิม → ค่าใหม่"
 * ตาราง audit_logs อยู่ใน db/schema_audit.sql (สร้างอัตโนมัติครั้งแรกถ้ายังไม่มี)
 */

export type AuditKind = "sga" | "mis" | "calorie";

export interface AuditChange {
  label: string;
  from: string;
  to: string;
}

export interface AuditEntry {
  id: number;
  kind: AuditKind;
  recordId: number;
  hn: string;
  action: string;
  userName: string;
  at: string;
  changes: AuditChange[];
}

export const AUDIT_KIND_LABEL: Record<AuditKind, string> = {
  sga: "แบบประเมิน SGA/NAF",
  mis: "แบบประเมิน MIS (ไตเทียม)",
  calorie: "คำนวณแคลอรี่/สารอาหาร",
};

// ---------- ตาราง ----------

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  tableReady ??= pool
    .query(
      `CREATE TABLE IF NOT EXISTS audit_logs (
         id          BIGINT PRIMARY KEY AUTO_INCREMENT,
         form_kind   VARCHAR(16)  NOT NULL,
         record_id   INT          NOT NULL,
         hn          VARCHAR(32)  NOT NULL,
         action      VARCHAR(16)  NOT NULL,
         user_id     INT          NULL,
         user_name   VARCHAR(255) NOT NULL,
         changes     TEXT         NOT NULL,
         created_at  DATETIME     NOT NULL,
         KEY idx_audit_record (form_kind, record_id),
         KEY idx_audit_created (created_at)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    )
    .then(() => undefined)
    .catch((err) => {
      tableReady = null;
      throw err;
    });
  return tableReady;
}

/** บันทึกการแก้ไข — ถ้า log ไม่สำเร็จ ไม่ทำให้การบันทึกฟอร์มล้ม (แค่ log error ฝั่ง server) */
export async function logAudit(params: {
  kind: AuditKind;
  recordId: number;
  hn: string;
  user: AuthUser;
  changes: AuditChange[];
  action?: string;
}): Promise<void> {
  if (params.changes.length === 0) return;
  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO audit_logs (form_kind, record_id, hn, action, user_id, user_name, changes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.kind,
        params.recordId,
        params.hn,
        params.action ?? "update",
        params.user.id,
        params.user.fullName,
        JSON.stringify(params.changes),
        toDbDateTime(new Date().toISOString()),
      ],
    );
  } catch (err) {
    console.error("[audit] บันทึก log ไม่สำเร็จ:", err);
  }
}

interface AuditRow extends RowDataPacket {
  id: number;
  form_kind: AuditKind;
  record_id: number;
  hn: string;
  action: string;
  user_name: string;
  changes: string;
  created_at: string;
}

function toEntry(r: AuditRow): AuditEntry {
  let changes: AuditChange[] = [];
  try {
    changes = JSON.parse(r.changes);
  } catch {
    /* ข้อมูลเสีย — แสดงเป็นไม่มีรายละเอียด */
  }
  return {
    id: Number(r.id),
    kind: r.form_kind,
    recordId: r.record_id,
    hn: r.hn,
    action: r.action,
    userName: r.user_name,
    at: fromDbDateTime(r.created_at),
    changes,
  };
}

export async function listAuditForRecord(kind: AuditKind, recordId: number): Promise<AuditEntry[]> {
  try {
    await ensureTable();
    const [rows] = await pool.query<AuditRow[]>(
      "SELECT * FROM audit_logs WHERE form_kind = ? AND record_id = ? ORDER BY created_at DESC, id DESC",
      [kind, recordId],
    );
    return rows.map(toEntry);
  } catch (err) {
    console.error("[audit] อ่าน log ไม่สำเร็จ:", err);
    return [];
  }
}

// ---------- คำนวณความต่าง ----------

const fmtDateTime = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

type Field<T> = [label: string, get: (r: T) => unknown, format?: (v: unknown) => string];

function diffFields<T>(fields: Field<T>[], before: T, after: T): AuditChange[] {
  const out: AuditChange[] = [];
  for (const [label, get, format] of fields) {
    const a = get(before);
    const b = get(after);
    if (show(a) === show(b)) continue;
    const f = format ?? show;
    out.push({ label, from: f(a), to: f(b) });
  }
  return out;
}

function diffMap(before: Map<string, string>, after: Map<string, string>): AuditChange[] {
  const out: AuditChange[] = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const a = before.get(key) ?? "-";
    const b = after.get(key) ?? "-";
    if (a !== b) out.push({ label: key, from: a, to: b });
  }
  return out;
}

const dateTime = (v: unknown) => (v ? fmtDateTime.format(new Date(String(v))) : "-");

export function diffSga(before: Assessment, after: Assessment): AuditChange[] {
  const fields: Field<Assessment>[] = [
    ["ชื่อผู้ป่วย", (r) => r.patientNameSnapshot],
    ["ครั้งที่ประเมิน", (r) => r.visitNo],
    ["วันที่/เวลาประเมิน", (r) => r.assessedAt, dateTime],
    ["ผู้ประเมิน", (r) => r.assessorName],
    ["VN/AN", (r) => r.vnAn],
    ["อาการสำคัญ", (r) => r.chiefComplaint],
    ["Diet Order", (r) => r.dietOrder],
    ["ศาสนา", (r) => r.religion],
    ["ข้อมูลจาก", (r) => r.infoSource],
    ["ข้อมูลจาก (ระบุเอง)", (r) => r.infoSourceOther],
    ["ส่วนสูง (ซม.)", (r) => r.heightCm],
    ["น้ำหนัก (กก.)", (r) => r.weightKg],
    ["การวินิจฉัยโรค", (r) => r.diagnosisSnapshot],
    ["คะแนนรวม", (r) => r.totalScore],
    ["ผล SGA", (r) => r.sgaResult],
  ];
  const answers = (r: Assessment) => {
    const m = new Map<string, string>();
    for (const a of r.answers) {
      const text = a.notApplicable ? "N/A" : a.customLabel ? `${a.optionLabelTh} (${a.customLabel})` : a.optionLabelTh;
      m.set(a.criteriaLabelTh, m.has(a.criteriaLabelTh) ? `${m.get(a.criteriaLabelTh)}, ${text}` : text);
    }
    return m;
  };
  return [...diffFields(fields, before, after), ...diffMap(answers(before), answers(after))];
}

export function diffMis(before: MisAssessment, after: MisAssessment): AuditChange[] {
  const fields: Field<MisAssessment>[] = [
    ["ชื่อผู้ป่วย", (r) => r.patientNameSnapshot],
    ["วันที่/เวลาประเมิน", (r) => r.assessedAt, dateTime],
    ["ผู้ประเมิน", (r) => r.assessorName],
    ["ตำแหน่งผู้ประเมิน", (r) => r.assessorRole],
    ["VN/AN", (r) => r.vnAn],
    ["โรคประจำตัวร่วม", (r) => r.comorbidityText],
    ["Serum creatinine", (r) => r.serumCreatinine],
    ["BUN", (r) => r.bun],
    ["Serum albumin", (r) => r.serumAlbumin],
    ["Serum TIBC", (r) => r.serumTibc],
    ["ส่วนสูง (ซม.)", (r) => r.heightCm],
    ["Dry Weight (กก.)", (r) => r.dryWeightKg],
    ["IBW (กก.)", (r) => r.ibwKg],
    ["BMI", (r) => r.bmi],
    ["เส้นรอบเอว", (r) => r.waistCm],
    ["เส้นรอบวงแขน", (r) => r.armCm],
    ["เส้นรอบวงขา", (r) => r.legCm],
    ["Allergies", (r) => r.allergiesSnapshot],
    ["คะแนนรวม", (r) => r.totalScore],
    ["สถานะ", (r) => r.nutritionStatus],
  ];
  const answers = (r: MisAssessment) =>
    new Map(r.answers.map((a) => [a.criteriaLabelEn, `${a.optionLabelEn} (${a.score})`]));
  return [...diffFields(fields, before, after), ...diffMap(answers(before), answers(after))];
}

export function diffCalorie(before: CalorieCalculation, after: CalorieCalculation): AuditChange[] {
  const fields: Field<CalorieCalculation>[] = [
    ["ชื่อผู้ป่วย", (r) => r.patientNameSnapshot],
    ["ผู้คำนวณ", (r) => r.performedBy],
    ["หมายเหตุ", (r) => r.note],
    ["น้ำหนัก (กก.)", (r) => r.inputs.weightKg],
    ["Factor cal (kcal/กก./วัน)", (r) => r.inputs.factorCal],
    ["วิธีคำนวณสัดส่วน", (r) => r.inputs.mode],
    ["% CHO", (r) => r.inputs.pctCho],
    ["% PRO", (r) => r.inputs.pctPro],
    ["% FAT", (r) => r.inputs.pctFat],
    ["Factor protein (ก./กก.)", (r) => r.inputs.factorProtein],
    ["พลังงานรวม (kcal)", (r) => Math.round(r.result.totalEnergy)],
  ];
  const foods = (r: CalorieCalculation) =>
    new Map(
      r.foodPlan.lines.map((l) => [
        `อาหาร: ${l.labelTh}`,
        l.manual ? `CHO ${l.cho} / PRO ${l.pro} / FAT ${l.fat} / ${l.kcal} kcal` : `${l.portions} ส่วน`,
      ]),
    );
  return [...diffFields(fields, before, after), ...diffMap(foods(before), foods(after))];
}
