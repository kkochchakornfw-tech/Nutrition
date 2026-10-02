/** โหมดคำนวณสัดส่วนสารอาหาร (ตาราง 2) */
export type MacroMode = "percent" | "protein";

/** ค่าที่ผู้ใช้กรอก — เปอร์เซ็นต์เก็บเป็นเลขเต็มร้อย (เช่น 30 = 30%) */
export interface CalorieInputs {
  weightKg: number;
  /** kcal ต่อ กก. ต่อวัน */
  factorCal: number;
  mode: MacroMode;
  /** โหมด A (percent) */
  pctCho?: number;
  pctPro?: number;
  pctFat?: number;
  /** โหมด B (protein): g ต่อ กก. ต่อวัน — ใช้ pctFat ร่วมกัน */
  factorProtein?: number;
}

export interface MacroAmount {
  grams: number;
  pct: number;
  kcal: number;
}

export interface MacroResult {
  totalEnergy: number;
  cho: MacroAmount;
  pro: MacroAmount;
  fat: MacroAmount;
}

/** ตาราง 3: ค่าที่ผู้ใช้กรอกต่อรายการอาหาร */
export interface FoodLineInput {
  key: string;
  /** จำนวนส่วน (ทศนิยมได้) */
  portions: number;
  /** ใช้เฉพาะรายการ manual (นมโปรตีน) — กรอกเป็นกรัม/kcal ตรง ๆ */
  manualCho?: number;
  manualPro?: number;
  manualFat?: number;
  manualKcal?: number;
}

/** ผลต่อรายการ — เก็บ snapshot ค่า fac ไว้ด้วย เผื่อ master เปลี่ยนภายหลัง */
export interface FoodLine {
  key: string;
  labelTh: string;
  manual: boolean;
  portions: number;
  facCho: number;
  facPro: number;
  facFat: number;
  facKcal: number;
  cho: number;
  pro: number;
  fat: number;
  kcal: number;
}

export interface FoodTotals {
  cho: number;
  pro: number;
  fat: number;
  kcal: number;
}

export interface FoodPlan {
  lines: FoodLine[];
  totals: FoodTotals;
}

export interface CalorieCalculation {
  id: number;
  hn: string;
  patientNameSnapshot: string;
  calculatedAt: string;
  performedBy: string;
  createdByUserId: number;
  note: string | null;
  inputs: CalorieInputs;
  result: MacroResult;
  foodPlan: FoodPlan;
}

export interface CreateCalorieInput {
  hn: string;
  patientNameSnapshot: string;
  note: string | null;
  inputs: CalorieInputs;
  foods: FoodLineInput[];
  performedBy?: string;
}
