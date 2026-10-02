import type { FoodPlan, MacroResult } from "@/lib/calorie/types";
import { round } from "@/lib/calorie/calc";

/** ค่าที่กำลังพิมพ์ในแต่ละช่อง (string เพื่อให้ลบ/พิมพ์ทศนิยมได้ลื่น) */
export interface FoodDraft {
  portions: string;
  manualCho: string;
  manualPro: string;
  manualFat: string;
  manualKcal: string;
}

type ManualField = "manualCho" | "manualPro" | "manualFat" | "manualKcal";

const nf = (n: number, digits = 1) =>
  round(n, digits).toLocaleString("th-TH", { maximumFractionDigits: digits });

const COLS = [
  { key: "cho", label: "CHO", unit: "ก.", manual: "manualCho", fac: "facCho", dot: "bg-orange-500" },
  { key: "pro", label: "PRO", unit: "ก.", manual: "manualPro", fac: "facPro", dot: "bg-sky-500" },
  { key: "fat", label: "FAT", unit: "ก.", manual: "manualFat", fac: "facFat", dot: "bg-yellow-400" },
  { key: "kcal", label: "พลังงาน", unit: "kcal", manual: "manualKcal", fac: "facKcal", dot: "" },
] as const;

const cellInput =
  "min-h-9 w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-right text-sm tabular-nums shadow-sm transition-colors hover:border-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25";

/**
 * ตาราง 3 — ถ้าส่ง drafts + onChange จะเป็นโหมดแก้ไข (ใช้ในหน้าคำนวณ), ไม่ส่ง = อ่านอย่างเดียว
 * target = ผลจากตาราง 2 ใช้เทียบว่ากินเกินเป้าหรือไม่
 */
export function FoodPlanTable({
  plan,
  target,
  drafts,
  onChange,
}: {
  plan: FoodPlan;
  target: MacroResult | null;
  drafts?: Record<string, FoodDraft>;
  onChange?: (key: string, field: keyof FoodDraft, value: string) => void;
}) {
  const editable = Boolean(drafts && onChange);
  const targets = target
    ? { cho: target.cho.grams, pro: target.pro.grams, fat: target.fat.grams, kcal: target.totalEnergy }
    : null;

  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[40rem] text-sm">
        <caption className="sr-only">สัดส่วนอาหารต่อวัน</caption>
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500">
            <th scope="col" className="py-2 pr-3 text-left font-medium">
              รายการอาหาร
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              ส่วน
            </th>
            {COLS.map((c) => (
              <th key={c.key} scope="col" className="px-2 py-2 text-right font-medium">
                <span className="inline-flex items-center gap-1.5">
                  {c.dot && <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden="true" />}
                  {c.label} <span className="font-normal">({c.unit})</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {plan.lines.map((line) => {
            const draft = drafts?.[line.key];
            const inactive = !line.manual && line.portions === 0;
            return (
              <tr key={line.key} className={line.manual ? "bg-sky-50/50" : undefined}>
                <th scope="row" className="py-2 pr-3 text-left font-medium text-zinc-800">
                  {line.labelTh}
                  {line.manual && <span className="mt-0.5 block text-xs font-normal text-sky-700">กรอกค่าเอง</span>}
                </th>
                <td className="px-2 py-2 text-right">
                  {editable && draft ? (
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      aria-label={`${line.labelTh} จำนวนส่วน`}
                      value={draft.portions}
                      onChange={(e) => onChange!(line.key, "portions", e.target.value)}
                      className={cellInput}
                    />
                  ) : (
                    <span className="tabular-nums text-zinc-900">{nf(line.portions)}</span>
                  )}
                </td>
                {COLS.map((c) => (
                  <td key={c.key} className="px-2 py-2 text-right">
                    {line.manual && editable && draft ? (
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        aria-label={`${line.labelTh} ${c.label} (${c.unit})`}
                        value={draft[c.manual as ManualField]}
                        onChange={(e) => onChange!(line.key, c.manual as ManualField, e.target.value)}
                        className={cellInput}
                      />
                    ) : (
                      <>
                        <span className={`block tabular-nums ${inactive ? "text-zinc-400" : "font-medium text-zinc-900"}`}>
                          {nf(line[c.key], c.key === "kcal" ? 0 : 1)}
                        </span>
                        {!line.manual && (
                          <span className="block text-[11px] tabular-nums text-zinc-400">
                            {nf(line[c.fac])}/ส่วน
                          </span>
                        )}
                      </>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="text-sm">
          <tr className="border-t-2 border-zinc-300">
            <th scope="row" colSpan={2} className="py-2 pr-3 text-left font-semibold text-zinc-900">
              รวม
            </th>
            {COLS.map((c) => (
              <td key={c.key} className="px-2 py-2 text-right font-semibold tabular-nums text-zinc-900">
                {nf(plan.totals[c.key], c.key === "kcal" ? 0 : 1)}
              </td>
            ))}
          </tr>
          <tr className="text-zinc-600">
            <th scope="row" colSpan={2} className="py-1.5 pr-3 text-left font-normal">
              เป้าหมาย (ตาราง 2)
            </th>
            {COLS.map((c) => (
              <td key={c.key} className="px-2 py-1.5 text-right tabular-nums">
                {targets ? nf(targets[c.key], c.key === "kcal" ? 0 : 1) : "—"}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" colSpan={2} className="py-1.5 pr-3 text-left font-normal text-zinc-600">
              ส่วนต่าง
            </th>
            {COLS.map((c) => (
              <td key={c.key} className="px-2 py-1.5 text-right">
                {targets ? <Diff value={plan.totals[c.key] - targets[c.key]} digits={c.key === "kcal" ? 0 : 1} /> : "—"}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** เกินเป้า = แดง, ขาด = เทา, ตรงเป้า (ภายใน ±0.05) = เขียว */
function Diff({ value, digits }: { value: number; digits: number }) {
  const r = round(value, digits);
  if (r > 0) {
    return (
      <span className="inline-block rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-red-700">
        +{nf(r, digits)} เกิน
      </span>
    );
  }
  if (r < 0) {
    return <span className="text-xs tabular-nums text-zinc-500">{nf(r, digits)} ขาด</span>;
  }
  return (
    <span className="inline-block rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">ตรงเป้า</span>
  );
}
