import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool, ensurePatientRow, toDbDateTime, fromDbDateTime } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { findMisCriteria, findMisOption } from "./data";
import { determineNutritionStatus } from "./scoring";
import type {
  AssessorRole,
  CreateMisAssessmentInput,
  MisAnswer,
  MisAssessment,
  MisAssessmentSummary,
  NutritionStatus,
} from "./types";

/**
 * เชื่อมกับ MySQL จริงผ่าน db/schema_mis.sql (mis_assessments / mis_assessment_answers)
 * criteria/option master ยังอยู่ในโค้ด (./data.ts) เหมือน SGA — ดู data.ts
 */

interface MisAssessmentRow extends RowDataPacket {
  id: number;
  hn: string;
  vn_an: string | null;
  assessed_at: string;
  assessor_name_snapshot: string;
  assessor_role: AssessorRole;
  comorbidity_text: string | null;
  serum_creatinine: string | number | null;
  bun: string | number | null;
  serum_albumin: string | number | null;
  serum_tibc: string | number | null;
  height_cm: string | number | null;
  dry_weight_kg: string | number | null;
  ibw_kg: string | number | null;
  bmi: string | number | null;
  waist_cm: string | number | null;
  arm_cm: string | number | null;
  leg_cm: string | number | null;
  patient_name_snapshot: string | null;
  allergies_snapshot: string | null;
  total_score: number;
  nutrition_status: NutritionStatus;
  created_by_user_id: number | null;
  created_at: string;
}

interface MisAnswerRow extends RowDataPacket {
  assessment_id: number;
  criteria_id: number;
  option_id: number;
  score_snapshot: number;
}

function toNumberOrNull(v: string | number | null): number | null {
  return v === null ? null : Number(v);
}

function toSummary(r: MisAssessmentRow): MisAssessmentSummary {
  return {
    id: r.id,
    hn: r.hn,
    assessedAt: fromDbDateTime(r.assessed_at),
    assessorName: r.assessor_name_snapshot,
    totalScore: Number(r.total_score),
    nutritionStatus: r.nutrition_status,
  };
}

function toAssessment(r: MisAssessmentRow, answers: MisAnswer[]): MisAssessment {
  return {
    id: r.id,
    hn: r.hn,
    vnAn: r.vn_an,
    assessedAt: fromDbDateTime(r.assessed_at),
    assessorName: r.assessor_name_snapshot,
    assessorRole: r.assessor_role,
    comorbidityText: r.comorbidity_text,
    serumCreatinine: toNumberOrNull(r.serum_creatinine),
    bun: toNumberOrNull(r.bun),
    serumAlbumin: toNumberOrNull(r.serum_albumin),
    serumTibc: toNumberOrNull(r.serum_tibc),
    heightCm: toNumberOrNull(r.height_cm),
    dryWeightKg: toNumberOrNull(r.dry_weight_kg),
    ibwKg: toNumberOrNull(r.ibw_kg),
    bmi: toNumberOrNull(r.bmi),
    waistCm: toNumberOrNull(r.waist_cm),
    armCm: toNumberOrNull(r.arm_cm),
    legCm: toNumberOrNull(r.leg_cm),
    patientNameSnapshot: r.patient_name_snapshot ?? "",
    allergiesSnapshot: r.allergies_snapshot,
    totalScore: Number(r.total_score),
    nutritionStatus: r.nutrition_status,
    createdByUserId: r.created_by_user_id ?? 0,
    createdAt: fromDbDateTime(r.created_at),
    answers,
  };
}

function toAnswer(r: MisAnswerRow): MisAnswer {
  const criteria = findMisCriteria(r.criteria_id);
  const option = findMisOption(r.criteria_id, r.option_id);
  return {
    criteriaId: r.criteria_id,
    criteriaKey: criteria?.criteriaKey ?? "",
    criteriaLabelEn: criteria?.labelEn ?? "",
    optionId: r.option_id,
    optionLabelEn: option?.labelEn ?? "",
    score: Number(r.score_snapshot),
  };
}

async function fetchAnswers(
  assessmentIds: number[],
): Promise<Map<number, MisAnswer[]>> {
  const byId = new Map<number, MisAnswer[]>();
  if (assessmentIds.length === 0) return byId;
  const [rows] = await pool.query<MisAnswerRow[]>(
    `SELECT assessment_id, criteria_id, option_id, score_snapshot
       FROM mis_assessment_answers WHERE assessment_id IN (?) ORDER BY id`,
    [assessmentIds],
  );
  for (const r of rows) {
    const list = byId.get(r.assessment_id) ?? [];
    list.push(toAnswer(r));
    byId.set(r.assessment_id, list);
  }
  return byId;
}

