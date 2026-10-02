import { Suspense } from "react";
import Link from "next/link";
import { MisSearch } from "@/components/mis/MisSearch";
import { MisHeroBanner } from "@/components/mis/MisHeroBanner";
import { RecentList } from "@/components/ui/RecentList";
import { listRecentMisAssessments } from "@/lib/mis/store";
import { NUTRITION_STATUS_META } from "@/lib/mis/scoring";
import { formatThaiDateFromDateTime, formatTime } from "@/lib/format";
import { DropletIcon, HistoryIcon } from "@/components/ui/icons";

export default async function MisPage() {
  const recent = await listRecentMisAssessments(5);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <MisHeroBanner />

      <section
        aria-label="ค้นหาผู้ป่วย"
        className="relative z-10 -mt-12 rounded-2xl bg-white p-5 shadow-lg shadow-sky-900/10 ring-1 ring-zinc-200 sm:mx-6 sm:p-6"
      >
        <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
          <MisSearch />
        </Suspense>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
          <Link
            href="/history?kind=mis"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-50"
          >
            <HistoryIcon className="h-4 w-4" />
            ดูประวัติทั้งหมด
          </Link>
        </div>
      </section>

      <RecentList
        heading="การประเมิน MIS ล่าสุด"
        emptyIcon={<DropletIcon className="h-6 w-6" />}
        emptyText="ค้นหาผู้ป่วยด้านบนเพื่อเริ่มประเมินรายแรก"
        iconTone="bg-sky-50 text-sky-600"
        items={recent.map((a) => {
          const meta = NUTRITION_STATUS_META[a.nutritionStatus];
          return {
            id: a.id,
            href: `/mis/${a.id}`,
            badge: a.totalScore,
            badgeClass: meta.badgeClass,
            title: a.patientNameSnapshot,
            subtitle: `HN ${a.hn} · ${formatThaiDateFromDateTime(a.assessedAt)} ${formatTime(a.assessedAt)}`,
            trailing: meta.label,
          };
        })}
      />
    </div>
  );
}
