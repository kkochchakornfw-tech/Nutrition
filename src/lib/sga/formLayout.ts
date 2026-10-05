/**
 * พิกัดบนฟอร์ม M/R-NUT-001.1 Rev.4 (public/forms/naf-template.png)
 * หน่วยเป็น pt ของหน้า PDF ต้นฉบับ (612 x 792) — ดึงจากไฟล์ PDF จริงด้วย PyMuPDF
 * ถ้าฟอร์มถูกปรับ revision ให้ render แม่แบบใหม่แล้วอัปเดตพิกัดในไฟล์นี้
 */

export const FORM_PAGE = { width: 612, height: 792 } as const;
export const TEMPLATE_URL = "/forms/naf-template.png";

/** มุมซ้ายบนของสัญลักษณ์ช่องติ๊ก (Wingdings ❑) */
export type BoxPos = readonly [x: number, y: number];

/** ช่องติ๊กของแต่ละตัวเลือก เรียงตาม sort_order ใน sga_criteria_options (db/seed_sga_criteria.sql) */
export const CHECKBOXES: Record<string, readonly BoxPos[]> = {
  bmi: [
    [126.7, 213.1],
    [210.5, 213.1],
    [292.4, 213.1],
    [126.5, 228.0],
    [209.9, 228.0],
  ],
  albumin: [
    [125.9, 243.2],
    [209.6, 243.2],
    [291.2, 243.2],
  ],
  body_build: [
    [125.6, 258.0],
    [209.6, 258.0],
    [290.8, 258.0],
    [359.5, 258.0],
  ],
  weight_change: [
    [126.4, 272.7],
    [209.4, 272.7],
    [291.7, 272.7],
    [126.5, 287.2],
    [208.4, 287.2],
    [290.5, 287.2],
  ],
  diet_intake_type: [
    [202.2, 302.0],
    [259.1, 302.0],
    [326.3, 302.0],
  ],
  diet_intake_amount: [
    [201.2, 316.9],
    [258.7, 316.9],
    [126.5, 331.2],
    [200.5, 331.2],
    [325.0, 331.2],
  ],
  chewing_swallowing: [
    [158.8, 346.0],
    [214.8, 346.0],
    [356.2, 346.0],
  ],
  gi_symptoms: [
    [214.4, 360.9],
    [271.6, 360.9],
    [214.9, 375.2],
    [335.8, 375.2],
  ],
  functional_capacity: [
    [158.9, 390.0],
    [271.9, 390.0],
    [158.4, 404.4],
  ],
  disease: [
    [64.3, 432.1],
    [136.4, 432.1],
    [228.6, 432.1],
    [64.3, 446.5],
    [191.3, 446.5],
    [294.5, 446.5],
    [64.3, 461.2],
    [216.4, 461.2],
    [64.3, 475.6],
    [167.4, 475.6],
    [64.3, 489.9], // อื่นๆ (กลุ่มคะแนน 3)
    [64.3, 504.2],
    [64.3, 518.6],
    [208.2, 518.6],
    [64.3, 532.9],
    [155.3, 532.9],
    [250.0, 532.9], // อื่นๆ (กลุ่มคะแนน 6)
  ],
};

export const CHECKBOX_SIZE = { width: 9.2, height: 10.4 } as const;
/** กรอบ QR EDScare (มุมซ้ายบน, pt) — วัดจากพื้นที่ว่างบนแม่แบบด้วย PyMuPDF เหมือนพิกัดอื่น */
export const EDS_QR_BOX = { x: 540, y: 20, size: 55 } as const; // ← ค่าชั่วคราว ต้องวัดใหม่

/** ช่วง y (pt) ของแถวในตารางคะแนน */
export const SCORE_ROWS: Record<
  string,
  readonly [top: number, bottom: number]
