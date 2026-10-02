import { FOOD_EXCHANGES, type FoodExchange } from "./foods";
import type { CalorieInputs, FoodLineInput, FoodPlan, FoodLine, MacroResult } from "./types";

/**
 * สูตรตาม PROJECT_BRIEF.md เมนู 2
 * ตาราง 1: Total Energy = น้ำหนัก × factor cal
 * ตาราง 2 โหมด A: CHO/PRO (g) = TE × %/400, FAT (g) = TE × %/900 (% รวมต้องเท่ากับ 100)
 * ตาราง 2 โหมด B: PRO (g) = factor protein × น้ำหนัก, FAT (g) = TE × %FAT / 9,
 *                  %CHO = 100 − %PRO − %FAT, CHO (g) = TE × %CHO / 4
 */

export type CalcOutcome = { ok: true; result: MacroResult } | { ok: false; error: string };

const isPos = (n: number | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
const isPct = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;

export function calcTotalEnergy(weightKg: number, factorCal: number): number {
  return weightKg * factorCal;
}

export function calcMacros(input: CalorieInputs): CalcOutcome {
  if (!isPos(input.weightKg)) return { ok: false, error: "กรุณากรอกน้ำหนักตัว" };
  if (!isPos(input.factorCal)) return { ok: false, error: "กรุณากรอก factor cal" };
  const te = calcTotalEnergy(input.weightKg, input.factorCal);

  if (input.mode === "percent") {
    const { pctCho, pctPro, pctFat } = input;
    if (!isPct(pctCho) || !isPct(pctPro) || !isPct(pctFat)) {
      return { ok: false, error: "กรุณากรอก %CHO, %PRO, %FAT (0–100)" };
    }
    const sum = pctCho + pctPro + pctFat;
    if (Math.abs(sum - 100) > 0.01) {
      return { ok: false, error: `%CHO + %PRO + %FAT ต้องรวมได้ 100% (ตอนนี้ ${round(sum, 1)}%)` };
    }
    return {
      ok: true,
      result: {
        totalEnergy: te,
        cho: { grams: (te * pctCho) / 400, pct: pctCho, kcal: (te * pctCho) / 100 },
        pro: { grams: (te * pctPro) / 400, pct: pctPro, kcal: (te * pctPro) / 100 },
        fat: { grams: (te * pctFat) / 900, pct: pctFat, kcal: (te * pctFat) / 100 },
      },
    };
  }

  const { factorProtein, pctFat } = input;
  if (!isPos(factorProtein)) return { ok: false, error: "กรุณากรอก factor protein" };
  if (!isPct(pctFat)) return { ok: false, error: "กรุณากรอก %FAT (0–100)" };
  const proG = factorProtein * input.weightKg;
  const pctPro = ((proG * 4) / te) * 100;
  const pctCho = 100 - pctPro - pctFat;
  if (pctCho < 0) {
    return {
      ok: false,
      error: `โปรตีน (${round(pctPro, 1)}%) + ไขมัน (${round(pctFat, 1)}%) เกิน 100% ของพลังงานรวม — ลด factor protein หรือ %FAT`,
    };
  }
  return {
    ok: true,
    result: {
      totalEnergy: te,
      pro: { grams: proG, pct: pctPro, kcal: proG * 4 },
      fat: { grams: (te * pctFat) / 100 / 9, pct: pctFat, kcal: (te * pctFat) / 100 },
      cho: { grams: (te * pctCho) / 100 / 4, pct: pctCho, kcal: (te * pctCho) / 100 },
    },
  };
}

export function round(n: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/* ---------------- ตาราง 3: สัดส่วนอาหารต่อวัน ---------------- */

const nonNeg = (n: number | undefined) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0);

/**
 * CHO/PRO/FAT (กรัม) และ kcal ต่อรายการ = fac × ส่วน แล้วรวมตามคอลัมน์
 * รายการ manual (นมโปรตีน) ใช้ค่าที่ผู้ใช้กรอกตรง ๆ ไม่คูณ fac
 * รายการที่ไม่ได้ส่งมา / ค่าไม่ถูกต้อง นับเป็น 0
 */
export function calcFoodPlan(inputs: FoodLineInput[], foods: FoodExchange[] = FOOD_EXCHANGES): FoodPlan {
  const byKey = new Map(inputs.map((i) => [i.key, i]));
  const lines: FoodLine[] = foods.map((f) => {
    const input = byKey.get(f.key);
    const portions = nonNeg(input?.portions);
    const manual = Boolean(f.manual);
    return {
      key: f.key,
      labelTh: f.labelTh,
      manual,
      portions,
      facCho: f.facCho,
      facPro: f.facPro,
      facFat: f.facFat,
      facKcal: f.facKcal,
      cho: manual ? nonNeg(input?.manualCho) : f.facCho * portions,
      pro: manual ? nonNeg(input?.manualPro) : f.facPro * portions,
      fat: manual ? nonNeg(input?.manualFat) : f.facFat * portions,
      kcal: manual ? nonNeg(input?.manualKcal) : f.facKcal * portions,
    };
  });
  const totals = lines.reduce(
    (t, l) => ({ cho: t.cho + l.cho, pro: t.pro + l.pro, fat: t.fat + l.fat, kcal: t.kcal + l.kcal }),
    { cho: 0, pro: 0, fat: 0, kcal: 0 }
  );
  return { lines, totals };
}
