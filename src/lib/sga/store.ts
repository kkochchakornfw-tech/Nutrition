import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool, ensurePatientRow, toDbDateTime, fromDbDateTime } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { findCriteria, findOption } from "./data";
import { calcBmi, determineSgaResult } from "./scoring";
import type {
  Assessment,
  AssessmentAnswer,
  AssessmentSummary,
  CreateAssessmentInput,
  InfoSource,
  SgaResult,
} from "./types";

/**
 * เชื่อมกับ MySQL จริงผ่าน db/schema_v2.sql (assessments / assessment_answers)
 * criteria/option master ยังอยู่ในโค้ด (./data.ts) ไม่ query ทุกครั้ง — id ของมัน
 * ตรงกับ AUTO_INCREMENT จริงใน DB แล้ว (ดูคอมเมนต์ใน data.ts)
 */

interface AssessmentRow extends RowDataPacket {
  id: number;
  hn: string;
  vn_an: string | null;
  visit_no: 1 | 2 | 3;
  assessed_at: string;
  assessor_name_snapshot: string;
  chief_complaint: string | null;
  diet_order: string | null;
  religion: string | null;
  info_source: InfoSource | null;
  height_cm: string | number;
  weight_kg: string | number;
  bmi: string | number;
  patient_name_snapshot: string | null;
  diagnosis_snapshot: string | null;
  allergies_snapshot: string | null;
  total_score: string | number;
  sga_result: SgaResult;
  created_by_user_id: number | null;
  created_at: string;
}

interface AnswerRow extends RowDataPacket {
  assessment_id: number;
  criteria_id: number;
  option_id: number | null;
  not_applicable: number;
  custom_label: string | null;
  score_snapshot: string | number;
}

function toSummary(
  r: AssessmentRow & { weight_kg: string | number },
): AssessmentSummary {
  return {
    id: r.id,
    hn: r.hn,
    visitNo: r.visit_no,
    assessedAt: fromDbDateTime(r.assessed_at),
    assessorName: r.assessor_name_snapshot,
    totalScore: Number(r.total_score),
    sgaResult: r.sga_result,
    weightKg: Number(r.weight_kg),
  };
}

function toAssessment(
  r: AssessmentRow,
  answers: AssessmentAnswer[],
): Assessment {
  return {
    id: r.id,
    hn: r.hn,
    vnAn: r.vn_an,
    visitNo: r.visit_no,
    assessedAt: fromDbDateTime(r.assessed_at),
    assessorName: r.assessor_name_snapshot,
    chiefComplaint: r.chief_complaint,
    dietOrder: r.diet_order,
    religion: r.religion,
    infoSource: r.info_source,
    heightCm: Number(r.height_cm),
    weightKg: Number(r.weight_kg),
    bmi: Number(r.bmi),
    patientNameSnapshot: r.patient_name_snapshot ?? "",
    diagnosisSnapshot: r.diagnosis_snapshot,
    allergiesSnapshot: r.allergies_snapshot,
    totalScore: Number(r.total_score),
    sgaResult: r.sga_result,
    createdByUserId: r.created_by_user_id ?? 0,
    createdAt: fromDbDateTime(r.created_at),
    answers,
  };
}

type AnswerToSave = {
  criteriaId: number;
  optionId: number | null;
  notApplicable: boolean;
  customLabel: string | null;
  scoreSnapshot: number;
};

function toAnswer(r: AnswerRow): AssessmentAnswer {
  const criteria = findCriteria(r.criteria_id);
  const notApplicable = Number(r.not_applicable) === 1;
  const option =
    r.option_id != null ? findOption(r.criteria_id, r.option_id) : undefined;
  return {
    criteriaId: r.criteria_id,
    criteriaKey: criteria?.criteriaKey ?? "",
    criteriaLabelTh: criteria?.labelTh ?? "",
    optionId: r.option_id,
    notApplicable,
    optionLabelTh: notApplicable
      ? "N/A"
      : (option?.labelTh ?? r.custom_label ?? ""),
    customLabel: r.custom_label,
    scoreSnapshot: Number(r.score_snapshot),
  };
}

async function fetchAnswers(
  assessmentIds: number[],
): Promise<Map<number, AssessmentAnswer[]>> {
  const byId = new Map<number, AssessmentAnswer[]>();
  if (assessmentIds.length === 0) return byId;
  const [rows] = await pool.query<AnswerRow[]>(
    `SELECT assessment_id, criteria_id, option_id, not_applicable, custom_label, score_snapshot
 FROM assessment_answers WHERE assessment_id IN (?) ORDER BY id`,
    [assessmentIds],
  );
  for (const r of rows) {
    const list = byId.get(r.assessment_id) ?? [];
    list.push(toAnswer(r));
    byId.set(r.assessment_id, list);
  }
  return byId;
}

