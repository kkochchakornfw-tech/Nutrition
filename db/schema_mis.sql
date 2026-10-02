-- ============================================================
-- ระบบประเมินภาวะโภชนาการ — MIS Schema (ผู้ป่วยไตเทียม) — MySQL/MariaDB
-- แบบประเมิน M/R-NUT-003.1 Rev.5 (Malnutrition Inflammation Score)
-- รันหลัง schema_v2.sql (อ้างอิง patients/dietitians/users ร่วมกัน)
--
-- ลำดับการรัน: schema_mis.sql → seed_mis_criteria.sql
-- ============================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------
-- 1. MIS_CRITERIA / MIS_CRITERIA_OPTIONS
--    10 หัวข้อคงที่ตามแบบฟอร์มจริง แต่ละหัวข้อมี 4 ตัวเลือกคะแนน 0/1/2/3 เสมอ
--    (ตรงกับ src/lib/mis/data.ts — ต้องแก้ทั้งคู่พร้อมกันถ้าเปลี่ยน)
-- ----------------------------------------------------
CREATE TABLE mis_criteria (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    criteria_key    VARCHAR(50)  NOT NULL UNIQUE,
    label_en        VARCHAR(255) NOT NULL,
    section         VARCHAR(100) NULL,
    sort_order      INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mis_criteria_options (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    criteria_id     INT              NOT NULL,
    score           TINYINT UNSIGNED NOT NULL,   -- 0-3
    label_en        VARCHAR(255)     NOT NULL,
    label_th        VARCHAR(500)     NULL,       -- คำอธิบายเพิ่มเติมภาษาไทย (ใช้กับข้อ 6/7 เท่านั้น)
    sort_order      INT              NOT NULL DEFAULT 0,
    FOREIGN KEY (criteria_id) REFERENCES mis_criteria(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 2. MIS_ASSESSMENTS
--    ประเมินครั้งเดียวจบต่อฟอร์ม (ไม่มีแนวคิด "ครั้งที่ 1/2/3" แบบ SGA)
--    assessor_role: ติ๊ก "นักกำหนดอาหาร" หรือ "พยาบาลไตเทียม" ท้ายฟอร์ม
-- ----------------------------------------------------
CREATE TABLE mis_assessments (
    id                      INT PRIMARY KEY AUTO_INCREMENT,
    hn                      VARCHAR(20) NOT NULL,
    vn_an                   VARCHAR(30) NULL,
    assessed_at             DATETIME NOT NULL,
    assessor_dietitian_id   INT NULL,                  -- FK ไป dietitians(id) เหมือน SGA (ใช้รายชื่อร่วมกัน)
    assessor_name_snapshot  VARCHAR(150) NOT NULL,
    assessor_role           ENUM('dietitian','nurse') NOT NULL DEFAULT 'dietitian',
    created_by_user_id      INT NULL,

    comorbidity_text        TEXT NULL,                 -- โรคประจำตัวร่วม
    serum_creatinine        DECIMAL(6,2) NULL,
    bun                     DECIMAL(6,2) NULL,
    serum_albumin           DECIMAL(4,2) NULL,
    serum_tibc              DECIMAL(6,1) NULL,

    height_cm               DECIMAL(5,1) NULL,
    dry_weight_kg           DECIMAL(5,1) NULL,
    ibw_kg                  DECIMAL(5,1) NULL,         -- Ideal Body Weight
    bmi                     DECIMAL(4,1) NULL,
    waist_cm                DECIMAL(5,1) NULL,
    arm_cm                  DECIMAL(5,1) NULL,
    leg_cm                  DECIMAL(5,1) NULL,

    patient_name_snapshot   VARCHAR(150) NULL,
    allergies_snapshot      TEXT NULL,

    total_score             TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- sum ของ 10 ข้อ (0-30)
    nutrition_status        ENUM('normal','malnutrition') NOT NULL DEFAULT 'normal', -- 0=normal, >=1=malnutrition

    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hn) REFERENCES patients(hn),
    FOREIGN KEY (assessor_dietitian_id) REFERENCES dietitians(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    INDEX idx_hn (hn),
    INDEX idx_assessed_at (assessed_at),
    INDEX idx_assessor_name (assessor_name_snapshot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 3. MIS_ASSESSMENT_ANSWERS
--    ต่างจาก SGA ตรงที่ไม่มี custom_label/not_applicable — ทุกข้อเลือกตัวเลือกคงที่เสมอ
-- ----------------------------------------------------
CREATE TABLE mis_assessment_answers (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id   INT NOT NULL,
    criteria_id     INT NOT NULL,
    option_id       INT NOT NULL,
    score_snapshot  TINYINT UNSIGNED NOT NULL,
    FOREIGN KEY (assessment_id) REFERENCES mis_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES mis_criteria(id),
    FOREIGN KEY (option_id) REFERENCES mis_criteria_options(id),
    INDEX idx_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
