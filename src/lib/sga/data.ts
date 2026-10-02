import type { SgaCriteria } from "./types";

/**
 * Mirrors db/seed_sga_criteria.sql 1:1 — criteria.id และ option.id ตรงกับ
 * AUTO_INCREMENT จริงในตาราง sga_criteria / sga_criteria_options (option
 * id วิ่งต่อเนื่อง 1..53 ข้ามทุกหมวด ไม่ใช่ reset ต่อหมวด) จำเป็นต้องตรงกันเป๊ะ
 * เพราะ assessment_answers.option_id เป็น FK อ้างถึงแถวจริงในตารางนี้
 * ยังคงไว้ในโค้ด (ไม่ query DB ทุกครั้ง) เพื่อความเร็วและ type safety ของ UI;
 * ถ้าแก้ตัวเลือก/คะแนนใน DB ต้องแก้ไฟล์นี้ให้ตรงกันด้วยเสมอ
 */
export const SGA_CRITERIA: SgaCriteria[] = [
  {
    id: 1,
    criteriaKey: "bmi",
    labelTh: "BMI",
    section: "ตัวชี้วัดร่างกาย",
    allowMultiple: false,
    sortOrder: 1,
    options: [
      { id: 1, criteriaId: 1, labelTh: "18.5-24.99 kg/m2", score: 0, isOther: false, sortOrder: 1 },
      { id: 2, criteriaId: 1, labelTh: "17.00-18.49 kg/m2", score: 1, isOther: false, sortOrder: 2 },
      { id: 3, criteriaId: 1, labelTh: "25.00-34.99 kg/m2", score: 1, isOther: false, sortOrder: 3 },
      { id: 4, criteriaId: 1, labelTh: "<=16.99 kg/m2", score: 2, isOther: false, sortOrder: 4 },
      { id: 5, criteriaId: 1, labelTh: ">=35.00 kg/m2", score: 2, isOther: false, sortOrder: 5 },
    ],
  },
  {
    id: 2,
    criteriaKey: "albumin",
    labelTh: "Albumin",
    section: "ตัวชี้วัดร่างกาย",
    allowMultiple: false,
    sortOrder: 2,
    options: [
      { id: 6, criteriaId: 2, labelTh: "3.5-5.5 g/dL", score: 0, isOther: false, sortOrder: 1 },
      { id: 7, criteriaId: 2, labelTh: "<3.5 g/dL", score: 2, isOther: false, sortOrder: 2 },
      { id: 8, criteriaId: 2, labelTh: "<=2.5 g/dL", score: 3, isOther: false, sortOrder: 3 },
    ],
  },
  {
    id: 3,
    criteriaKey: "body_build",
    labelTh: "รูปร่างของผู้ป่วย",
    section: "ตัวชี้วัดร่างกาย",
    allowMultiple: false,
    sortOrder: 3,
    options: [
      { id: 9, criteriaId: 3, labelTh: "ปกติ-อ้วนปานกลาง", score: 0, isOther: false, sortOrder: 1 },
      { id: 10, criteriaId: 3, labelTh: "ผอม", score: 1, isOther: false, sortOrder: 2 },
      { id: 11, criteriaId: 3, labelTh: "ผอมมาก", score: 2, isOther: false, sortOrder: 3 },
      { id: 12, criteriaId: 3, labelTh: "อ้วนมาก", score: 1, isOther: false, sortOrder: 4 },
    ],
  },
  {
    id: 4,
    criteriaKey: "weight_change",
    labelTh: "น้ำหนักที่เปลี่ยนไป",
    section: "ตัวชี้วัดร่างกาย",
    allowMultiple: false,
    sortOrder: 4,
    options: [
      { id: 13, criteriaId: 4, labelTh: "เท่าเดิมหรือเพิ่มขึ้น", score: 0, isOther: false, sortOrder: 1 },
      { id: 14, criteriaId: 4, labelTh: "ลดลงแต่เพิ่มขึ้นแล้ว", score: 0, isOther: false, sortOrder: 2 },
      { id: 15, criteriaId: 4, labelTh: "ลด <5% ใน 1 เดือน", score: 1, isOther: false, sortOrder: 3 },
      { id: 16, criteriaId: 4, labelTh: "ลด <10% ใน 6 เดือน", score: 1, isOther: false, sortOrder: 4 },
      { id: 17, criteriaId: 4, labelTh: "ลด >5% ใน 1 เดือน", score: 2, isOther: false, sortOrder: 5 },
      { id: 18, criteriaId: 4, labelTh: "ลด >10% ใน 6 เดือน", score: 2, isOther: false, sortOrder: 6 },
    ],
  },
  {
    id: 5,
    criteriaKey: "diet_intake_type",
    labelTh: "ลักษณะอาหารที่กินในช่วง 2 สัปดาห์ที่ผ่านมา",
    section: "การกินอาหาร",
    allowMultiple: false,
    sortOrder: 5,
    options: [
      { id: 19, criteriaId: 5, labelTh: "อาหารปกติ", score: 0, isOther: false, sortOrder: 1 },
      { id: 20, criteriaId: 5, labelTh: "โจ๊กหรือข้าวต้ม", score: 1, isOther: false, sortOrder: 2 },
      { id: 21, criteriaId: 5, labelTh: "อาหารเหลวหรือทางสาย", score: 2, isOther: false, sortOrder: 3 },
    ],
  },
  {
    id: 6,
    criteriaKey: "diet_intake_amount",
    labelTh: "ปริมาณอาหารที่กินในช่วง 2 สัปดาห์ที่ผ่านมา",
    section: "การกินอาหาร",
    allowMultiple: false,
    sortOrder: 6,
    options: [
      { id: 22, criteriaId: 6, labelTh: "กินได้ปกติ", score: 0, isOther: false, sortOrder: 1 },
      { id: 23, criteriaId: 6, labelTh: "กินได้มากกว่าครึ่งของปกติ", score: 0, isOther: false, sortOrder: 2 },
      { id: 24, criteriaId: 6, labelTh: "กินได้ครึ่งจากปกติ", score: 1, isOther: false, sortOrder: 3 },
      { id: 25, criteriaId: 6, labelTh: "กินได้น้อยกว่าครึ่งจากปกติ", score: 2, isOther: false, sortOrder: 4 },
      { id: 26, criteriaId: 6, labelTh: "กินไม่ได้เลย", score: 3, isOther: false, sortOrder: 5 },
    ],
  },
  {
    id: 7,
    criteriaKey: "chewing_swallowing",
    labelTh: "ปัญหาทางการเคี้ยว/กลืนอาหาร",
    section: "การกินอาหาร",
    allowMultiple: false,
    sortOrder: 7,
    options: [
      { id: 27, criteriaId: 7, labelTh: "กลืนได้ปกติ", score: 0, isOther: false, sortOrder: 1 },
      { id: 28, criteriaId: 7, labelTh: "เคี้ยว/กลืนลำบาก/ได้อาหารทางสายยาง", score: 2, isOther: false, sortOrder: 2 },
      { id: 29, criteriaId: 7, labelTh: "สำลัก", score: 2, isOther: false, sortOrder: 3 },
    ],
  },
  {
    id: 8,
    criteriaKey: "gi_symptoms",
    labelTh: "ปัญหาระบบทางเดินอาหาร (ท้องเสีย/อาเจียน)",
    section: "การกินอาหาร",
    allowMultiple: false,
    sortOrder: 8,
    options: [
      { id: 30, criteriaId: 8, labelTh: "ไม่มีอาการ", score: 0, isOther: false, sortOrder: 1 },
      { id: 31, criteriaId: 8, labelTh: "มีอาการ <2 สัปดาห์ ไม่เป็นทุกวัน", score: 0, isOther: false, sortOrder: 2 },
      { id: 32, criteriaId: 8, labelTh: "มีอาการ <2 สัปดาห์แต่เป็นทุกวัน", score: 1, isOther: false, sortOrder: 3 },
      { id: 33, criteriaId: 8, labelTh: "มีอาการ >2 สัปดาห์", score: 2, isOther: false, sortOrder: 4 },
    ],
  },
  {
    id: 9,
    criteriaKey: "functional_capacity",
    labelTh: "การทำงาน/การเคลื่อนไหว",
    section: "สมรรถภาพ",
    allowMultiple: false,
    sortOrder: 9,
    options: [
      { id: 34, criteriaId: 9, labelTh: "ทำงาน/เคลื่อนไหวได้ปกติ", score: 0, isOther: false, sortOrder: 1 },
      { id: 35, criteriaId: 9, labelTh: "ทำงานได้ลดลงแต่ยังช่วยตัวเองได้", score: 1, isOther: false, sortOrder: 2 },
      { id: 36, criteriaId: 9, labelTh: "นอนบนเตียง/ต้องมีคนช่วยเหลือตลอดเวลา", score: 2, isOther: false, sortOrder: 3 },
    ],
  },
  {
    id: 10,
    criteriaKey: "disease",
    labelTh: "โรคที่เป็นอยู่ (เลือกได้มากกว่า 1 ข้อ)",
    section: "โรคประจำตัว",
    allowMultiple: true,
    sortOrder: 10,
    options: [
      { id: 37, criteriaId: 10, labelTh: "DM (เบาหวาน)", score: 3, isOther: false, sortOrder: 1 },
      { id: 38, criteriaId: 10, labelTh: "CKD-ESRD (ไตเรื้อรัง)", score: 3, isOther: false, sortOrder: 2 },
      { id: 39, criteriaId: 10, labelTh: "Liver disease (โรคตับ)", score: 3, isOther: false, sortOrder: 3 },
      { id: 40, criteriaId: 10, labelTh: "Septicemia (ติดเชื้อในกระแสเลือด)", score: 3, isOther: false, sortOrder: 4 },
      { id: 41, criteriaId: 10, labelTh: "Solid cancer (มะเร็งทั่วไป)", score: 3, isOther: false, sortOrder: 5 },
      { id: 42, criteriaId: 10, labelTh: "COPD (โรคปอดอุดกั้นเรื้อรัง)", score: 3, isOther: false, sortOrder: 6 },
      { id: 43, criteriaId: 10, labelTh: "Chronic heart failure (หัวใจล้มเหลวเรื้อรัง)", score: 3, isOther: false, sortOrder: 7 },
      { id: 44, criteriaId: 10, labelTh: ">=2 degree of burn (แผลไฟไหม้ระดับ 2 ขึ้นไป)", score: 3, isOther: false, sortOrder: 8 },
      { id: 45, criteriaId: 10, labelTh: "Hip fracture (ข้อสะโพกหัก)", score: 3, isOther: false, sortOrder: 9 },
      { id: 46, criteriaId: 10, labelTh: "Severe head injury", score: 3, isOther: false, sortOrder: 10 },
      { id: 47, criteriaId: 10, labelTh: "อื่นๆ (ระบุ) — กลุ่มคะแนน 3", score: 3, isOther: true, sortOrder: 11 },
      { id: 48, criteriaId: 10, labelTh: "Malignant hematologic disease / Bone marrow transplant", score: 6, isOther: false, sortOrder: 12 },
      { id: 49, criteriaId: 10, labelTh: "Severe pneumonia (ปอดบวมขั้นรุนแรง)", score: 6, isOther: false, sortOrder: 13 },
      { id: 50, criteriaId: 10, labelTh: "Multiple fracture (กระดูกหักหลายตำแหน่ง)", score: 6, isOther: false, sortOrder: 14 },
      { id: 51, criteriaId: 10, labelTh: "Stroke/CVA (อัมพาต)", score: 6, isOther: false, sortOrder: 15 },
      { id: 52, criteriaId: 10, labelTh: "Critically ill (ผู้ป่วยวิกฤต)", score: 6, isOther: false, sortOrder: 16 },
      { id: 53, criteriaId: 10, labelTh: "อื่นๆ (ระบุ) — กลุ่มคะแนน 6", score: 6, isOther: true, sortOrder: 17 },
    ],
  },
];

export function findCriteria(criteriaId: number) {
  return SGA_CRITERIA.find((c) => c.id === criteriaId) ?? null;
}

export function findOption(criteriaId: number, optionId: number) {
  return findCriteria(criteriaId)?.options.find((o) => o.id === optionId) ?? null;
}
