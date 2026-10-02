import { Suspense } from "react";
import Link from "next/link";
import { SgaSearch } from "@/components/sga/SgaSearch";
import { SgaHeroBanner } from "@/components/sga/SgaHeroBanner";
import { RecentList } from "@/components/ui/RecentList";
import { listRecentAssessments } from "@/lib/sga/store";
import { SGA_RESULT_META } from "@/lib/sga/scoring";
import { formatThaiDateFromDateTime, formatTime } from "@/lib/format";
import { ClipboardIcon, HistoryIcon } from "@/components/ui/icons";

export default async function SgaPage() {
  const recent = await listRecentAssessments(5);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SgaHeroBanner />

      <section
        aria-label="ค้นหาผู้ป่วย"
        className="relative z-10 -mt-4 rounded-2xl bg-white p-5 shadow-lg shadow-amber-900/10 ring-1 ring-zinc-200 sm:mx-6 sm:p-6"
      >
        <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
          <SgaSearch />
        </Suspense>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
          <Link
            href="/history?kind=sga"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-50"
          >
            <HistoryIcon className="h-4 w-4" />
            ดูประวัติทั้งหมด
          </Link>
        </div>
      </section>

      <RecentList
        heading="การประเมิน SGA ล่าสุด"
        emptyIcon={<ClipboardIcon className="h-6 w-6" />}
        emptyText="ค้นหาผู้ป่วยด้านบนเพื่อเริ่มประเมินรายแรก"
        iconTone="bg-emerald-50 text-emerald-600"
        items={recent.map((a) => ({
          id: a.id,
          href: `/sga/${a.id}`,
          badge: a.sgaResult,
          badgeClass: SGA_RESULT_META[a.sgaResult].badgeClass,
          title: a.patientNameSnapshot,
          subtitle: `HN ${a.hn} · ${formatThaiDateFromDateTime(a.assessedAt)} ${formatTime(a.assessedAt)}`,
          trailing: `${a.totalScore} คะแนน`,
        }))}
      />
    </div>
  );
}
