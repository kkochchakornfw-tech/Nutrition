import type { FoodPlan } from "./types";

/**
 * ธงโภชนาการ: รวมจำนวน "ส่วน" จากตาราง 3 เข้าช่องของแต่ละหมวดในภาพ
 * ตัวเลขในภาพ = จำนวนส่วนที่กรอก (ไม่แปลงหน่วย) — หน่วยที่แสดงคือหน่วยครัวเรือนที่เท่ากับ 1 ส่วนแลกเปลี่ยน
 * ยกเว้นเนื้อสัตว์ที่ 1 ส่วน = 2 ช้อนกินข้าว จึงแสดงเป็น "ส่วน" เพื่อไม่ให้ตัวเลขผิดความหมาย
 * เกลือไม่มีในตาราง 3 → ฟิกไว้ที่ 1 ช้อนชาเสมอ
 */
export type FlagSlotKey = "grain" | "veg" | "fruit" | "milk" | "meat" | "egg" | "oil" | "sugar" | "salt";

export interface FlagSlot {
  key: FlagSlotKey;
  label: string;
  unit: string;
  value: number;
  /** ค่าคงที่ ไม่ได้มาจากตาราง 3 */
  fixed?: boolean;
}

const SLOT_SOURCES: { key: FlagSlotKey; label: string; unit: string; items: string[] }[] = [
  { key: "grain", label: "ข้าว-แป้ง", unit: "ทัพพี", items: ["rice", "starch", "starch_plod"] },
  { key: "veg", label: "ผัก", unit: "ทัพพี", items: ["veg_a", "veg_b"] },
  { key: "fruit", label: "ผลไม้", unit: "ส่วน", items: ["fruit"] },
  { key: "milk", label: "นม", unit: "แก้ว", items: ["milk_lowfat", "milk_nonfat", "milk_plain", "protein_milk"] },
  { key: "meat", label: "เนื้อสัตว์", unit: "ส่วน", items: ["meat_high_fat", "meat_med_fat", "meat_low_fat"] },
  { key: "egg", label: "ไข่", unit: "ฟอง", items: ["egg_white"] },
  { key: "oil", label: "น้ำมัน", unit: "ช้อนชา", items: ["fat"] },
  { key: "sugar", label: "น้ำตาล", unit: "ช้อนชา", items: ["sugar"] },
];

export const SALT_FIXED_TSP = 1;

export function flagSlots(plan: FoodPlan): Record<FlagSlotKey, FlagSlot> {
  const portionsByKey = new Map(plan.lines.map((l) => [l.key, l.portions]));
  const slots = Object.fromEntries(
    SLOT_SOURCES.map((s) => [
      s.key,
      {
        key: s.key,
        label: s.label,
        unit: s.unit,
        value: s.items.reduce((sum, k) => sum + (portionsByKey.get(k) ?? 0), 0),
      },
    ])
  ) as Record<Exclude<FlagSlotKey, "salt">, FlagSlot>;
  return {
    ...slots,
    salt: { key: "salt", label: "เกลือ", unit: "ช้อนชา", value: SALT_FIXED_TSP, fixed: true },
  };
}
