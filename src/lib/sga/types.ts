export interface SgaCriteriaOption {
  id: number;
  criteriaId: number;
  labelTh: string;
  score: number;
  isOther: boolean;
  sortOrder: number;
}

export interface SgaCriteria {
  id: number;
  criteriaKey: string;
  labelTh: string;
  section: string;
  allowMultiple: boolean;
  sortOrder: number;
  options: SgaCriteriaOption[];
}

export type InfoSource = "patient" | "relative" | "other";
export type SgaResult = "A" | "B" | "C";

export interface AssessmentAnswerInput {
  criteriaId: number;
  optionId?: number; // ไม่มีเมื่อ notApplicable = true
  notApplicable?: boolean;
  customLabel?: string;
}

export interface AssessmentAnswer {
  criteriaId: number;
  criteriaKey: string;
  criteriaLabelTh: string;
  optionId: number | null; // null เมื่อเป็น N/A
  notApplicable: boolean;
  optionLabelTh: string;
  customLabel: string | null;
  scoreSnapshot: number;
}

export interface CreateAssessmentInput {
  hn: string;
  vnAn: string | null;
  /** ลำดับครั้งที่ประเมินโดยรวม (ไม่จำกัดที่ 3 — แผ่นถัดไปเริ่มที่ 4, 7, ... ดู buildNafFormData) */
  visitNo: number;
  assessedAt: string; // ISO datetime
  assessorName: string;
  chiefComplaint: string | null;
  dietOrder: string | null;
  religion: string | null;
  infoSource: InfoSource | null;
  /** ข้อความที่ระบุเองเมื่อ infoSource = "other" */
  infoSourceOther: string | null;
  heightCm: number;
  weightKg: number;
  patientNameSnapshot: string;
  diagnosisSnapshot: string | null;
  createdByUserId: number;
  answers: AssessmentAnswerInput[];
}

export interface Assessment {
  id: number;
  hn: string;
  vnAn: string | null;
  visitNo: number;
  assessedAt: string;
  assessorName: string;
  chiefComplaint: string | null;
  dietOrder: string | null;
  religion: string | null;
  infoSource: InfoSource | null;
  infoSourceOther: string | null;
  heightCm: number;
  weightKg: number;
  bmi: number;
  patientNameSnapshot: string;
  diagnosisSnapshot: string | null;
  totalScore: number;
  sgaResult: SgaResult;
  createdByUserId: number;
  createdAt: string;
  answers: AssessmentAnswer[];
}

export interface AssessmentSummary {
  id: number;
  hn: string;
  visitNo: number;
  assessedAt: string;
  assessorName: string;
  totalScore: number;
  sgaResult: SgaResult;
  weightKg: number;
}
