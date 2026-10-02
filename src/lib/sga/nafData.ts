import type { PatientInfo } from "@/lib/his/types";
import { formatAge, genderLabel } from "@/lib/format";
import type { Assessment } from "./types";

/** ข้อมูลทั้งหมดที่ใช้เขียนลงรูปฟอร์ม M/R-NUT-001.1 — เป็น JSON ล้วน ส่งจาก server ไป client ได้ */
export interface NafFormData {
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
  /** record ที่กำลังเปิดอยู่ — ใช้เติมหัวฟอร์มและติ๊กช่องตัวเลือก */
  current: Assessment;
  /** ทุก record ของ HN นี้ — ใช้เติมคอลัมน์คะแนน ครั้งที่ 1/2/3 */
  visits: Assessment[];
}

export function buildNafFormData(
  current: Assessment,
  patient: PatientInfo | null,
  allForHn: Assessment[]
): NafFormData {
  // ถ้ามีหลาย record ในครั้งเดียวกัน ใช้อันล่าสุด (ยกเว้น record ที่กำลังเปิดอยู่ให้ใช้เสมอ)
  const byVisit = new Map<number, Assessment>();
  for (const a of [...allForHn].sort((x, y) => x.createdAt.localeCompare(y.createdAt))) {
    byVisit.set(a.visitNo, a);
  }
  byVisit.set(current.visitNo, current);

  return {
    patient: {
      name: patient?.fullName ?? current.patientNameSnapshot,
      dateOfBirth: patient?.dateOfBirth ?? null,
      ageText: formatAge(patient?.dateOfBirth, new Date(current.assessedAt)),
      genderLabel: genderLabel(patient?.gender),
      hn: current.hn,
      vnAn: current.vnAn ?? patient?.vnAn ?? null,
      admitDate: patient?.admitDate ?? null,
      allergies: current.allergiesSnapshot ?? patient?.allergiesText ?? null,
    },
    current,
    visits: [...byVisit.values()].sort((a, b) => a.visitNo - b.visitNo),
  };
}
