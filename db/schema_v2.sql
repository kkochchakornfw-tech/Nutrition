-- ============================================================
-- ระบบประเมินภาวะโภชนาการ — Database Schema v2 — MySQL/MariaDB
-- อัปเดตจาก v1 หลังได้ไฟล์ฟอร์มจริง (M/R-NUT-001.1 Rev.4) ที่อ่านได้ชัดเจน 100%
-- ส่วนที่เปลี่ยนจาก v1 มีคอมเมนต์ "-- [v2]" กำกับไว้ทุกจุด
-- [v3] เพิ่มตาราง dietitians, calorie_calculations(+foods), food_exchange_items
--      ผู้ประเมินใน assessments เปลี่ยนจาก users → dietitians (ไม่ผูกบัญชีล็อกอิน)
--      ทุกตารางใช้ utf8mb4 เพื่อเก็บภาษาไทย
--
-- ลำดับการรัน: schema_v2.sql → seed_sga_criteria.sql → seed_master_data.sql
-- ============================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------
-- 1. USERS  (ไม่เปลี่ยนจาก v1)
-- ----------------------------------------------------
CREATE TABLE users (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    employee_code   VARCHAR(20)  NOT NULL UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    position        VARCHAR(100) NULL,
    department      VARCHAR(100) NULL,
    role            ENUM('admin','assessor','viewer') NOT NULL DEFAULT 'assessor',
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    last_login_at   DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 2. PATIENTS  (cache จาก HIS ผ่าน HN)
--    [v2] เพิ่ม allergies_text — ฟอร์มมีช่อง Allergies ที่หัวกระดาษ เก็บ cache แบบเดียวกับ diagnosis
-- ----------------------------------------------------
CREATE TABLE patients (
    hn              VARCHAR(20)  PRIMARY KEY,
    full_name       VARCHAR(150) NULL,
    gender          ENUM('M','F','Other') NULL,
    date_of_birth   DATE         NULL,
    ward            VARCHAR(100) NULL,
    admit_date      DATE         NULL,
    diagnosis_text  TEXT         NULL,
    allergies_text  TEXT         NULL,          -- [v2]
    last_synced_at  DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 3. SGA_CRITERIA / SGA_CRITERIA_OPTIONS
--    [v2] เพิ่ม is_other บน options — สำหรับตัวเลือก "อื่นๆ" ในหมวดโรคที่เป็นอยู่
--    ซึ่งฟอร์มระบุว่า "หากไม่ตรงโรคที่มี ให้คะแนนตามความหนักเบา"
--    หมายถึงผู้ประเมินพิมพ์ชื่อโรคเอง + กำหนดคะแนนเองตามดุลยพินิจ (ไม่ใช่คะแนนตายตัว)
-- ----------------------------------------------------
CREATE TABLE sga_criteria (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    criteria_key    VARCHAR(50)  NOT NULL UNIQUE,
    label_th        VARCHAR(255) NOT NULL,
    section         VARCHAR(100) NULL,
    allow_multiple  TINYINT(1)   NOT NULL DEFAULT 0,
    sort_order      INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sga_criteria_options (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    criteria_id     INT           NOT NULL,
    label_th        VARCHAR(255)  NOT NULL,
    score           DECIMAL(4,1)  NOT NULL,      -- ค่าเริ่มต้น/ค่าอ้างอิง (option ปกติ) หรือค่าตั้งต้นของ "อื่นๆ"
    is_other        TINYINT(1)    NOT NULL DEFAULT 0,  -- [v2] 1 = ต้องกรอกชื่อโรค + คะแนนเอง
    sort_order      INT           NOT NULL DEFAULT 0,
    FOREIGN KEY (criteria_id) REFERENCES sga_criteria(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 3b. DIETITIANS  [v3]
--     รายชื่อผู้ประเมิน (Dietitian) สำหรับ dropdown ในฟอร์ม — แยกจาก users (บัญชีล็อกอินมาจาก HIS/AD)
--     ไม่ลบรายชื่อ ใช้ is_active = 0 แทน เพราะผูกกับประวัติการประเมินเดิม
-- ----------------------------------------------------
CREATE TABLE dietitians (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    full_name       VARCHAR(150) NOT NULL UNIQUE,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 4. ASSESSMENTS
--    [v2] เพิ่มฟิลด์ที่เจอในฟอร์มจริงแต่ยังไม่มีใน v1:
--    chief_complaint, diet_order, religion, info_source, vn_an,
--    allergies_snapshot, height_cm, weight_kg, bmi
--    [v2] เปลี่ยน assessed_date -> assessed_at (DATETIME) รวมช่อง "วันเดือนปี" + "เวลา" เป็นค่าเดียว
-- ----------------------------------------------------
CREATE TABLE assessments (
    id                     INT PRIMARY KEY AUTO_INCREMENT,
    hn                     VARCHAR(20) NOT NULL,
    vn_an                  VARCHAR(30) NULL,            -- [v2] Visit/Admit No. จากหัวฟอร์ม
    visit_no               TINYINT UNSIGNED NOT NULL,   -- ครั้งที่ 1/2/3
    assessed_at            DATETIME NOT NULL,           -- [v2] เดิมคือ assessed_date (DATE)
    assessor_dietitian_id  INT NULL,                    -- [v3] เดิม assessor_user_id → users
    assessor_name_snapshot VARCHAR(150) NOT NULL,       -- [v3] ชื่อผู้ประเมิน ณ วันที่ประเมิน (ใช้แสดง/กรองประวัติ)
    created_by_user_id     INT NULL,

    chief_complaint        TEXT NULL,                   -- [v2] อาการสำคัญที่มาโรงพยาบาล
    diet_order              VARCHAR(255) NULL,           -- [v2]
    religion                VARCHAR(50) NULL,            -- [v2] ศาสนา
    info_source             ENUM('patient','relative','other') NULL,  -- [v2] ข้อมูลจาก

    height_cm               DECIMAL(5,1) NULL,           -- [v2] ส่วนสูง (ต่อครั้งที่ประเมิน)
    weight_kg               DECIMAL(5,1) NULL,           -- [v2] น้ำหนักปัจจุบัน
    bmi                     DECIMAL(4,1) NULL,           -- [v2] คำนวณจาก height/weight เก็บไว้เพื่ออ้างอิงย้อนหลัง

    patient_name_snapshot   VARCHAR(150) NULL,
    diagnosis_snapshot      TEXT NULL,
    allergies_snapshot      TEXT NULL,                   -- [v2]

    total_score             DECIMAL(5,1) NOT NULL DEFAULT 0,
    sga_result               ENUM('A','B','C') NULL,     -- 0-5=A, 6-10=B, >=11=C
    created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hn) REFERENCES patients(hn),
    FOREIGN KEY (assessor_dietitian_id) REFERENCES dietitians(id),   -- [v3]
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    INDEX idx_hn (hn),
    INDEX idx_hn_visit (hn, visit_no),
    INDEX idx_assessed_at (assessed_at),                -- [v3] กรองประวัติตามวันที่
    INDEX idx_assessor_name (assessor_name_snapshot)    -- [v3] กรองประวัติตามผู้ประเมิน
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 5. ASSESSMENT_ANSWERS
--    [v2] เพิ่ม custom_label — เก็บชื่อโรคที่พิมพ์เองเมื่อเลือก option ที่ is_other = 1
--    score_snapshot ในกรณีนี้ = คะแนนที่ผู้ประเมินกำหนดเอง (ไม่ใช่ค่าจาก master)
-- ----------------------------------------------------
CREATE TABLE assessment_answers (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id   INT NOT NULL,
    criteria_id     INT NOT NULL,
    option_id       INT NOT NULL,
    custom_label    VARCHAR(255) NULL,   -- [v2] ใช้เมื่อ option.is_other = 1 เท่านั้น
    score_snapshot  DECIMAL(4,1) NOT NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES sga_criteria(id),
    FOREIGN KEY (option_id) REFERENCES sga_criteria_options(id),
    INDEX idx_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 6. CALORIE_CALCULATIONS (เมนู 2: คำนวณแคลอรี่/สัดส่วนสารอาหาร ตาราง 1–2)
--    เก็บค่าที่กรอก + ผลคำนวณ ณ เวลาที่บันทึก (snapshot) — เปอร์เซ็นต์เก็บเป็นเลขเต็มร้อย
--    mode = 'percent' (โหมด A: กรอก %CHO/%PRO/%FAT) | 'protein' (โหมด B: กรอก factor protein + %FAT)
--    หมายเหตุ: hn อ้างอิง patients — backend ต้อง upsert patients ก่อน (รวมกรณีกรอกชื่อเองเมื่อไม่พบใน HIS)
--             เช่นเดียวกับตาราง assessments
-- ----------------------------------------------------
CREATE TABLE calorie_calculations (
    id                      INT PRIMARY KEY AUTO_INCREMENT,
    hn                      VARCHAR(20) NOT NULL,
    patient_name_snapshot   VARCHAR(255) NOT NULL,
    calculated_at           DATETIME NOT NULL,
    performed_by            VARCHAR(255) NOT NULL,
    created_by_user_id      INT NOT NULL,
    note                    TEXT NULL,

    weight_kg               DECIMAL(5,1) NOT NULL,
    factor_cal              DECIMAL(5,1) NOT NULL,       -- kcal/kg/day
    mode                    ENUM('percent','protein') NOT NULL,
    pct_cho_input           DECIMAL(5,1) NULL,           -- โหมด A
    pct_pro_input           DECIMAL(5,1) NULL,           -- โหมด A
    pct_fat_input           DECIMAL(5,1) NULL,           -- ทั้ง 2 โหมด
    factor_protein          DECIMAL(4,2) NULL,           -- โหมด B: g/kg/day

    total_energy_kcal       DECIMAL(7,1) NOT NULL,
    cho_g                   DECIMAL(7,1) NOT NULL,
    pro_g                   DECIMAL(7,1) NOT NULL,
    fat_g                   DECIMAL(7,1) NOT NULL,
    cho_pct                 DECIMAL(5,1) NOT NULL,
    pro_pct                 DECIMAL(5,1) NOT NULL,
    fat_pct                 DECIMAL(5,1) NOT NULL,

    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hn) REFERENCES patients(hn),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    INDEX idx_hn (hn),
    INDEX idx_calculated_at (calculated_at),
    INDEX idx_performed_by (performed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 7. FOOD_EXCHANGE_ITEMS (master ตาราง 3: รายการอาหาร + ค่า fac ต่อ 1 ส่วน)
--    อ้างอิงชีต "คำนวนพลังงาน" ในไฟล์ อาหารทางการแพทย์และคำนวนพลังงาน.xlsx
--    is_manual = 1 → ผู้ใช้กรอก CHO/PRO/FAT/kcal เอง ไม่คูณ fac (นมโปรตีน)
-- ----------------------------------------------------
CREATE TABLE food_exchange_items (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    item_key    VARCHAR(50) NOT NULL UNIQUE,
    label_th    VARCHAR(255) NOT NULL,
    fac_cho     DECIMAL(5,1) NOT NULL DEFAULT 0,
    fac_pro     DECIMAL(5,1) NOT NULL DEFAULT 0,
    fac_fat     DECIMAL(5,1) NOT NULL DEFAULT 0,
    fac_kcal    DECIMAL(6,1) NOT NULL DEFAULT 0,
    is_manual   TINYINT(1) NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 8. CALORIE_CALCULATION_FOODS (ตาราง 3 ต่อการคำนวณ — snapshot fac ณ ตอนบันทึก)
-- ----------------------------------------------------
CREATE TABLE calorie_calculation_foods (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    calculation_id      INT NOT NULL,
    item_id             INT NOT NULL,
    portions            DECIMAL(5,2) NOT NULL DEFAULT 1,
    fac_cho_snapshot    DECIMAL(5,1) NOT NULL,
    fac_pro_snapshot    DECIMAL(5,1) NOT NULL,
    fac_fat_snapshot    DECIMAL(5,1) NOT NULL,
    fac_kcal_snapshot   DECIMAL(6,1) NOT NULL,
    cho_g               DECIMAL(7,1) NOT NULL,   -- manual: ค่าที่ผู้ใช้กรอก / อื่น ๆ: fac × portions
    pro_g               DECIMAL(7,1) NOT NULL,
    fat_g               DECIMAL(7,1) NOT NULL,
    kcal                DECIMAL(7,1) NOT NULL,
    FOREIGN KEY (calculation_id) REFERENCES calorie_calculations(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES food_exchange_items(id),
    INDEX idx_calculation (calculation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
