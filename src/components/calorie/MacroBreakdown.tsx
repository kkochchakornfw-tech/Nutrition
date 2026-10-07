import type { MacroResult } from "@/lib/calorie/types";
import { round } from "@/lib/calorie/calc";

/** สีสารอาหาร: CHO ส้ม, PRO ฟ้า, FAT เหลือง (มีตัวอักษรกำกับเสมอ ไม่ใช้สีอย่างเดียว) */
export const MACROS = [
  { key: "cho", label: "คาร์โบไฮเดรต", short: "CHO", bar: "bg-orange-500", dot: "bg-orange-500", perG: 4 },
  { key: "pro", label: "โปรตีน", short: "PRO", bar: "bg-sky-500", dot: "bg-sky-500", perG: 4 },
  { key: "fat", label: "ไขมัน", short: "FAT", bar: "bg-yellow-400", dot: "bg-yellow-400", perG: 9 },
] as const;

const nf = (n: number, digits = 1) =>
  round(n, digits).toLocaleString("th-TH", { maximumFractionDigits: digits });

export function TotalEnergy({ value, size = "lg" }: { value: number; size?: "lg" | "md" }) {
  return (
    <p className="flex items-baseline gap-1.5">
      <span
        className={`font-display font-semibold tabular-nums leading-none text-zinc-900 ${
          size === "lg" ? "text-4xl" : "text-3xl"
        }`}
      >
        {nf(value, 0)}
      </span>
      <span className="text-sm text-zinc-500">kcal/วัน</span>
    </p>
  );
}

export function MacroBar({ result }: { result: MacroResult }) {
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
      {MACROS.map((m) => (
        <div
          key={m.key}
          className={`${m.bar} h-full transition-[width] duration-300 motion-reduce:transition-none`}
          style={{ width: `${Math.max(0, result[m.key].pct)}%` }}
        />
      ))}
    </div>
  );
}

export function MacroTable({ result }: { result: MacroResult }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">สัดส่วนสารอาหารต่อวัน</caption>
      <thead>
        <tr className="text-left text-xs text-zinc-500">
          <th scope="col" className="pb-2 font-medium">
            สารอาหาร
          </th>
          <th scope="col" className="pb-2 text-right font-medium">
            กรัม
          </th>
          <th scope="col" className="pb-2 text-right font-medium">
            %
          </th>
          <th scope="col" className="pb-2 text-right font-medium">
            kcal
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {MACROS.map((m) => {
          const v = result[m.key];
          return (
            <tr key={m.key}>
              <th scope="row" className="py-2 text-left font-medium text-zinc-800">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${m.dot}`} aria-hidden="true" />
                  {m.short}
                  <span className="hidden font-normal text-zinc-500 sm:inline">{m.label}</span>
                </span>
              </th>
              <td className="py-2 text-right text-base font-semibold tabular-nums text-zinc-900">{nf(v.grams, 0)}</td>
              <td className="py-2 text-right tabular-nums text-zinc-700">{nf(v.pct)}</td>
              <td className="py-2 text-right tabular-nums text-zinc-500">{nf(v.kcal, 0)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t border-zinc-200 text-xs text-zinc-500">
          <th scope="row" className="pt-2 text-left font-medium">
            รวม
          </th>
          <td />
          <td className="pt-2 text-right tabular-nums">
            {nf(result.cho.pct + result.pro.pct + result.fat.pct)}
          </td>
          <td className="pt-2 text-right tabular-nums">
            {nf(result.cho.kcal + result.pro.kcal + result.fat.kcal, 0)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
