import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { MacroBar, MacroTable, TotalEnergy } from "@/components/calorie/MacroBreakdown";
import { FoodPlanTable } from "@/components/calorie/FoodPlanTable";
import { NutritionFlag } from "@/components/calorie/NutritionFlag";
import { ArrowRightIcon, CalculatorIcon, EditIcon, HistoryIcon } from "@/components/ui/icons";
import { AuditTrail } from "@/components/AuditTrail";
import { getCalculationById } from "@/lib/calorie/store";
import { formatThaiDateFromDateTime, formatTime } from "@/lib/format";

export default async function CalculationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const calc = await getCalculationById(Number(id));
  if (!calc) notFound();

  const { inputs, result } = calc;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-amber-950">
            <CalculatorIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-amber-700">ผลการคำนวณแคลอรี่/สารอาหาร #{calc.id}</p>
            <h1 className="font-display text-2xl font-semibold text-zinc-900">{calc.patientNameSnapshot}</h1>
            <p className="text-sm text-zinc-600">
              HN {calc.hn} · {formatThaiDateFromDateTime(calc.calculatedAt)} {formatTime(calc.calculatedAt)} น. ·{" "}
              {calc.performedBy}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {calc.foodPlan && (
            <Link
              href={`/menu2/${calc.id}/flag`}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              พิมพ์ธงโภชนาการ
            </Link>
          )}
          <Link
            href={`/menu2/${calc.id}/edit`}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <EditIcon className="h-4 w-4" />
            แก้ไข
          </Link>
          <Link
            href={`/history?hn=${encodeURIComponent(calc.hn)}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <HistoryIcon className="h-4 w-4" />
            ประวัติของ HN นี้
          </Link>
          <Link
            href={`/menu2?hn=${encodeURIComponent(calc.hn)}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            คำนวณใหม่
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card>
          <h2 className="text-sm font-semibold text-zinc-900">สัดส่วนสารอาหารต่อวัน</h2>
          <div className="mt-3 flex flex-col gap-4">
            <TotalEnergy value={result.totalEnergy} />
            <MacroBar result={result} />
            <MacroTable result={result} />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-zinc-900">ค่าที่ใช้คำนวณ</h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="น้ำหนักตัว" value={`${inputs.weightKg} กก.`} />
            <Row label="Factor cal" value={`${inputs.factorCal} kcal/กก./วัน`} />
            <Row label="วิธีคำนวณ" value={inputs.mode === "percent" ? "ตามเปอร์เซ็นต์" : "ตามโปรตีน"} />
            {inputs.mode === "percent" ? (
              <Row label="%CHO / %PRO / %FAT" value={`${inputs.pctCho} / ${inputs.pctPro} / ${inputs.pctFat}`} />
            ) : (
              <>
                <Row label="Factor protein" value={`${inputs.factorProtein} ก./กก./วัน`} />
                <Row label="%FAT" value={`${inputs.pctFat}%`} />
              </>
            )}
          </dl>
          {calc.note && (
            <div className="mt-4 border-t border-zinc-100 pt-3">
              <p className="text-xs text-zinc-500">หมายเหตุ</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{calc.note}</p>
            </div>
          )}
        </Card>
      </div>

      {/* รายการที่บันทึกก่อนมีตาราง 3 จะไม่มี foodPlan */}
      {calc.foodPlan && (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-900">สัดส่วนอาหารต่อวัน (ตาราง 3)</h2>
          <div className="mt-3">
            <FoodPlanTable plan={calc.foodPlan} target={result} />
          </div>
        </Card>
      )}
      {calc.foodPlan && (
        <Card>
          <NutritionFlag plan={calc.foodPlan} targetKcal={result.totalEnergy} />
        </Card>
      )}

      <AuditTrail kind="calorie" recordId={calc.id} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-zinc-900">{value}</dd>
    </div>
  );
}
