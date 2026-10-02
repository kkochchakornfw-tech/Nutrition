import { CalculatorIcon } from "@/components/ui/icons";

/** แบนเนอร์หัวหน้าคำนวณแคลอรี่/สารอาหาร — โทนส้มอำพัน */
export function CalorieHeroBanner() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 px-6 pb-8 pt-8 text-white shadow-lg shadow-orange-900/10 sm:px-10 sm:pb-10 sm:pt-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-60 w-60 rounded-full bg-rose-300/25 blur-3xl" />
      </div>
      <CalculatorIcon
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 top-1/2 hidden h-52 w-52 -translate-y-1/2 text-white/20 md:block lg:right-10"
      />
      <div className="relative max-w-2xl">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
          <CalculatorIcon className="h-3.5 w-3.5" />
          Energy &amp; Macronutrient Calculator
        </span>
        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          คำนวณแคลอรี่/สารอาหารต่อวัน
        </h1>
        <p className="mt-3 max-w-lg text-sm text-orange-50 sm:text-base">
          คำนวณพลังงานรวมและสัดส่วน CHO/PRO/FAT ต่อวันของผู้ป่วย พร้อมวางแผนอาหารและบันทึกเข้าประวัติ
        </p>
      </div>
    </section>
  );
}
