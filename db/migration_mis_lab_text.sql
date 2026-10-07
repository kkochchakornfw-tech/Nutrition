-- ผลตรวจทางห้องปฏิบัติการของแบบประเมิน MIS เปลี่ยนจากตัวเลข (DECIMAL) เป็นข้อความ เพราะผู้ใช้ต้องพิมพ์ตัวอักษรได้
ALTER TABLE mis_assessments
    MODIFY serum_creatinine VARCHAR(50) NULL,
    MODIFY bun              VARCHAR(50) NULL,
    MODIFY serum_albumin    VARCHAR(50) NULL,
    MODIFY serum_tibc       VARCHAR(50) NULL;
