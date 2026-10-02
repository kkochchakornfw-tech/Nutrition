-- ============================================================
-- Seed data: sga_criteria + sga_criteria_options
-- อ้างอิงจากฟอร์ม M/R-NUT-001.1 Rev.4 (01/04/2026)
-- Modified from Nutrition Alert Form — Komindr et al. Asia Pac J Clin Nutr 2013;22(4):516-521
-- รันหลังจากสร้างตารางตาม nutrition_system_schema_v2.sql แล้ว
-- ============================================================

-- ---------- 1. BMI ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('bmi', 'BMI', 'ตัวชี้วัดร่างกาย', 0, 1);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, '18.5-24.99 kg/m2', 0, 1),
(@c, '17.00-18.49 kg/m2', 1, 2),
(@c, '25.00-34.99 kg/m2', 1, 3),
(@c, '<=16.99 kg/m2', 2, 4),
(@c, '>=35.00 kg/m2', 2, 5);

-- ---------- 2. Albumin ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('albumin', 'Albumin', 'ตัวชี้วัดร่างกาย', 0, 2);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, '3.5-5.5 g/dL', 0, 1),
(@c, '<3.5 g/dL', 2, 2),
(@c, '<=2.5 g/dL', 3, 3);

-- ---------- 3. รูปร่างของผู้ป่วย ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('body_build', 'รูปร่างของผู้ป่วย', 'ตัวชี้วัดร่างกาย', 0, 3);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, 'ปกติ-อ้วนปานกลาง', 0, 1),
(@c, 'ผอม', 1, 2),
(@c, 'ผอมมาก', 2, 3),
(@c, 'อ้วนมาก', 1, 4);

-- ---------- 4. น้ำหนักที่เปลี่ยนไป ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('weight_change', 'น้ำหนักที่เปลี่ยนไป', 'ตัวชี้วัดร่างกาย', 0, 4);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, 'เท่าเดิมหรือเพิ่มขึ้น', 0, 1),
(@c, 'ลดลงแต่เพิ่มขึ้นแล้ว', 0, 2),
(@c, 'ลด <5% ใน 1 เดือน', 1, 3),
(@c, 'ลด <10% ใน 6 เดือน', 1, 4),
(@c, 'ลด >5% ใน 1 เดือน', 2, 5),
(@c, 'ลด >10% ใน 6 เดือน', 2, 6);

-- ---------- 5. ลักษณะอาหารที่กินในช่วง 2 สัปดาห์ที่ผ่านมา ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('diet_intake_type', 'ลักษณะอาหารที่กินในช่วง 2 สัปดาห์ที่ผ่านมา', 'การกินอาหาร', 0, 5);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, 'อาหารปกติ', 0, 1),
(@c, 'โจ๊กหรือข้าวต้ม', 1, 2),
(@c, 'อาหารเหลวหรือทางสาย', 2, 3);

-- ---------- 6. ปริมาณอาหารที่กินในช่วง 2 สัปดาห์ที่ผ่านมา ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('diet_intake_amount', 'ปริมาณอาหารที่กินในช่วง 2 สัปดาห์ที่ผ่านมา', 'การกินอาหาร', 0, 6);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, 'กินได้ปกติ', 0, 1),
(@c, 'กินได้มากกว่าครึ่งของปกติ', 0, 2),
(@c, 'กินได้ครึ่งจากปกติ', 1, 3),
(@c, 'กินได้น้อยกว่าครึ่งจากปกติ', 2, 4),
(@c, 'กินไม่ได้เลย', 3, 5);

-- ---------- 7. ปัญหาทางการเคี้ยว/กลืนอาหาร ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('chewing_swallowing', 'ปัญหาทางการเคี้ยว/กลืนอาหาร', 'การกินอาหาร', 0, 7);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, 'กลืนได้ปกติ', 0, 1),
(@c, 'เคี้ยว/กลืนลำบาก/ได้อาหารทางสายยาง', 2, 2),
(@c, 'สำลัก', 2, 3);

