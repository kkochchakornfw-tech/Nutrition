import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "@/lib/db";

/** ตัวเลือกในช่อง "ผู้ประเมิน (Dietitian)" — ไม่ผูกกับบัญชีล็อกอิน */
export interface Assessor {
  id: number;
  fullName: string;
}

/** แถวเต็มสำหรับหน้า admin (รวมที่ปิดใช้งานแล้ว) */
export interface DietitianRow {
  id: number;
  fullName: string;
  isActive: boolean;
  sortOrder: number;
}

/** รายชื่อที่ active เท่านั้น เรียงตาม sort_order — ใช้เติม dropdown ในฟอร์มประเมิน */
export async function listAssessors(): Promise<Assessor[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, full_name FROM dietitians WHERE is_active = 1 ORDER BY sort_order, id"
  );
  return rows.map((r) => ({ id: r.id, fullName: r.full_name }));
}

/** ทุกแถวรวมที่ปิดใช้งานแล้ว — ใช้ในหน้า admin เท่านั้น */
export async function listAllDietitians(): Promise<DietitianRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, full_name, is_active, sort_order FROM dietitians ORDER BY sort_order, id"
  );
  return rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    isActive: r.is_active === 1,
    sortOrder: r.sort_order,
  }));
}

export async function createDietitian(fullName: string): Promise<DietitianRow> {
  const [maxRow] = await pool.query<RowDataPacket[]>(
    "SELECT COALESCE(MAX(sort_order), 0) AS maxSort FROM dietitians"
  );
  const sortOrder = Number(maxRow[0].maxSort) + 1;
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO dietitians (full_name, sort_order) VALUES (?, ?)",
    [fullName, sortOrder]
  );
  return { id: result.insertId, fullName, isActive: true, sortOrder };
}

export async function updateDietitian(
  id: number,
  patch: { fullName?: string; isActive?: boolean }
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (patch.fullName !== undefined) {
    sets.push("full_name = ?");
    values.push(patch.fullName);
  }
  if (patch.isActive !== undefined) {
    sets.push("is_active = ?");
    values.push(patch.isActive ? 1 : 0);
  }
  if (sets.length === 0) return;
  values.push(id);
  await pool.query(`UPDATE dietitians SET ${sets.join(", ")} WHERE id = ?`, values);
}
