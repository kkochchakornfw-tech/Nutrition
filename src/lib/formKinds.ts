import type { HistoryKind } from "@/lib/history";

/**
 * สีประจำของแต่ละฟอร์ม — ใช้ร่วมกันทั้งหน้าประวัติและเมนู
 * SGA = เขียว (emerald), คำนวณแคลอรี่ = ส้ม (amber)
 */
export const FORM_KIND_META: Record<
  HistoryKind,
  {
    label: string;
    shortLabel: string;
    /** แถบสีด้านซ้ายของรายการ */
    bar: string;
    /** ไอคอน/ป้าย */
    chip: string;
    /** ปุ่มกรองตอนถูกเลือก */
    activeFilter: string;
    dot: string;
  }
> = {
  sga: {
    label: "แบบประเมิน SGA/NAF",
    shortLabel: "SGA",
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    activeFilter: "bg-emerald-600 text-white ring-emerald-600",
    dot: "bg-emerald-500",
  },
  calorie: {
    label: "คำนวณแคลอรี่/สารอาหาร",
    shortLabel: "แคลอรี่",
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-800 ring-amber-200",
    activeFilter: "bg-amber-500 text-amber-950 ring-amber-500",
    dot: "bg-amber-500",
  },
};
