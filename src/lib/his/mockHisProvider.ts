import type { HISProvider, PatientInfo } from "./types";

// ข้อมูลจำลอง — รอ spec API จริงจากทีม HIS (ดู PROJECT_BRIEF.md > Open items)
const MOCK_PATIENTS: PatientInfo[] = [
  {
    hn: "1234567",
    fullName: "นายทดสอบ ระบบหนึ่ง",
    gender: "M",
    dateOfBirth: "1958-05-12",
    vnAn: "AN69-004521",
    admitDate: "2026-09-20",
    ward: "อายุรกรรมชาย",
    diagnosisText: "Type 2 Diabetes Mellitus, Hypertension",
    allergiesText: "Penicillin",
    foodAllergiesText: "ไม่แพ้อาหาร",
    religion: "พุทธ",
    chiefComplaint: "แน่นหน้าอก 2 วันก่อนมาโรงพยาบาล",
  },
  {
    hn: "2345678",
    fullName: "นางสาวทดสอบ ระบบสอง",
    gender: "F",
    dateOfBirth: "1975-11-03",
    vnAn: "AN69-004588",
    admitDate: "2026-09-22",
    ward: "ศัลยกรรมหญิง",
    diagnosisText: "Post-op appendectomy",
    allergiesText: null,
    foodAllergiesText: "แพ้อาหารทะเล",
    religion: "พุทธ",
    chiefComplaint: "ปวดท้องด้านขวาล่าง 1 วัน",
  },
  {
    hn: "3456789",
    fullName: "นายทดสอบ ระบบสาม",
    gender: "M",
    dateOfBirth: "1990-02-20",
    vnAn: "AN69-004610",
    admitDate: "2026-09-23",
    ward: "ICU",
    diagnosisText: "Severe pneumonia, Critically ill",
    allergiesText: "Sulfa drugs",
    foodAllergiesText: "แพ้อาหารทะเล, ถั่วลิสง",
    religion: "อิสลาม",
    chiefComplaint: "หายใจเหนื่อยหอบ ไข้สูง 3 วัน",
  },
  {
    hn: "4567890",
    fullName: "นางสมศรี ทดสอบ",
    gender: "F",
    dateOfBirth: "1946-08-30",
    vnAn: "VN69-119874",
    admitDate: "2026-09-24",
    ward: "OPD โภชนาการ",
    diagnosisText: "CKD stage 4",
    allergiesText: null,
    foodAllergiesText: "ไม่แพ้อาหาร",
    religion: "พุทธ",
    chiefComplaint: "มาตรวจตามนัด ติดตามการทำงานของไต",
  },
];

export class MockHISProvider implements HISProvider {
  async getPatientByHN(hn: string): Promise<PatientInfo | null> {
    const trimmed = hn.trim();
    return MOCK_PATIENTS.find((p) => p.hn === trimmed) ?? null;
  }

  async searchPatients(query: string): Promise<PatientInfo[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_PATIENTS.filter((p) => p.hn.startsWith(q));
  }
}
