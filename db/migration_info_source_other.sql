-- เพิ่มช่องระบุเองของ "ข้อมูลจาก: อื่นๆ" (SGA)
ALTER TABLE assessments
    ADD COLUMN info_source_other VARCHAR(100) NULL AFTER info_source;
