import { Suspense } from "react";
import { CalorieCalculator } from "@/components/calorie/CalorieCalculator";
import { CalculatorIcon } from "@/components/ui/icons";

export default function Menu2Page() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-amber-950">
          <CalculatorIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900 sm:text-3xl">
            คำนวณแคลอรี่/สารอาหารต่อวัน
          </h1>
          <p className="text-sm text-zinc-600">คำนวณพลังงานรวมและสัดส่วน CHO/PRO/FAT ต่อวันของผู้ป่วย</p>
        </div>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <CalorieCalculator />
      </Suspense>
    </div>
  );
}
