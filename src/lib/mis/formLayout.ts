/**
 * พิกัดบนฟอร์ม M/R-NUT-003.1 Rev.5 (public/forms/mis-template.png)
 * หน่วยเป็น pt ของหน้า PDF ต้นฉบับ (612 x 792) — ดึงจาก PDF จริงด้วย PyMuPDF
 * (ช่องติ๊กวัดจาก glyph Wingdings  ตรง ๆ, ช่องข้อมูลหัวฟอร์ม/รูปผู้ป่วยเป็น
 * ภาพแบนราบในไฟล์ต้นฉบับ — วัด/ประมาณจากภาพแทน เหมือนที่ formLayout.ts ของ SGA ทำ)
 * ถ้าฟอร์มถูกปรับ revision ให้ render แม่แบบใหม่แล้วอัปเดตพิกัดในไฟล์นี้
 */

export const FORM_PAGE = { width: 612, height: 792 } as const;
export const TEMPLATE_URL = "/forms/mis-template.png";

export type BoxPos = readonly [x: number, y: number];

export const CHECKBOX_SIZE = { width: 10.0, height: 11.3 } as const;

/**
 * ช่องติ๊กของ 10 หัวข้อ เรียง [คะแนน0, คะแนน1, คะแนน2, คะแนน3] ต่อแถว
 * คอลัมน์ไม่ตรงกันเป๊ะทุกแถว (ข้อ 4/6 ตัวเลือกยาวจนช่องติ๊กขยับ) — วัดจริงทีละแถว
 */
export const CHECKBOXES: Record<string, readonly BoxPos[]> = {
  weight_change: [
    [225.84, 256.7],
    [317.28, 258.13],
    [415.2, 256.69],
    [513.12, 258.37],
  ],
  dietary_intake: [
    [225.84, 299.53],
    [317.28, 301.09],
    [415.2, 299.53],
    [513.12, 299.53],
  ],
  gi_symptoms: [
    [225.84, 343.81],
    [317.28, 343.81],
    [415.2, 342.25],
    [513.12, 342.25],
  ],
  functional_capacity: [
    [225.84, 386.41],
    [317.28, 386.41],
    [449.04, 384.85],
    [526.92, 384.85],
  ],
  comorbidity: [
    [225.84, 428.53],
    [317.28, 428.53],
    [415.2, 428.53],
    [513.12, 428.53],
  ],
  fat_store: [
    [225.84, 492.85],
    [317.28, 492.85],
    [415.2, 492.85],
    [526.8, 492.85],
  ],
  muscle_wasting: [
    [225.84, 522.49],
    [317.28, 522.49],
    [415.2, 522.49],
    [513.12, 522.49],
  ],
  bmi: [
    [225.84, 567.37],
    [317.28, 565.21],
    [415.2, 565.21],
    [513.12, 565.21],
  ],
  albumin: [
    [225.84, 595.81],
    [317.28, 594.49],
    [415.2, 594.49],
    [513.12, 595.57],
  ],
  tibc: [
    [225.84, 624.49],
    [317.28, 623.17],
    [415.2, 623.17],
    [513.12, 623.17],
  ],
};

/** ช่องติ๊กบทบาทผู้ประเมินท้ายฟอร์ม: [นักกำหนดอาหาร, พยาบาลไตเทียม] */
export const ROLE_BOXES: Record<"dietitian" | "nurse", BoxPos> = {
  dietitian: [262.68, 688.69],
  nurse: [357.12, 688.69],
};

/** กรอบเขียนคะแนนรวม (Malnutrition Score) — กรอบสี่เหลี่ยมเล็กท้ายตารางฝั่งขวา */
export const TOTAL_SCORE_BOX = {
  x: 452.88,
  y: 642.72,
  w: 34.08,
  h: 27.72,
} as const;

/** กรอบรูปผู้ป่วย (บนขวา) — ⚠️ เป็นภาพแบนราบในไฟล์ต้นฉบับ วัดจากภาพ */
export const PHOTO_BOX = { x: 242, y: 21, w: 67, h: 64 } as const;

/** กรอบ QR EDScare — ไม่มีกรอบเตรียมไว้ในแม่แบบ ใช้พื้นที่ว่างมุมขวาบน (เหมือน SGA) */
export const EDS_QR_BOX = { x: 505, y: 20, size: 55 } as const;

/** เส้นประที่ต้องเขียนทับ: x ช่วงเริ่ม-จบ (pt) และ baseline (pt) */
export interface LineField {
  x: number;
  width: number;
  baseline: number;
  size: number;
}

export const FIELDS = {
  // กรอบข้อมูลผู้ป่วยมุมขวาบน (เป็นภาพแบนราบในไฟล์ต้นฉบับ วัดพิกัดจากภาพ — เหมือน SGA)
  patientName: { x: 355, width: 125, baseline: 25.3, size: 8 },
  dateOfBirth: { x: 401, width: 89, baseline: 38.8, size: 8 },
  age: { x: 328, width: 160, baseline: 52.3, size: 8 },
  hn: { x: 342, width: 40, baseline: 65.7, size: 7.5 },
  vnAn: { x: 433, width: 60, baseline: 65.7, size: 7.5 },
  admitDate: { x: 376, width: 50, baseline: 79.2, size: 7 },
  gender: { x: 452, width: 60, baseline: 79.2, size: 7.5 },
  allergies: { x: 362, width: 128, baseline: 92.7, size: 7.5 },

  // หัวฟอร์ม (ข้อความจริงในไฟล์ PDF วัดตรง ๆ ได้)
  date: { x: 70, width: 65, baseline: 129, size: 8 },
  time: { x: 152, width: 40, baseline: 129, size: 8 },
  creatinine: { x: 113, width: 33, baseline: 143, size: 8 },
  bun: { x: 199, width: 41, baseline: 143, size: 8 },
  albuminLab: { x: 341, width: 51, baseline: 143, size: 8 },
  tibcLab: { x: 448, width: 46, baseline: 143, size: 8 },
  comorbidity: { x: 125, width: 165, baseline: 157, size: 8 },
  height: { x: 192, width: 42, baseline: 171, size: 8 },
  dryWeight: { x: 130, width: 50, baseline: 189, size: 8 },
  ibw: { x: 324, width: 62, baseline: 189, size: 8 },
  bmi: { x: 444, width: 65, baseline: 189, size: 8 },
  waist: { x: 128, width: 54, baseline: 204.5, size: 8 },
  arm: { x: 290, width: 64, baseline: 204.5, size: 8 },
  leg: { x: 470, width: 68, baseline: 204.5, size: 8 },

  // ผู้ประเมิน
  assessorName: { x: 100, width: 140, baseline: 701, size: 9 },
} as const satisfies Record<string, LineField>;
