import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/lib/db";
import type { FoodExchange } from "./foods";

interface FoodItemRow extends RowDataPacket {
  id: number;
  item_key: string;
  label_th: string;
  fac_cho: string | number;
  fac_pro: string | number;
  fac_fat: string | number;
  fac_kcal: string | number;
  is_manual: number;
  sort_order: number;
}

/** master ตาราง 3 จาก DB เรียงตาม sort_order — ใช้แทน FOOD_EXCHANGES ตอนคำนวณ/แสดงผลจริง */
export async function getFoodExchangeItems(): Promise<FoodExchange[]> {
  const [rows] = await pool.query<FoodItemRow[]>(
    "SELECT item_key, label_th, fac_cho, fac_pro, fac_fat, fac_kcal, is_manual FROM food_exchange_items WHERE item_key <> 'starch' ORDER BY sort_order"
  );
  return rows.map((r) => ({
    key: r.item_key,
    labelTh: r.label_th,
    facCho: Number(r.fac_cho),
    facPro: Number(r.fac_pro),
    facFat: Number(r.fac_fat),
    facKcal: Number(r.fac_kcal),
    manual: r.is_manual === 1,
  }));
}

export interface FoodItemAdminRow extends FoodExchange {
  id: number;
  sortOrder: number;
}

/** เหมือน getFoodExchangeItems แต่มี id/sortOrder ด้วย — ใช้ในหน้า admin */
export async function listFoodExchangeItemsAdmin(): Promise<FoodItemAdminRow[]> {
  const [rows] = await pool.query<FoodItemRow[]>(
    "SELECT id, item_key, label_th, fac_cho, fac_pro, fac_fat, fac_kcal, is_manual, sort_order FROM food_exchange_items WHERE item_key <> 'starch' ORDER BY sort_order"
  );
  return rows.map((r) => ({
    id: r.id,
    key: r.item_key,
    labelTh: r.label_th,
    facCho: Number(r.fac_cho),
    facPro: Number(r.fac_pro),
    facFat: Number(r.fac_fat),
    facKcal: Number(r.fac_kcal),
    manual: r.is_manual === 1,
    sortOrder: r.sort_order,
  }));
}

/**
 * แก้ label/ค่า fac ของรายการที่มีอยู่แล้วเท่านั้น (ระบุด้วย item_key ซึ่งคงที่)
 * ไม่เปิดให้เพิ่ม/ลบรายการหรือแก้ is_manual/sort_order ผ่านหน้านี้ เพราะ key ผูกกับ
 * การจัดหมวดในธงโภชนาการ (src/lib/calorie/flag.ts) — เพิ่ม/ลบรายการทำได้เฉพาะแก้โค้ด
 */
export async function updateFoodExchangeItem(
  itemKey: string,
  patch: { labelTh?: string; facCho?: number; facPro?: number; facFat?: number; facKcal?: number }
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (patch.labelTh !== undefined) {
    sets.push("label_th = ?");
    values.push(patch.labelTh);
  }
  if (patch.facCho !== undefined) {
    sets.push("fac_cho = ?");
    values.push(patch.facCho);
  }
  if (patch.facPro !== undefined) {
    sets.push("fac_pro = ?");
    values.push(patch.facPro);
  }
  if (patch.facFat !== undefined) {
    sets.push("fac_fat = ?");
    values.push(patch.facFat);
  }
  if (patch.facKcal !== undefined) {
    sets.push("fac_kcal = ?");
    values.push(patch.facKcal);
  }
  if (sets.length === 0) return;
  values.push(itemKey);
  await pool.query(`UPDATE food_exchange_items SET ${sets.join(", ")} WHERE item_key = ?`, values);
}
