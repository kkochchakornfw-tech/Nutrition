import { DropletIcon } from "@/components/ui/icons";

/** แบนเนอร์หัวหน้าแบบประเมิน MIS — โทนฟ้า-เขียวน้ำทะเล ให้เข้ากับธีมไตเทียม */
export function MisHeroBanner() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-sky-700 to-teal-700 px-6 pb-14 pt-8 text-white shadow-lg shadow-sky-900/10 sm:px-10 sm:pb-16 sm:pt-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-60 w-60 rounded-full bg-emerald-300/25 blur-3xl" />
      </div>
      <DropletIcon
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 top-1/2 hidden h-56 w-56 -translate-y-1/2 text-white/15 md:block lg:right-10"
      />

      <div className="relative max-w-2xl">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
          <DropletIcon className="h-3.5 w-3.5" />
          M/R-NUT-003.1 · Malnutrition Inflammation Score (MIS)
        </span>
        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          แบบประเมินภาวะโภชนาการ
          <span className="block text-cyan-100">สำหรับผู้ป่วยไตเทียม</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm text-sky-50 sm:text-base">
          ค้นหาผู้ป่วยด้วย HN เพื่อดูประวัติการประเมิน หรือเริ่มประเมินครั้งใหม่
        </p>
      </div>
    </section>
  );
}