-- ---------- 8. ปัญหาระบบทางเดินอาหาร (ท้องเสีย/อาเจียน) ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('gi_symptoms', 'ปัญหาระบบทางเดินอาหาร (ท้องเสีย/อาเจียน)', 'การกินอาหาร', 0, 8);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, 'ไม่มีอาการ', 0, 1),
(@c, 'มีอาการ <2 สัปดาห์ ไม่เป็นทุกวัน', 0, 2),
(@c, 'มีอาการ <2 สัปดาห์แต่เป็นทุกวัน', 1, 3),
(@c, 'มีอาการ >2 สัปดาห์', 2, 4);

-- ---------- 9. การทำงาน/การเคลื่อนไหว ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('functional_capacity', 'การทำงาน/การเคลื่อนไหว', 'สมรรถภาพ', 0, 9);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, sort_order) VALUES
(@c, 'ทำงาน/เคลื่อนไหวได้ปกติ', 0, 1),
(@c, 'ทำงานได้ลดลงแต่ยังช่วยตัวเองได้', 1, 2),
(@c, 'นอนบนเตียง/ต้องมีคนช่วยเหลือตลอดเวลา', 2, 3);

-- ---------- 10. โรคที่เป็นอยู่ (เลือกได้มากกว่า 1 ข้อ) ----------
INSERT INTO sga_criteria (criteria_key, label_th, section, allow_multiple, sort_order)
VALUES ('disease', 'โรคที่เป็นอยู่ (เลือกได้มากกว่า 1 ข้อ)', 'โรคประจำตัว', 1, 10);
SET @c := LAST_INSERT_ID();
INSERT INTO sga_criteria_options (criteria_id, label_th, score, is_other, sort_order) VALUES
(@c, 'DM (เบาหวาน)', 3, 0, 1),
(@c, 'CKD-ESRD (ไตเรื้อรัง)', 3, 0, 2),
(@c, 'Liver disease (โรคตับ)', 3, 0, 3),
(@c, 'Septicemia (ติดเชื้อในกระแสเลือด)', 3, 0, 4),
(@c, 'Solid cancer (มะเร็งทั่วไป)', 3, 0, 5),
(@c, 'COPD (โรคปอดอุดกั้นเรื้อรัง)', 3, 0, 6),
(@c, 'Chronic heart failure (หัวใจล้มเหลวเรื้อรัง)', 3, 0, 7),
(@c, '>=2 degree of burn (แผลไฟไหม้ระดับ 2 ขึ้นไป)', 3, 0, 8),
(@c, 'Hip fracture (ข้อสะโพกหัก)', 3, 0, 9),
(@c, 'Severe head injury', 3, 0, 10),
(@c, 'อื่นๆ (ระบุ) — กลุ่มคะแนน 3', 3, 1, 11),   -- is_other=1: พิมพ์ชื่อโรคเอง + ปรับคะแนนเองตามความหนักเบา
(@c, 'Malignant hematologic disease / Bone marrow transplant', 6, 0, 12),
(@c, 'Severe pneumonia (ปอดบวมขั้นรุนแรง)', 6, 0, 13),
(@c, 'Multiple fracture (กระดูกหักหลายตำแหน่ง)', 6, 0, 14),
(@c, 'Stroke/CVA (อัมพาต)', 6, 0, 15),
(@c, 'Critically ill (ผู้ป่วยวิกฤต)', 6, 0, 16),
(@c, 'อื่นๆ (ระบุ) — กลุ่มคะแนน 6', 6, 1, 17);   -- is_other=1

-- ---------- อ้างอิงระดับผลคะแนนรวม (ใช้ตอนคำนวณ sga_result ใน backend) ----------
-- 0-5   => A : Normal - Mild malnutrition        -> ประเมินซ้ำทุก 7 วัน
-- 6-10  => B : Moderate malnutrition              -> ประเมินระดับลึกภายใน 72 ชั่วโมง
-- >=11  => C : Severe malnutrition                -> ประเมินระดับลึกภายใน 24 ชั่วโมง
