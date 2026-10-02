import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool, ensurePatientRow, toDbDateTime, fromDbDateTime } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { calcFoodPlan, calcMacros } from "./calc";
import { getFoodExchangeItems } from "./foodsRepo";
import type { CalorieCalculation, CreateCalorieInput, FoodLine, FoodPlan, MacroMode } from "./types";

/** เชื่อมกับ MySQL จริงผ่าน db/schema_v2.sql (calorie_calculations / _foods / food_exchange_items) */

interface CalcRow extends RowDataPacket {
  id: number;
  hn: string;
  patient_name_snapshot: string;
  calculated_at: string;
  performed_by: string;
  created_by_user_id: number;
  note: string | null;
  weight_kg: string | number;
  factor_cal: string | number;
  mode: MacroMode;
  pct_cho_input: string | number | null;
  pct_pro_input: string | number | null;
  pct_fat_input: string | number | null;
  factor_protein: string | number | null;
  total_energy_kcal: string | number;
  cho_g: string | number;
  pro_g: string | number;
  fat_g: string | number;
  cho_pct: string | number;
  pro_pct: string | number;
  fat_pct: string | number;
}

interface FoodRow extends RowDataPacket {
  item_key: string;
  label_th: string;
  is_manual: number;
  portions: string | number;
  fac_cho_snapshot: string | number;
  fac_pro_snapshot: string | number;
  fac_fat_snapshot: string | number;
  fac_kcal_snapshot: string | number;
  cho_g: string | number;
  pro_g: string | number;
  fat_g: string | number;
  kcal: string | number;
}

interface FoodMasterRow extends RowDataPacket {
  id: number;
  item_key: string;
}

function toCalculation(r: CalcRow, foodPlan: FoodPlan): CalorieCalculation {
  return {
    id: r.id,
    hn: r.hn,
    patientNameSnapshot: r.patient_name_snapshot,
    calculatedAt: fromDbDateTime(r.calculated_at),
    performedBy: r.performed_by,
    createdByUserId: r.created_by_user_id,
    note: r.note,
    inputs: {
      weightKg: Number(r.weight_kg),
      factorCal: Number(r.factor_cal),
      mode: r.mode,
      pctCho: r.pct_cho_input === null ? undefined : Number(r.pct_cho_input),
      pctPro: r.pct_pro_input === null ? undefined : Number(r.pct_pro_input),
      pctFat: r.pct_fat_input === null ? undefined : Number(r.pct_fat_input),
      factorProtein: r.factor_protein === null ? undefined : Number(r.factor_protein),
    },
    result: {
      totalEnergy: Number(r.total_energy_kcal),
      cho: { grams: Number(r.cho_g), pct: Number(r.cho_pct), kcal: (Number(r.cho_g) * 4) },
      pro: { grams: Number(r.pro_g), pct: Number(r.pro_pct), kcal: (Number(r.pro_g) * 4) },
      fat: { grams: Number(r.fat_g), pct: Number(r.fat_pct), kcal: (Number(r.fat_g) * 9) },
    },
    foodPlan,
  };
}

function toFoodPlan(rows: FoodRow[]): FoodPlan {
  const lines: FoodLine[] = rows.map((r) => ({
    key: r.item_key,
    labelTh: r.label_th,
    manual: r.is_manual === 1,
    portions: Number(r.portions),
    facCho: Number(r.fac_cho_snapshot),
    facPro: Number(r.fac_pro_snapshot),
    facFat: Number(r.fac_fat_snapshot),
    facKcal: Number(r.fac_kcal_snapshot),
    cho: Number(r.cho_g),
    pro: Number(r.pro_g),
    fat: Number(r.fat_g),
    kcal: Number(r.kcal),
  }));
  const totals = lines.reduce(
    (t, l) => ({ cho: t.cho + l.cho, pro: t.pro + l.pro, fat: t.fat + l.fat, kcal: t.kcal + l.kcal }),
    { cho: 0, pro: 0, fat: 0, kcal: 0 }
  );
  return { lines, totals };
}

async function fetchFoodPlan(calculationId: number): Promise<FoodPlan> {
  const [rows] = await pool.query<FoodRow[]>(
    `SELECT i.item_key, i.label_th, i.is_manual,
            f.portions, f.fac_cho_snapshot, f.fac_pro_snapshot, f.fac_fat_snapshot, f.fac_kcal_snapshot,
            f.cho_g, f.pro_g, f.fat_g, f.kcal
     FROM calorie_calculation_foods f
     JOIN food_exchange_items i ON i.id = f.item_id
     WHERE f.calculation_id = ?
     ORDER BY i.sort_order`,
    [calculationId]
  );
  return toFoodPlan(rows);
}

