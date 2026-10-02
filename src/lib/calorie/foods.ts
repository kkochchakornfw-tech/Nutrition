/**
 * ตาราง 3: รายการอาหาร (หมวดอาหารแลกเปลี่ยน) + ค่า fac ต่อ 1 ส่วน
 * อ้างอิงไฟล์ "อาหารทางการแพทย์และคำนวนพลังงาน.xlsx" ชีต "คำนวนพลังงาน" แถว 10–25
 * - fac CHO/PRO/FAT = กรัมต่อ 1 ส่วน, facKcal = kcal ต่อ 1 ส่วน (ใช้ค่าจากชีตตรง ๆ ไม่คำนวณจาก 4/4/9)
 * - manual = true → ผู้ใช้กรอก CHO/PRO/FAT/kcal เองทั้งหมด ไม่คูณ fac (นมโปรตีน)
 * ออกแบบเป็น data-driven เหมือน SGA_CRITERIA เพื่อย้ายไปตาราง food_exchange_items ใน DB ได้ตรง ๆ
 */
export interface FoodExchange {
  key: string;
  labelTh: string;
  facCho: number;
  facPro: number;
  facFat: number;
  facKcal: number;
  manual?: boolean;
}

export const FOOD_EXCHANGES: FoodExchange[] = [
  { key: "protein_milk", labelTh: "นมโปรตีน", facCho: 0, facPro: 0, facFat: 0, facKcal: 0, manual: true },
  { key: "milk_lowfat", labelTh: "นมlow fat", facCho: 12, facPro: 8, facFat: 5, facKcal: 120 },
  { key: "milk_nonfat", labelTh: "นม Nonfat", facCho: 12, facPro: 8, facFat: 0, facKcal: 90 },
  { key: "milk_plain", labelTh: "นมจืด", facCho: 12, facPro: 8, facFat: 8, facKcal: 150 },
  { key: "fruit", labelTh: "ผลไม้", facCho: 15, facPro: 0, facFat: 0, facKcal: 60 },
  { key: "veg_a", labelTh: "ผัก (ก)", facCho: 0, facPro: 0, facFat: 0, facKcal: 0 },
  { key: "veg_b", labelTh: "ผัก (ข)", facCho: 5, facPro: 2, facFat: 0, facKcal: 25 },
  { key: "rice", labelTh: "ข้าว", facCho: 15, facPro: 2, facFat: 0, facKcal: 80 },
  { key: "starch", labelTh: "แป้ง", facCho: 18, facPro: 2, facFat: 0, facKcal: 80 },
  { key: "egg_white", labelTh: "ไข่ขาว (ฟอง)", facCho: 0, facPro: 3.5, facFat: 0, facKcal: 14 },
  { key: "meat_high_fat", labelTh: "เนื้อสัตว์ (มันมาก)", facCho: 0, facPro: 7, facFat: 8, facKcal: 100 },
  { key: "meat_med_fat", labelTh: "เนื้อสัตว์ (มันปานกลาง)", facCho: 0, facPro: 7, facFat: 5, facKcal: 75 },
  { key: "meat_low_fat", labelTh: "เนื้อสัตว์ (มันน้อย)", facCho: 0, facPro: 7, facFat: 3, facKcal: 55 },
  { key: "fat", labelTh: "ไขมัน", facCho: 0, facPro: 0, facFat: 5, facKcal: 45 },
  { key: "sugar", labelTh: "น้ำตาล", facCho: 5, facPro: 0, facFat: 0, facKcal: 20 },
  // ในชีตไม่มีสูตรช่อง calories ของแถวนี้ (J25 ว่าง) — ใช้ facKcal 80 เหมือนแถวอื่น
  { key: "starch_plod", labelTh: "แป้งปลอด", facCho: 15, facPro: 0, facFat: 0, facKcal: 80 },
];

/** ค่าเริ่มต้นของช่อง "ส่วน" ทุกรายการ */
export const DEFAULT_PORTIONS = 1;
