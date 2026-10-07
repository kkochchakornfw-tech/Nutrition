export interface PatientInfo {
  hn: string;
  fullName: string;
  gender: "M" | "F" | "Other";
  dateOfBirth: string; // ISO date (YYYY-MM-DD)
  vnAn: string | null; // Visit/Admit No. ของ visit ปัจจุบัน
  admitDate: string | null; // ISO date (YYYY-MM-DD) วัน visit/admit
  ward: string | null;
  diagnosisText: string | null;
  allergiesText: string | null; // แพ้ยา — ใช้ในการ์ดข้อมูลผู้ป่วยทั่วไป
  religion: string | null;
  chiefComplaint: string | null;
}

/**
 * Abstract boundary for patient lookups. Today backed by mock data; once the
 * HIS team publishes their API spec, implement HISProvider against it and
 * switch the factory in provider.ts — routes and UI stay unchanged.
 */
export interface HISProvider {
  getPatientByHN(hn: string): Promise<PatientInfo | null>;
  /** ค้นด้วย HN เท่านั้น (ตรงหรือขึ้นต้นด้วย) */
  searchPatients(query: string): Promise<PatientInfo[]>;
}
