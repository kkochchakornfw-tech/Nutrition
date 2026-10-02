import { listAllAssessments } from "@/lib/sga/store";
import { listAllCalculations } from "@/lib/calorie/store";
import { listAllMisAssessments } from "@/lib/mis/store";
import type { MacroMode } from "@/lib/calorie/types";
import type { SgaResult } from "@/lib/sga/types";
import type { NutritionStatus } from "@/lib/mis/types";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/lib/db";

/** ชนิดของฟอร์ม — ใช้แยกสีในหน้าประวัติ */
export type HistoryKind = "sga" | "calorie" | "mis";

export interface HistoryEntry {
  kind: HistoryKind;
  id: string;
  hn: string;
  patientName: string;
  /** ISO datetime */
  at: string;
  /** YYYY-MM-DD ตามเวลาประเทศไทย ใช้กรอง/จัดกลุ่มตามวัน */
  dateKey: string;
  href: string;
  performedBy: string;
  sga?: { totalScore: number; result: SgaResult; visitNo: number };
  calorie?: { totalEnergy: number; mode: MacroMode };
  mis?: { totalScore: number; status: NutritionStatus };
}

export interface HistoryFilter {
  date?: string;
  hn?: string;
  kind?: HistoryKind;
  /** ชื่อผู้ประเมิน/ผู้คำนวณ (ตรงตัว) */
  performedBy?: string;
}

const bangkokDateKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toDateKey(iso: string): string {
  return bangkokDateKey.format(new Date(iso));
}

async function sgaEntries(): Promise<HistoryEntry[]> {
  const assessments = await listAllAssessments();
  return assessments.map((a) => ({
    kind: "sga",
    id: `sga-${a.id}`,
    hn: a.hn,
    patientName: a.patientNameSnapshot,
    at: a.assessedAt,
    dateKey: toDateKey(a.assessedAt),
    href: `/sga/${a.id}`,
    performedBy: a.assessorName,
    sga: { totalScore: a.totalScore, result: a.sgaResult, visitNo: a.visitNo },
  }));
}

async function calorieEntries(): Promise<HistoryEntry[]> {
  const calculations = await listAllCalculations();
  return calculations.map((c) => ({
    kind: "calorie",
    id: `calorie-${c.id}`,
    hn: c.hn,
    patientName: c.patientNameSnapshot,
    at: c.calculatedAt,
    dateKey: toDateKey(c.calculatedAt),
    href: `/menu2/${c.id}`,
    performedBy: c.performedBy,
    calorie: { totalEnergy: c.result.totalEnergy, mode: c.inputs.mode },
  }));
}

async function misEntries(): Promise<HistoryEntry[]> {
  const assessments = await listAllMisAssessments();
  return assessments.map((a) => ({
    kind: "mis",
    id: `mis-${a.id}`,
    hn: a.hn,
    patientName: a.patientNameSnapshot,
    at: a.assessedAt,
    dateKey: toDateKey(a.assessedAt),
    href: `/mis/${a.id}`,
    performedBy: a.assessorName,
    mis: { totalScore: a.totalScore, status: a.nutritionStatus },
  }));
}

export async function listHistory(
  filter: HistoryFilter = {},
): Promise<HistoryEntry[]> {
  const hn = filter.hn?.trim();
  const [sga, calorie, mis] = await Promise.all([sgaEntries(), calorieEntries(), misEntries()]);
  return [...sga, ...calorie, ...mis]
    .filter((e) => !filter.kind || e.kind === filter.kind)
    .filter((e) => !filter.date || e.dateKey === filter.date)
    .filter((e) => !hn || e.hn.includes(hn))
    .filter((e) => !filter.performedBy || e.performedBy === filter.performedBy)
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** รายชื่อผู้ประเมินทั้งหมดที่มีในประวัติ (ใช้ทำตัวเลือกตัวกรอง) */
/** รายชื่อนักกำหนดอาหารที่ใช้งานอยู่ (ใช้ทำตัวเลือกตัวกรอง) */
export async function listPerformers(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT full_name FROM dietitians WHERE is_active = 1 ORDER BY sort_order, full_name",
  );
  return rows.map((r) => r.full_name as string);
}
