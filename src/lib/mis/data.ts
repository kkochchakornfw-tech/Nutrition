import type { MisCriteria } from "./types";

/**
 * Mirrors db/seed_mis_criteria.sql 1:1 — ตรงกับแบบฟอร์ม M/R-NUT-003.1 Rev.5
 * (Malnutrition Inflammation Score: MIS) เอกสารต้นฉบับใช้คะแนน 0/1/2/3
 * เรียงเป็นคอลัมน์เท่ากันทุกหัวข้อ (ต่างจาก SGA ที่แต่ละหัวข้อมีจำนวนตัวเลือกไม่เท่ากัน)
 * id ของ criteria/option ต้องตรงกับ AUTO_INCREMENT จริงใน DB เพราะเป็น FK
 */
export const MIS_CRITERIA: MisCriteria[] = [
  {
    id: 1,
    criteriaKey: "weight_change",
    labelEn: "1. Weight change (overall change in past 6 months)",
    section: "(A) Patients related medical history",
    sortOrder: 1,
    options: [
      { id: 1, criteriaId: 1, score: 0, labelEn: "No weight change or gain", labelTh: null, sortOrder: 1 },
      { id: 2, criteriaId: 1, score: 1, labelEn: "Minor weight loss (≥0.5 kg but < 1 kg)", labelTh: null, sortOrder: 2 },
      { id: 3, criteriaId: 1, score: 2, labelEn: "Weight loss more than 1 kg but <5%", labelTh: null, sortOrder: 3 },
      { id: 4, criteriaId: 1, score: 3, labelEn: "Weight loss >5%", labelTh: null, sortOrder: 4 },
    ],
  },
  {
    id: 2,
    criteriaKey: "dietary_intake",
    labelEn: "2. Dietary intake",
    section: "(A) Patients related medical history",
    sortOrder: 2,
    options: [
      { id: 5, criteriaId: 2, score: 0, labelEn: "No change / Good appetite", labelTh: null, sortOrder: 1 },
      { id: 6, criteriaId: 2, score: 1, labelEn: "Sub-optimal Solid diet", labelTh: null, sortOrder: 2 },
      { id: 7, criteriaId: 2, score: 2, labelEn: "Full liquid diet or moderate overall decrease", labelTh: null, sortOrder: 3 },
      { id: 8, criteriaId: 2, score: 3, labelEn: "Hypo-calorie liquid to starvation", labelTh: null, sortOrder: 4 },
    ],
  },
  {
    id: 3,
    criteriaKey: "gi_symptoms",
    labelEn: "3. Gastrointestinal (GI) symptoms",
    section: "(A) Patients related medical history",
    sortOrder: 3,
    options: [
      { id: 9, criteriaId: 3, score: 0, labelEn: "No symptoms", labelTh: null, sortOrder: 1 },
      { id: 10, criteriaId: 3, score: 1, labelEn: "Nauseated occasionally", labelTh: null, sortOrder: 2 },
      { id: 11, criteriaId: 3, score: 2, labelEn: "Vomiting or moderate GI symptoms", labelTh: null, sortOrder: 3 },
      { id: 12, criteriaId: 3, score: 3, labelEn: "Diarrhea or Severe anorexia", labelTh: null, sortOrder: 4 },
    ],
  },
  {
    id: 4,
    criteriaKey: "functional_capacity",
    labelEn: "4. Functional capacity (nutritionally related function impairment)",
    section: "(A) Patients related medical history",
    sortOrder: 4,
    options: [
      { id: 13, criteriaId: 4, score: 0, labelEn: "Normal to improved", labelTh: null, sortOrder: 1 },
      { id: 14, criteriaId: 4, score: 1, labelEn: "Difficulty with Ambulation", labelTh: null, sortOrder: 2 },
      { id: 15, criteriaId: 4, score: 2, labelEn: "Difficulty with otherwise independent activities (going to bathroom)", labelTh: null, sortOrder: 3 },
      { id: 16, criteriaId: 4, score: 3, labelEn: "Bed/chair-ridden with no or little to no physical activity", labelTh: null, sortOrder: 4 },
    ],
  },
  {
    id: 5,
    criteriaKey: "comorbidity",
    labelEn: "5. Co-morbidity, including number of years on dialysis",
    section: "(A) Patients related medical history",
    sortOrder: 5,
    options: [
      { id: 17, criteriaId: 5, score: 0, labelEn: "On dialysis < 1 year and healthy otherwise", labelTh: null, sortOrder: 1 },
      { id: 18, criteriaId: 5, score: 1, labelEn: "Dialyzed 1-4 years or mild co-morbidity", labelTh: null, sortOrder: 2 },
      { id: 19, criteriaId: 5, score: 2, labelEn: "Dialyzed >4 years or moderate co-morbidity", labelTh: null, sortOrder: 3 },
      { id: 20, criteriaId: 5, score: 3, labelEn: "Very severe multiple co-morbidity", labelTh: null, sortOrder: 4 },
    ],
  },
  {
    id: 6,
    criteriaKey: "fat_store",
    labelEn: "6. Decreased fat store or loss subcutaneous fat (below eyes, triceps, biceps, chest)",
    section: "(B) Physical Exam",
    sortOrder: 6,
    options: [
      { id: 21, criteriaId: 6, score: 0, labelEn: "Normal (no change)", labelTh: "บริเวณเบ้าตาดูมีเนื้อมีหนัง / ตำแหน่งชั้นไขมันใต้แขนจับได้มาก", sortOrder: 1 },
      { id: 22, criteriaId: 6, score: 1, labelEn: "Mild", labelTh: "บริเวณเบ้าตาดูมีเนื้อมีหนัง / ตำแหน่งชั้นไขมันใต้แขนจับได้", sortOrder: 2 },
      { id: 23, criteriaId: 6, score: 2, labelEn: "Moderate", labelTh: "เบ้าตาค่อนข้างลึก / ตำแหน่งชั้นไขมันใต้แขนจับได้พอควร", sortOrder: 3 },
      { id: 24, criteriaId: 6, score: 3, labelEn: "Severe", labelTh: "เบ้าตาลึกมาก ผิวหนังใต้ตาเหี่ยว ไม่ตึง / ตำแหน่งชั้นไขมันใต้แขนจับได้บางๆ", sortOrder: 4 },
    ],
  },
  {
    id: 7,
    criteriaKey: "muscle_wasting",
    labelEn: "7. Signs of muscle wasting (temple, clavicle, scapula, ribs, quadriceps, knee, interosseous)",
    section: "(B) Physical Exam",
    sortOrder: 7,
    options: [
      { id: 25, criteriaId: 7, score: 0, labelEn: "Normal (no change)", labelTh: null, sortOrder: 1 },
      { id: 26, criteriaId: 7, score: 1, labelEn: "Mild", labelTh: null, sortOrder: 2 },
      { id: 27, criteriaId: 7, score: 2, labelEn: "Moderate", labelTh: null, sortOrder: 3 },
      { id: 28, criteriaId: 7, score: 3, labelEn: "Severe", labelTh: null, sortOrder: 4 },
    ],
  },
  {
    id: 8,
    criteriaKey: "bmi",
    labelEn: "8. Body Mass Index",
    section: "(B) Physical Exam",
    sortOrder: 8,
    options: [
      { id: 29, criteriaId: 8, score: 0, labelEn: "BMI ≥20 kg/m²", labelTh: null, sortOrder: 1 },
      { id: 30, criteriaId: 8, score: 1, labelEn: "BMI 18-19.99 kg/m²", labelTh: null, sortOrder: 2 },
      { id: 31, criteriaId: 8, score: 2, labelEn: "BMI 16-17.99 kg/m²", labelTh: null, sortOrder: 3 },
      { id: 32, criteriaId: 8, score: 3, labelEn: "BMI < 16 kg/m²", labelTh: null, sortOrder: 4 },
    ],
  },
  {
    id: 9,
    criteriaKey: "albumin",
    labelEn: "9. Serum albumin",
    section: "(B) Physical Exam",
    sortOrder: 9,
    options: [
      { id: 33, criteriaId: 9, score: 0, labelEn: "Albumin ≥ 4.0 g/dl", labelTh: null, sortOrder: 1 },
      { id: 34, criteriaId: 9, score: 1, labelEn: "Albumin 3.5-3.9 g/dl", labelTh: null, sortOrder: 2 },
      { id: 35, criteriaId: 9, score: 2, labelEn: "Albumin 3.0-3.4 g/dl", labelTh: null, sortOrder: 3 },
      { id: 36, criteriaId: 9, score: 3, labelEn: "Albumin ≤ 3.0 g/dl", labelTh: null, sortOrder: 4 },
    ],
  },
  {
    id: 10,
    criteriaKey: "tibc",
    labelEn: "10. Serum TIBC (Total Iron Binding Capacity)",
    section: "(B) Physical Exam",
    sortOrder: 10,
    options: [
      { id: 37, criteriaId: 10, score: 0, labelEn: "TIBC ≥ 250 ug/dL", labelTh: null, sortOrder: 1 },
      { id: 38, criteriaId: 10, score: 1, labelEn: "TIBC 200-249 ug/dL", labelTh: null, sortOrder: 2 },
      { id: 39, criteriaId: 10, score: 2, labelEn: "TIBC 150-199 ug/dL", labelTh: null, sortOrder: 3 },
      { id: 40, criteriaId: 10, score: 3, labelEn: "TIBC < 150 ug/dL", labelTh: null, sortOrder: 4 },
    ],
  },
];

export function findMisCriteria(criteriaId: number) {
  return MIS_CRITERIA.find((c) => c.id === criteriaId) ?? null;
}

export function findMisOption(criteriaId: number, optionId: number) {
  return findMisCriteria(criteriaId)?.options.find((o) => o.id === optionId) ?? null;
}