export async function createMisAssessment(
  input: CreateMisAssessmentInput,
): Promise<MisAssessment> {
  if (input.answers.length !== 10) {
    throw new ValidationError("กรุณาตอบให้ครบทั้ง 10 หัวข้อ");
  }

  const answers = input.answers.map((a) => {
    const criteria = findMisCriteria(a.criteriaId);
    if (!criteria) {
      throw new ValidationError(`ไม่พบหัวข้อที่เลือก (criteriaId=${a.criteriaId})`);
    }
    const option = findMisOption(a.criteriaId, a.optionId);
    if (!option) {
      throw new ValidationError(
        `ไม่พบตัวเลือกที่เลือก (criteriaId=${a.criteriaId}, optionId=${a.optionId})`,
      );
    }
    return { criteriaId: criteria.id, optionId: option.id, score: option.score };
  });

  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const nutritionStatus = determineNutritionStatus(totalScore);

  await ensurePatientRow(input.hn, input.patientNameSnapshot);

  const [dietitianRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM dietitians WHERE full_name = ? LIMIT 1",
    [input.assessorName],
  );
  const assessorDietitianId = dietitianRows[0]?.id ?? null;

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO mis_assessments
       (hn, vn_an, assessed_at, assessor_dietitian_id, assessor_name_snapshot, assessor_role,
        created_by_user_id, comorbidity_text, serum_creatinine, bun, serum_albumin, serum_tibc,
        height_cm, dry_weight_kg, ibw_kg, bmi, waist_cm, arm_cm, leg_cm,
        patient_name_snapshot, allergies_snapshot, total_score, nutrition_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.hn,
      input.vnAn,
      toDbDateTime(input.assessedAt),
      assessorDietitianId,
      input.assessorName,
      input.assessorRole,
      input.createdByUserId,
      input.comorbidityText,
      input.serumCreatinine,
      input.bun,
      input.serumAlbumin,
      input.serumTibc,
      input.heightCm,
      input.dryWeightKg,
      input.ibwKg,
      input.bmi,
      input.waistCm,
      input.armCm,
      input.legCm,
      input.patientNameSnapshot,
      input.allergiesSnapshot,
      totalScore,
      nutritionStatus,
    ],
  );
  const assessmentId = result.insertId;

  await pool.query(
    `INSERT INTO mis_assessment_answers (assessment_id, criteria_id, option_id, score_snapshot)
     VALUES ${answers.map(() => "(?, ?, ?, ?)").join(", ")}`,
    answers.flatMap((a) => [assessmentId, a.criteriaId, a.optionId, a.score]),
  );

  const created = await getMisAssessmentById(assessmentId);
  if (!created) throw new Error("บันทึกสำเร็จแต่อ่านข้อมูลที่บันทึกกลับไม่ได้");
  return created;
}

export async function getMisAssessmentById(id: number): Promise<MisAssessment | null> {
  const [rows] = await pool.query<MisAssessmentRow[]>(
    "SELECT * FROM mis_assessments WHERE id = ? LIMIT 1",
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const answersById = await fetchAnswers([id]);
  return toAssessment(row, answersById.get(id) ?? []);
}

export async function listMisAssessmentsByHn(hn: string): Promise<MisAssessmentSummary[]> {
  const [rows] = await pool.query<MisAssessmentRow[]>(
    "SELECT * FROM mis_assessments WHERE hn = ? ORDER BY assessed_at DESC, id DESC",
    [hn],
  );
  return rows.map(toSummary);
}

export async function listRecentMisAssessments(limit: number): Promise<MisAssessment[]> {
  const [rows] = await pool.query<MisAssessmentRow[]>(
    "SELECT * FROM mis_assessments ORDER BY assessed_at DESC, id DESC LIMIT ?",
    [limit],
  );
  return rows.map((r) => toAssessment(r, []));
}

export async function listAllMisAssessments(): Promise<MisAssessment[]> {
  const [rows] = await pool.query<MisAssessmentRow[]>(
    "SELECT * FROM mis_assessments ORDER BY assessed_at DESC, id DESC",
  );
  return rows.map((r) => toAssessment(r, []));
}