export async function createCalculation(
  input: CreateCalorieInput & { performedBy: string; createdByUserId: number }
): Promise<CalorieCalculation> {
  // คำนวณซ้ำฝั่ง server จากค่าที่กรอก ไม่เชื่อผลที่ client ส่งมา
  const outcome = calcMacros(input.inputs);
  if (!outcome.ok) throw new ValidationError(outcome.error);
  const { result } = outcome;

  await ensurePatientRow(input.hn, input.patientNameSnapshot);

  const [insertResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO calorie_calculations
       (hn, patient_name_snapshot, calculated_at, performed_by, created_by_user_id, note,
        weight_kg, factor_cal, mode, pct_cho_input, pct_pro_input, pct_fat_input, factor_protein,
        total_energy_kcal, cho_g, pro_g, fat_g, cho_pct, pro_pct, fat_pct)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.hn,
      input.patientNameSnapshot,
      toDbDateTime(new Date().toISOString()),
      input.performedBy,
      input.createdByUserId,
      input.note,
      input.inputs.weightKg,
      input.inputs.factorCal,
      input.inputs.mode,
      input.inputs.pctCho ?? null,
      input.inputs.pctPro ?? null,
      input.inputs.pctFat ?? null,
      input.inputs.factorProtein ?? null,
      result.totalEnergy,
      result.cho.grams,
      result.pro.grams,
      result.fat.grams,
      result.cho.pct,
      result.pro.pct,
      result.fat.pct,
    ]
  );
  const calculationId = insertResult.insertId;

  // ใช้ fac ล่าสุดจาก DB (ที่ admin แก้ได้) ไม่ใช่ค่า default ที่ผูกมากับโค้ด
  const foodMaster = await getFoodExchangeItems();
  const plan = calcFoodPlan(input.foods ?? [], foodMaster);
  const [itemRows] = await pool.query<FoodMasterRow[]>("SELECT id, item_key FROM food_exchange_items");
  const idByKey = new Map(itemRows.map((r) => [r.item_key, r.id]));

  const rowsToInsert = plan.lines
    .map((l) => ({ itemId: idByKey.get(l.key), line: l }))
    .filter((x): x is { itemId: number; line: FoodLine } => x.itemId !== undefined);

  if (rowsToInsert.length > 0) {
    await pool.query(
      `INSERT INTO calorie_calculation_foods
         (calculation_id, item_id, portions, fac_cho_snapshot, fac_pro_snapshot, fac_fat_snapshot, fac_kcal_snapshot,
          cho_g, pro_g, fat_g, kcal)
       VALUES ${rowsToInsert.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}`,
      rowsToInsert.flatMap(({ itemId, line: l }) => [
        calculationId,
        itemId,
        l.portions,
        l.facCho,
        l.facPro,
        l.facFat,
        l.facKcal,
        l.cho,
        l.pro,
        l.fat,
        l.kcal,
      ])
    );
  }

  const created = await getCalculationById(calculationId);
  if (!created) throw new Error("บันทึกสำเร็จแต่อ่านข้อมูลที่บันทึกกลับไม่ได้");
  return created;
}

export async function getCalculationById(id: number): Promise<CalorieCalculation | null> {
  const [rows] = await pool.query<CalcRow[]>("SELECT * FROM calorie_calculations WHERE id = ? LIMIT 1", [id]);
  const row = rows[0];
  if (!row) return null;
  const foodPlan = await fetchFoodPlan(id);
  return toCalculation(row, foodPlan);
}

export async function listAllCalculations(): Promise<CalorieCalculation[]> {
  const [rows] = await pool.query<CalcRow[]>(
    "SELECT * FROM calorie_calculations ORDER BY calculated_at DESC, id DESC"
  );
  // รายการสรุป — ไม่โหลด foodPlan ต่อแถว (ใช้ getCalculationById ดูรายละเอียดเต็ม)
  return rows.map((r) => toCalculation(r, { lines: [], totals: { cho: 0, pro: 0, fat: 0, kcal: 0 } }));
}

export async function listCalculationsByHn(hn: string): Promise<CalorieCalculation[]> {
  const [rows] = await pool.query<CalcRow[]>(
    "SELECT * FROM calorie_calculations WHERE hn = ? ORDER BY calculated_at DESC, id DESC",
    [hn]
  );
  return rows.map((r) => toCalculation(r, { lines: [], totals: { cho: 0, pro: 0, fat: 0, kcal: 0 } }));
}
