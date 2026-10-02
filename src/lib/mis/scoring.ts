import type { NutritionStatus } from "./types";

export function determineNutritionStatus(totalScore: number): NutritionStatus {
  return totalScore === 0 ? "normal" : "malnutrition";
}

export const NUTRITION_STATUS_META: Record<
  NutritionStatus,
  { label: string; badgeClass: string }
> = {
  normal: {
    label: "Normal nutritional status",
    badgeClass: "bg-green-100 text-green-800 border-green-300",
  },
  malnutrition: {
    label: "Malnutrition",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
  },
};
