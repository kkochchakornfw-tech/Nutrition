import Link from "next/link";
import { notFound } from "next/navigation";
import { getCalculationById } from "@/lib/calorie/store";
import { round } from "@/lib/calorie/calc";
import { formatThaiDateFromDateTime } from "@/lib/format";
import { FlagGraphic, FlagPhotoCredits } from "@/components/calorie/NutritionFlag";
import { PrintButton } from "@/components/PrintButton";

const nf = (n: number, digits = 0) =>
  round(n, digits).toLocaleString("th-TH", { maximumFractionDigits: digits });

const MACRO_CARDS = [
  { key: "cho", label: "Carbohydrate", bar: "bg-orange-300", text: "text-orange-700", ring: "ring-orange-200" },
  { key: "pro", label: "Protein", bar: "bg-sky-300", text: "text-sky-700", ring: "ring-sky-200" },
  { key: "fat", label: "Fat", bar: "bg-yellow-300", text: "text-yellow-700", ring: "ring-yellow-200" },
] as const;

/** หน้าพิมพ์ธงโภชนาการ (A4 แนวตั้ง 1 หน้า) */
export default async function FlagPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const calc = await getCalculationById(Number(id));
  if (!calc || !calc.foodPlan) notFound();

  const { result } = calc;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/menu2/${calc.id}`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:underline">
          ← กลับไปหน้าผลการคำนวณ
        </Link>
        <PrintButton label="พิมพ์ธงโภชนาการ" />
      </div>

      <article className="print-sheet pastel-sheet relative isolate mx-auto flex w-full max-w-[210mm] flex-col items-center gap-5 overflow-hidden rounded-3xl px-8 py-9 shadow-sm ring-1 ring-rose-100 print:rounded-none print:shadow-none print:ring-0">
        <PastelDecor />
        {/* ---------- หัวกระดาษ ---------- */}
        <header className="flex w-full flex-col items-center text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight text-emerald-700 drop-shadow-[0_2px_0_rgb(255_255_255)]">
            ธงโภชนาการ
          </h1>
          <p className="mt-2 font-display text-xl font-medium text-zinc-700">ปริมาณที่แนะนำให้กินใน 1 วัน</p>
          <p className="mt-3 rounded-full bg-white/80 px-6 py-1.5 font-display text-2xl font-semibold text-orange-700 shadow-sm ring-1 ring-orange-200">
            พลังงาน <span className="tabular-nums">{nf(result.totalEnergy)}</span> แคลอรี่
          </p>
          <p className="mt-3 text-lg text-zinc-800">
            <span className="text-zinc-500">ชื่อผู้ป่วย</span>{" "}
            <span className="font-display font-semibold">{calc.patientNameSnapshot}</span>
          </p>
        </header>

        {/* ---------- 3 คอลัมน์สารอาหาร ---------- */}
        <section aria-label="สารอาหารที่คำนวณได้" className="grid w-full grid-cols-3 gap-3">
          {MACRO_CARDS.map((m) => {
            const v = result[m.key];
            return (
              <div key={m.key} className={`overflow-hidden rounded-2xl bg-white/75 text-center shadow-sm ring-1 ${m.ring}`}>
                <div className={`h-1.5 ${m.bar}`} aria-hidden="true" />
                <div className="px-3 py-3">
                  <p className={`font-display text-lg font-semibold ${m.text}`}>{m.label}</p>
                  <p className="font-display text-3xl font-bold tabular-nums leading-tight text-zinc-900">
                    {nf(v.grams, 1)} <span className="text-base font-medium text-zinc-600">กรัม</span>
                  </p>
                  <p className="text-sm tabular-nums text-zinc-500">
                    {nf(v.pct, 1)}% · {nf(v.kcal)} kcal
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* ---------- ธง ---------- */}
        <div className="w-full">
          <FlagGraphic plan={calc.foodPlan} idPrefix="print-flag" />
        </div>

        <footer className="mt-auto flex w-full flex-wrap items-end justify-between gap-2 border-t border-rose-200/70 pt-2 text-xs text-zinc-600">
          <span>
            HN {calc.hn} · {formatThaiDateFromDateTime(calc.calculatedAt)} · {calc.performedBy}
          </span>
          <FlagPhotoCredits />
        </footer>
      </article>
    </div>
  );
}

/** ลายตกแต่งพาสเทล: วงกลมนุ่ม ๆ + ประกายดาว (ตกแต่งเท่านั้น) */
function PastelDecor() {
  const sparkle = "M12 0 C 13 8, 16 11, 24 12 C 16 13, 13 16, 12 24 C 11 16, 8 13, 0 12 C 8 11, 11 8, 12 0 Z";
  const sparkles: [number, number, number, string][] = [
    [6, 5, 22, "#f9a8d4"],
    [88, 8, 16, "#c4b5fd"],
    [93, 40, 12, "#fcd34d"],
    [4, 46, 14, "#86efac"],
    [10, 90, 18, "#7dd3fc"],
    [90, 86, 20, "#fda4af"],
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-pink-200/60 blur-2xl" />
      <div className="absolute -right-20 top-24 h-64 w-64 rounded-full bg-violet-200/50 blur-2xl" />
      <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-emerald-200/50 blur-2xl" />
      <div className="absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-amber-200/50 blur-2xl" />
      <svg className="absolute inset-0 h-full w-full">
        {sparkles.map(([x, y, size, color], i) => (
          <svg key={i} x={`${x}%`} y={`${y}%`} width={size} height={size} viewBox="0 0 24 24" overflow="visible">
            <path d={sparkle} fill={color} />
          </svg>
        ))}
      </svg>
    </div>
  );
}