export async function createAssessment(
  input: CreateAssessmentInput,
): Promise<Assessment> {
  const answers = input.answers.map((a): AnswerToSave => {
    const criteria = findCriteria(a.criteriaId);
    if (!criteria) {
      throw new ValidationError(
        `ไม่พบหัวข้อที่เลือก (criteriaId=${a.criteriaId})`,
      );
    }
    if (a.notApplicable) {
      return {
        criteriaId: criteria.id,
        optionId: null,
        notApplicable: true,
        customLabel: null,
        scoreSnapshot: 0,
      };
    }
    const option =
      a.optionId !== undefined
        ? findOption(a.criteriaId, a.optionId)
        : undefined;
    if (!option) {
      throw new ValidationError(
        `ไม่พบตัวเลือกที่เลือก (criteriaId=${a.criteriaId}, optionId=${a.optionId})`,
      );
    }
    if (
      option.isOther &&
      (a.scoreOverride === undefined || !a.customLabel?.trim())
    ) {
      throw new ValidationError(
        `ตัวเลือก "${option.labelTh}" ต้องระบุชื่อโรคและคะแนนเอง`,
      );
    }
    return {
      criteriaId: criteria.id,
      optionId: option.id,
      notApplicable: false,
      customLabel: option.isOther ? a.customLabel!.trim() : null,
      scoreSnapshot: option.isOther ? a.scoreOverride! : option.score,
    };
  });

  const totalScore = answers.reduce((sum, a) => sum + a.scoreSnapshot, 0);
  const bmi = calcBmi(input.heightCm, input.weightKg);
  const sgaResult = determineSgaResult(totalScore);

  await ensurePatientRow(input.hn, input.patientNameSnapshot);

  const [dietitianRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM dietitians WHERE full_name = ? LIMIT 1",
    [input.assessorName],
  );
  const assessorDietitianId = dietitianRows[0]?.id ?? null;

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO assessments
       (hn, vn_an, visit_no, assessed_at, assessor_dietitian_id, assessor_name_snapshot,
        created_by_user_id, chief_complaint, diet_order, religion, info_source,
        height_cm, weight_kg, bmi, patient_name_snapshot, diagnosis_snapshot, allergies_snapshot,
        total_score, sga_result)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.hn,
      input.vnAn,
      input.visitNo,
      toDbDateTime(input.assessedAt),
      assessorDietitianId,
      input.assessorName,
      input.createdByUserId,
      input.chiefComplaint,
      input.dietOrder,
      input.religion,
      input.infoSource,
      input.heightCm,
      input.weightKg,
      bmi,
      input.patientNameSnapshot,
      input.diagnosisSnapshot,
      input.allergiesSnapshot,
      totalScore,
      sgaResult,
    ],
  );
  const assessmentId = result.insertId;

  if (answers.length > 0) {
    await pool.query(
      `INSERT INTO assessment_answers
       (assessment_id, criteria_id, option_id, not_applicable, custom_label, score_snapshot)
     VALUES ${answers.map(() => "(?, ?, ?, ?, ?, ?)").join(", ")}`,
      answers.flatMap((a) => [
        assessmentId,
        a.criteriaId,
        a.optionId,
        a.notApplicable ? 1 : 0,
        a.customLabel,
        a.scoreSnapshot,
      ]),
    );
  }

  const created = await getAssessmentById(assessmentId);
  if (!created) throw new Error("บันทึกสำเร็จแต่อ่านข้อมูลที่บันทึกกลับไม่ได้");
  return created;
}

export async function getAssessmentById(
  id: number,
): Promise<Assessment | null> {
  const [rows] = await pool.query<AssessmentRow[]>(
    "SELECT * FROM assessments WHERE id = ? LIMIT 1",
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const answersById = await fetchAnswers([id]);
  return toAssessment(row, answersById.get(id) ?? []);
}

export async function listFullAssessmentsByHn(
  hn: string,
): Promise<Assessment[]> {
  const [rows] = await pool.query<AssessmentRow[]>(
    "SELECT * FROM assessments WHERE hn = ? ORDER BY assessed_at DESC, id DESC",
    [hn],
  );
  const answersById = await fetchAnswers(rows.map((r) => r.id));
  return rows.map((r) => toAssessment(r, answersById.get(r.id) ?? []));
}

export async function listAssessmentsByHn(
  hn: string,
): Promise<AssessmentSummary[]> {
  const [rows] = await pool.query<AssessmentRow[]>(
    "SELECT * FROM assessments WHERE hn = ? ORDER BY assessed_at DESC, id DESC",
    [hn],
  );
  return rows.map(toSummary);
}

/**
 * รายการแบบไม่มีรายละเอียดคะแนนต่อหมวด (answers ว่างเสมอ) — ใช้สำหรับหน้ารายการ/
 * สรุปที่ไม่ได้แตะ .answers เท่านั้น เปิดดูรายละเอียดเต็มด้วย getAssessmentById
 */
export async function listRecentAssessments(
  limit: number,
): Promise<Assessment[]> {
  const [rows] = await pool.query<AssessmentRow[]>(
    "SELECT * FROM assessments ORDER BY assessed_at DESC, id DESC LIMIT ?",
    [limit],
  );
  return rows.map((r) => toAssessment(r, []));
}

export async function countAssessmentsByResult(): Promise<
  Record<SgaResult, number>
> {
  const counts: Record<SgaResult, number> = { A: 0, B: 0, C: 0 };
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT sga_result, COUNT(*) AS n FROM assessments GROUP BY sga_result",
  );
  for (const r of rows) {
    const key = r.sga_result as SgaResult | null;
    if (key) counts[key] = Number(r.n);
  }
  return counts;
}

export async function listAllAssessments(): Promise<Assessment[]> {
  const [rows] = await pool.query<AssessmentRow[]>(
    "SELECT * FROM assessments ORDER BY assessed_at DESC, id DESC",
  );
  return rows.map((r) => toAssessment(r, []));
}
