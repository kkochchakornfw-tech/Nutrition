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
  };
  /** record ที่กำลังเปิดอยู่ — ใช้เติมหัวฟอร์มและติ๊กช่องตัวเลือก */
  current: Assessment;
  /** ทุก record ของ HN นี้ — ใช้เติมคอลัมน์คะแนน ครั้งที่ 1/2/3 */
  visits: Assessment[];
}

/** แผ่นกระดาษมี 3 คอลัมน์ (ครั้งที่ 1/2/3) — visitNo 1-3 = แผ่น 1, 4-6 = แผ่น 2, ... */
function sheetOf(visitNo: number): number {
  return Math.floor((visitNo - 1) / 3);
}

export function buildNafFormData(
  current: Assessment,
  patient: PatientInfo | null,
  allForHn: Assessment[]
): NafFormData {
  // เอาเฉพาะ record ที่อยู่แผ่นเดียวกับ current — แผ่นอื่นของ HN นี้ไม่เกี่ยวกับกระดาษแผ่นนี้
  const sameSheet = allForHn.filter((a) => sheetOf(a.visitNo) === sheetOf(current.visitNo));
  // ถ้ามีหลาย record ในครั้งเดียวกัน ใช้อันล่าสุด (ยกเว้น record ที่กำลังเปิดอยู่ให้ใช้เสมอ)
  const byVisit = new Map<number, Assessment>();
  for (const a of [...sameSheet].sort((x, y) => x.createdAt.localeCompare(y.createdAt))) {
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
    },
    current,
    visits: [...byVisit.values()].sort((a, b) => a.visitNo - b.visitNo),
  };
}
