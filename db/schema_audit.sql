-- ============================================================
-- ระบบประเมินภาวะโภชนาการ — Audit log (ใครแก้อะไร ฟอร์มไหน) — MySQL/MariaDB
-- แอปสร้างตารางนี้ให้อัตโนมัติ (CREATE TABLE IF NOT EXISTS) ตอนบันทึกการแก้ไขครั้งแรก
-- ไฟล์นี้ไว้สำหรับรันเองในกรณีที่ user ของแอปไม่มีสิทธิ์ CREATE
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    form_kind   VARCHAR(16)  NOT NULL,          -- sga | mis | calorie
    record_id   INT          NOT NULL,          -- id ของแบบประเมิน/การคำนวณที่ถูกแก้
    hn          VARCHAR(32)  NOT NULL,
    action      VARCHAR(16)  NOT NULL,          -- update
    user_id     INT          NULL,
    user_name   VARCHAR(255) NOT NULL,          -- ชื่อผู้แก้ ณ ตอนที่แก้
    changes     TEXT         NOT NULL,          -- JSON: [{label, from, to}]
    created_at  DATETIME     NOT NULL,          -- UTC เหมือนตารางอื่น
    KEY idx_audit_record (form_kind, record_id),
    KEY idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
