export interface MisCriteriaOption {
  id: number;
  criteriaId: number;
  score: 0 | 1 | 2 | 3;
  labelEn: string;
  /** คำอธิบายเพิ่มเติมภาษาไทย — มีเฉพาะข้อ 6 (fat_store) และข้อ 7 (muscle_wasting) ไม่งั้นเป็น null */
  labelTh: string | null;
  sortOrder: number;
}

export interface MisCriteria {
  id: number;
  criteriaKey: string;
  labelEn: string;
  section: string;
  sortOrder: number;
  options: MisCriteriaOption[];
}

export type AssessorRole = "dietitian" | "nurse";
export type NutritionStatus = "normal" | "malnutrition";

export interface MisAnswerInput {
  criteriaId: number;
  optionId: number;
}

export interface MisAnswer {
  criteriaId: number;
  criteriaKey: string;
  criteriaLabelEn: string;
  optionId: number;
  optionLabelEn: string;
  score: number;
}

export interface CreateMisAssessmentInput {
  hn: string;
  vnAn: string | null;
  assessedAt: string; // ISO datetime
  assessorName: string;
  assessorRole: AssessorRole;
  comorbidityText: string | null;
  serumCreatinine: number | null;
  bun: number | null;
  serumAlbumin: number | null;
  serumTibc: number | null;
  heightCm: number | null;
  dryWeightKg: number | null;
  ibwKg: number | null;
  bmi: number | null;
  waistCm: number | null;
  armCm: number | null;
  legCm: number | null;
  patientNameSnapshot: string;
  allergiesSnapshot: string | null;
  createdByUserId: number;
  answers: MisAnswerInput[];
}

export interface MisAssessment {
  id: number;
  hn: string;
  vnAn: string | null;
  assessedAt: string;
  assessorName: string;
  assessorRole: AssessorRole;
  comorbidityText: string | null;
  serumCreatinine: number | null;
  bun: number | null;
  serumAlbumin: number | null;
  serumTibc: number | null;
  heightCm: number | null;
  dryWeightKg: number | null;
  ibwKg: number | null;
  bmi: number | null;
  waistCm: number | null;
  armCm: number | null;
  legCm: number | null;
  patientNameSnapshot: string;
  allergiesSnapshot: string | null;
  totalScore: number;
  nutritionStatus: NutritionStatus;
  createdByUserId: number;
  createdAt: string;
  answers: MisAnswer[];
}

export interface MisAssessmentSummary {
  id: number;
  hn: string;
  assessedAt: string;
  assessorName: string;
  totalScore: number;
  nutritionStatus: NutritionStatus;
}
