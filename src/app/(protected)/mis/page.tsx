import { Suspense } from "react";
import { MisSearch } from "@/components/mis/MisSearch";

export default function MisPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <span className="w-fit rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
          M/R-NUT-003.1 · Malnutrition Inflammation Score (MIS)
        </span>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">
          แบบประเมินภาวะโภชนาการสำหรับผู้ป่วยไตเทียม
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          ค้นหาผู้ป่วยด้วย HN เพื่อดูประวัติการประเมิน หรือเริ่มประเมินครั้งใหม่
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <MisSearch />
      </Suspense>
    </div>
  );
}
