import { Suspense } from "react";
import { CalorieCalculator } from "@/components/calorie/CalorieCalculator";
import { CalorieHeroBanner } from "@/components/calorie/CalorieHeroBanner";
import { RecentList } from "@/components/ui/RecentList";
import { listRecentCalculations } from "@/lib/calorie/store";
import { formatThaiDateFromDateTime, formatTime } from "@/lib/format";
import { CalculatorIcon } from "@/components/ui/icons";

export default async function Menu2Page() {
  const recent = await listRecentCalculations(5);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <CalorieHeroBanner />
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <CalorieCalculator />
      </Suspense>
      <RecentList
        heading="การคำนวณล่าสุด"
        emptyIcon={<CalculatorIcon className="h-6 w-6" />}
        emptyText="บันทึกผลการคำนวณแล้วจะแสดงที่นี่"
        iconTone="bg-amber-50 text-amber-600"
        items={recent.map((c) => ({
          id: c.id,
          href: `/menu2/${c.id}`,
          badge: <CalculatorIcon className="h-4 w-4" />,
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
          title: c.patientNameSnapshot,
          subtitle: `HN ${c.hn} · ${formatThaiDateFromDateTime(c.calculatedAt)} ${formatTime(c.calculatedAt)}`,
          trailing: `${Math.round(c.result.totalEnergy)} kcal`,
        }))}
      />
    </div>
  );
}
