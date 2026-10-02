import mysql from "mysql2/promise";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Connection pool ไปยัง MySQL/MariaDB (db/schema_v2.sql) — ตั้งค่าใน .env.local
 * ใช้ global singleton กัน pool ใหม่ซ้อนกันตอน hot reload ของ Next.js dev server
 */
declare global {
  var __dbPool: mysql.Pool | undefined;
}

export const pool: mysql.Pool =
  global.__dbPool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4_unicode_ci",
    dateStrings: true,
    decimalNumbers: true,
  });

if (process.env.NODE_ENV !== "production") global.__dbPool = pool;

/**
 * สร้าง/อัปเดตแถวใน users จากผู้ใช้ที่ล็อกอินอยู่ (mock auth ตอนนี้)
 * ต้องเรียกก่อน insert ที่มี FK ไปยัง users(id) เสมอ เพราะ mock session ใช้ id
 * คงที่ (1,2,3) ที่ไม่มีอยู่ใน DB จนกว่าจะ login ครั้งแรก — เมื่อเปลี่ยนไปใช้
 * HIS/AD จริง ฟังก์ชันนี้ยังใช้ต่อได้เลย (upsert ตาม employee_code)
 */
export async function ensureUserRow(user: AuthUser): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, employee_code, full_name, position, department, role, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       position = VALUES(position),
       department = VALUES(department),
       role = VALUES(role),
       last_login_at = NOW()`,
    [user.id, user.employeeCode, user.fullName, user.position, user.department, user.role]
  );
}

/**
 * แปลงไป-กลับระหว่าง ISO datetime (ที่แอปใช้ทุกที่) กับ MySQL DATETIME
 * (เก็บเป็นเวลา UTC แบบ naive ไม่มี timezone — เลือก UTC คงที่เพื่อไม่ให้ผล
 * ขึ้นกับ timezone ของเครื่อง DB server, แปลงกลับเป็น ISO ตอนอ่านเสมอ)
 */
export function toDbDateTime(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
}

export function fromDbDateTime(dbValue: string): string {
  return new Date(`${dbValue.replace(" ", "T")}Z`).toISOString();
}

/**
 * สร้าง/อัปเดตแถวใน patients จากข้อมูลที่มี ณ ตอนบันทึกฟอร์ม (ชื่อล่าสุดเท่านั้น)
 * ต้องเรียกก่อน insert ที่มี FK ไปยัง patients(hn) เสมอ (assessments, calorie_calculations)
 */
export async function ensurePatientRow(hn: string, fullName: string): Promise<void> {
  await pool.query(
    `INSERT INTO patients (hn, full_name)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
    [hn, fullName]
  );
}
