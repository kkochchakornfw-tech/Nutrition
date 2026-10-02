export interface PatientInfo {
  hn: string;
  fullName: string;
  gender: "M" | "F" | "Other";
  dateOfBirth: string; // ISO date (YYYY-MM-DD)
  vnAn: string | null; // Visit/Admit No. ของ visit ปัจจุบัน
  admitDate: string | null; // ISO date (YYYY-MM-DD) วัน visit/admit
  ward: string | null;
  diagnosisText: string | null;
  allergiesText: string | null;
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
  /** ค้นด้วย HN (ตรงหรือขึ้นต้นด้วย) หรือชื่อผู้ป่วย (มีคำที่พิมพ์อยู่ในชื่อ) */
  searchPatients(query: string): Promise<PatientInfo[]>;
}