> = {
  bmi: [213.7, 243.4],
  albumin: [243.4, 258.6],
  body_build: [258.6, 273.5],
  weight_change: [273.5, 302.6],
  diet_intake_type: [302.6, 317.4],
  diet_intake_amount: [317.4, 346.7],
  chewing_swallowing: [346.7, 361.6],
  gi_symptoms: [361.6, 390.6],
  functional_capacity: [390.6, 419.9],
  disease: [419.9, 548.3],
};

/** กึ่งกลางคอลัมน์ "คะแนน ครั้งที่ 1/2/3" (x, pt) */
export const VISIT_COLUMNS = [445.6, 493.6, 541.6] as const;
export const VISIT_COLUMN_WIDTH = 44;

/** baseline (y, pt) ของแถวสรุปท้ายตาราง */
export const SUMMARY_BASELINES = {
  totalScore: 570.2,
  date: 609.4,
  time: 635.0,
  dietitian: 661.6,
} as const;

/** ช่องติ๊ก SGA A/B/C ของแต่ละครั้ง (มุมซ้ายบน) — เรียง A, B, C */
export const SGA_BOXES: readonly (readonly BoxPos[])[] = [
  [
    [426.7, 586.8],
    [439.2, 586.8],
    [451.7, 586.8],
  ],
  [
    [474.7, 586.8],
    [487.1, 586.8],
    [499.6, 586.8],
  ],
  [
    [522.7, 586.8],
    [535.2, 586.8],
    [547.7, 586.8],
  ],
];
export const SGA_BOX_SIZE = { width: 8.3, height: 9.4 } as const;

/** ข้อมูลจาก: ผู้ป่วย / ญาติ / อื่นๆ */
export const INFO_SOURCE_BOXES = {
  patient: [373.1, 131.3],
  relative: [405.5, 131.3],
  other: [435.1, 131.3],
} as const satisfies Record<string, BoxPos>;

/** เส้นประที่ต้องเขียนทับ: x ช่วงเริ่ม-จบ (pt) และ baseline (pt) */
export interface LineField {
  x: number;
  width: number;
  baseline: number;
  size: number;
}

export const FIELDS = {
  // กรอบข้อมูลผู้ป่วยมุมขวาบน (เป็นรูปภาพในไฟล์ต้นฉบับ วัดพิกัดจากภาพ)
  patientName: { x: 366, width: 126, baseline: 25.2, size: 8.5 },
  dateOfBirth: { x: 409, width: 83, baseline: 39.0, size: 8.5 },
  age: { x: 339, width: 153, baseline: 52.2, size: 8.5 },
  hn: { x: 338, width: 56, baseline: 66.0, size: 8.5 },
  vnAn: { x: 421, width: 72, baseline: 66.0, size: 8.5 },
  admitDate: { x: 376, width: 48, baseline: 79.9, size: 8.5 },
  gender: { x: 454, width: 38, baseline: 79.9, size: 8.5 },
  allergies: { x: 352, width: 140, baseline: 93.0, size: 8.5 },

  chiefComplaint: { x: 144, width: 181, baseline: 124.4, size: 9.5 },
  diagnosis: { x: 372, width: 186, baseline: 124.4, size: 9.5 },
  dietOrder: { x: 88, width: 158, baseline: 142.4, size: 9.5 },
  religion: { x: 273, width: 62, baseline: 142.4, size: 9.5 },
  // เส้นประหลังคำว่า "อื่นๆ" ของช่อง ข้อมูลจาก
  infoSourceOther: { x: 463, width: 52, baseline: 142.4, size: 9 },

  height: { x: 79, width: 47, baseline: 207.2, size: 9.5 },
  weight: { x: 191, width: 51, baseline: 207.2, size: 9.5 },
  bmi: { x: 269, width: 51, baseline: 207.2, size: 9.5 },

  // ช่องพิมพ์ชื่อโรคเองของหมวดโรค (อื่นๆ) — อยู่หลังเครื่องหมาย *
  diseaseOther3: { x: 93, width: 120, baseline: 500.2, size: 9 },
  diseaseOther6: { x: 279, width: 116, baseline: 543.2, size: 9 },
} as const satisfies Record<string, LineField>;
