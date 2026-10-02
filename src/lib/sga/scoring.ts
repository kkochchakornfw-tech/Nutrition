import type { SgaResult } from "./types";

export function calcBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function determineSgaResult(totalScore: number): SgaResult {
  if (totalScore <= 5) return "A";
  if (totalScore <= 10) return "B";
  return "C";
}

export const SGA_RESULT_META: Record<SgaResult, { label: string; action: string; badgeClass: string }> = {
  A: {
    label: "Normal – Mild malnutrition",
    action: "ประเมินซ้ำทุก 7 วัน",
    badgeClass: "bg-green-100 text-green-800 border-green-300",
  },
  B: {
    label: "Moderate malnutrition",
    action: "ประเมินระดับลึกภายใน 72 ชั่วโมง",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  C: {
    label: "Severe malnutrition",
    action: "ประเมินระดับลึกภายใน 24 ชั่วโมง",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
  },
};
