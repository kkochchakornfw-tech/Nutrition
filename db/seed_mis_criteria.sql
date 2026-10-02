-- ============================================================
-- Seed: mis_criteria / mis_criteria_options
-- ต้องตรงกับ src/lib/mis/data.ts ทุกตัว (id, score, label) — แก้พร้อมกันเสมอ
-- รันหลัง schema_mis.sql
-- ============================================================

SET NAMES utf8mb4;

INSERT INTO mis_criteria (id, criteria_key, label_en, section, sort_order) VALUES
(1, 'weight_change', '1. Weight change (overall change in past 6 months)', '(A) Patients related medical history', 1),
(2, 'dietary_intake', '2. Dietary intake', '(A) Patients related medical history', 2),
(3, 'gi_symptoms', '3. Gastrointestinal (GI) symptoms', '(A) Patients related medical history', 3),
(4, 'functional_capacity', '4. Functional capacity (nutritionally related function impairment)', '(A) Patients related medical history', 4),
(5, 'comorbidity', '5. Co-morbidity, including number of years on dialysis', '(A) Patients related medical history', 5),
(6, 'fat_store', '6. Decreased fat store or loss subcutaneous fat (below eyes, triceps, biceps, chest)', '(B) Physical Exam', 6),
(7, 'muscle_wasting', '7. Signs of muscle wasting (temple, clavicle, scapula, ribs, quadriceps, knee, interosseous)', '(B) Physical Exam', 7),
(8, 'bmi', '8. Body Mass Index', '(B) Physical Exam', 8),
(9, 'albumin', '9. Serum albumin', '(B) Physical Exam', 9),
(10, 'tibc', '10. Serum TIBC (Total Iron Binding Capacity)', '(B) Physical Exam', 10);

INSERT INTO mis_criteria_options (id, criteria_id, score, label_en, label_th, sort_order) VALUES
(1, 1, 0, 'No weight change or gain', NULL, 1),
(2, 1, 1, 'Minor weight loss (>=0.5 kg but < 1 kg)', NULL, 2),
(3, 1, 2, 'Weight loss more than 1 kg but <5%', NULL, 3),
(4, 1, 3, 'Weight loss >5%', NULL, 4),

(5, 2, 0, 'No change / Good appetite', NULL, 1),
(6, 2, 1, 'Sub-optimal Solid diet', NULL, 2),
(7, 2, 2, 'Full liquid diet or moderate overall decrease', NULL, 3),
(8, 2, 3, 'Hypo-calorie liquid to starvation', NULL, 4),

(9, 3, 0, 'No symptoms', NULL, 1),
(10, 3, 1, 'Nauseated occasionally', NULL, 2),
(11, 3, 2, 'Vomiting or moderate GI symptoms', NULL, 3),
(12, 3, 3, 'Diarrhea or Severe anorexia', NULL, 4),

(13, 4, 0, 'Normal to improved', NULL, 1),
(14, 4, 1, 'Difficulty with Ambulation', NULL, 2),
(15, 4, 2, 'Difficulty with otherwise independent activities (going to bathroom)', NULL, 3),
(16, 4, 3, 'Bed/chair-ridden with no or little to no physical activity', NULL, 4),

(17, 5, 0, 'On dialysis < 1 year and healthy otherwise', NULL, 1),
(18, 5, 1, 'Dialyzed 1-4 years or mild co-morbidity', NULL, 2),
(19, 5, 2, 'Dialyzed >4 years or moderate co-morbidity', NULL, 3),
(20, 5, 3, 'Very severe multiple co-morbidity', NULL, 4),

(21, 6, 0, 'Normal (no change)', 'บริเวณเบ้าตาดูมีเนื้อมีหนัง / ตำแหน่งชั้นไขมันใต้แขนจับได้มาก', 1),
(22, 6, 1, 'Mild', 'บริเวณเบ้าตาดูมีเนื้อมีหนัง / ตำแหน่งชั้นไขมันใต้แขนจับได้', 2),
(23, 6, 2, 'Moderate', 'เบ้าตาค่อนข้างลึก / ตำแหน่งชั้นไขมันใต้แขนจับได้พอควร', 3),
(24, 6, 3, 'Severe', 'เบ้าตาลึกมาก ผิวหนังใต้ตาเหี่ยว ไม่ตึง / ตำแหน่งชั้นไขมันใต้แขนจับได้บางๆ', 4),

(25, 7, 0, 'Normal (no change)', NULL, 1),
(26, 7, 1, 'Mild', NULL, 2),
(27, 7, 2, 'Moderate', NULL, 3),
(28, 7, 3, 'Severe', NULL, 4),

(29, 8, 0, 'BMI >=20 kg/m2', NULL, 1),
(30, 8, 1, 'BMI 18-19.99 kg/m2', NULL, 2),
(31, 8, 2, 'BMI 16-17.99 kg/m2', NULL, 3),
(32, 8, 3, 'BMI < 16 kg/m2', NULL, 4),

(33, 9, 0, 'Albumin >= 4.0 g/dl', NULL, 1),
(34, 9, 1, 'Albumin 3.5-3.9 g/dl', NULL, 2),
(35, 9, 2, 'Albumin 3.0-3.4 g/dl', NULL, 3),
(36, 9, 3, 'Albumin <= 3.0 g/dl', NULL, 4),

(37, 10, 0, 'TIBC >= 250 ug/dL', NULL, 1),
(38, 10, 1, 'TIBC 200-249 ug/dL', NULL, 2),
(39, 10, 2, 'TIBC 150-199 ug/dL', NULL, 3),
(40, 10, 3, 'TIBC < 150 ug/dL', NULL, 4);
