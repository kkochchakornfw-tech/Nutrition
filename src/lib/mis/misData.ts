import type { PatientInfo } from "@/lib/his/types";
import { formatAge, genderLabel } from "@/lib/format";
import type { MisAssessment } from "./types";

/** ข้อมูลทั้งหมดที่ใช้เขียนลงรูปฟอร์ม M/R-NUT-003.1 — เป็น JSON ล้วน ส่งจาก server ไป client ได้ */
export interface MisFormData {
  patient: {
    name: string;
    dateOfBirth: string | null;
    ageText: string;
    genderLabel: string;
    hn: string;
    vnAn: string | null;
    admitDate: string | null;
    allergies: string | null;
  };
  assessment: MisAssessment;
}

export function buildMisFormData(
  assessment: MisAssessment,
  patient: PatientInfo | null,
): MisFormData {
  return {
    patient: {
      name: patient?.fullName ?? assessment.patientNameSnapshot,
      dateOfBirth: patient?.dateOfBirth ?? null,
      ageText: formatAge(patient?.dateOfBirth, new Date(assessment.assessedAt)),
      genderLabel: genderLabel(patient?.gender),
      hn: assessment.hn,
      vnAn: assessment.vnAn ?? patient?.vnAn ?? null,
      admitDate: patient?.admitDate ?? null,
      // ฟอร์มนี้เป็นฟอร์มกลาง (ไม่ใช่ของแผนกโภชนาการโดยเฉพาะ) — ใช้ Allergies ทั่วไป (แพ้ยา)
      allergies: assessment.allergiesSnapshot ?? patient?.allergiesText ?? null,
    },
    assessment,
  };
}
