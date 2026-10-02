import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { getSession } from "@/lib/auth/session";
import {
  countAssessmentsByResult,
  listRecentAssessments,
} from "@/lib/sga/store";
import { SGA_RESULT_META } from "@/lib/sga/scoring";
import type { SgaResult } from "@/lib/sga/types";
import { formatThaiDateFromDateTime, formatTime } from "@/lib/format";
import {
  ActivityIcon,
  ArrowRightIcon,
  CalculatorIcon,
  ClipboardIcon,
  DropletIcon,
  LeafIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/icons";

const RESULT_RANGE: Record<SgaResult, string> = {
  A: "0–5",
  B: "6–10",
  C: "≥ 11",
};

const RESULT_TONE: Record<
  SgaResult,
  { dot: string; tile: string; text: string }
> = {
  A: {
    dot: "bg-green-500",
    tile: "bg-green-50 ring-green-200",
    text: "text-green-800",
  },
  B: {
    dot: "bg-yellow-400",
    tile: "bg-yellow-50 ring-yellow-200",
    text: "text-yellow-800",
  },
  C: {
    dot: "bg-red-500",
    tile: "bg-red-50 ring-red-200",
    text: "text-red-800",
  },
};

export default async function HomePage() {
  const user = await getSession();
  const counts = await countAssessmentsByResult();
  const total = counts.A + counts.B + counts.C;
  const recent = await listRecentAssessments(5);
  const today = new Intl.DateTimeFormat("th-TH", { dateStyle: "full" }).format(
    new Date(),
  );

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-8 text-white shadow-lg shadow-emerald-900/10 sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime-300/30 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
        </div>
        <HealthyPlate className="pointer-events-none absolute -right-6 top-1/2 hidden h-64 w-64 -translate-y-1/2 opacity-95 md:block lg:right-6" />

        <div className="relative max-w-xl">
          <p className="text-sm text-emerald-50">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            สวัสดี, {user?.fullName ?? "ผู้ใช้งาน"}
          </h1>
          <p className="mt-2 text-emerald-50">
            ประเมินภาวะโภชนาการ ติดตามผล และวางแผนอาหารให้ผู้ป่วยได้ในที่เดียว
          </p>

          <form
            action="/sga"
            method="get"
            role="search"
            className="mt-6 flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="home-hn" className="sr-only">
              ค้นหาผู้ป่วยด้วย HN
            </label>
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="home-hn"
                name="hn"
                inputMode="numeric"
                autoComplete="off"
                placeholder="ค้นหาผู้ป่วยด้วย HN"
                className="min-h-11 w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-300"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 cursor-pointer rounded-lg bg-zinc-900/25 px-5 text-sm font-medium text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-zinc-900/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              ค้นหา
            </button>
          </form>
          <Link
            href="/sga/new"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <PlusIcon className="h-4 w-4" />
            เริ่มประเมินใหม่
          </Link>
        </div>
      </section>

      {/* ---------- สถิติ ---------- */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          สรุปผลการประเมิน
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <ActivityIcon className="h-4 w-4 text-emerald-600" />
              ประเมินทั้งหมด
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
              {total}
            </p>
            <p className="text-xs text-zinc-500">ครั้ง</p>
          </div>
          {(["A", "B", "C"] as const).map((r) => (
            <div
              key={r}
              className={`rounded-xl p-4 shadow-sm ring-1 ${RESULT_TONE[r].tile}`}
            >
              <div
                className={`flex items-center gap-2 text-sm font-medium ${RESULT_TONE[r].text}`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${RESULT_TONE[r].dot}`}
                  aria-hidden="true"
                />
                SGA: {r}
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
                {counts[r]}
              </p>
              <p className="truncate text-xs text-zinc-600">
                {SGA_RESULT_META[r].label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- เมนูหลัก ---------- */}
      <section aria-labelledby="modules-heading">
        <h2
          id="modules-heading"
          className="mb-3 text-base font-semibold text-zinc-900"
        >
          เมนูหลัก
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            href="/sga"
            icon={ClipboardIcon}
            tone="bg-emerald-50 text-emerald-700 ring-emerald-100"
            title="แบบประเมินภาวะโภชนาการเบื้องต้น"
            description="กรอกแบบประเมิน SGA/NAF (M/R-NUT-001.1) ค้นหา HN ผู้ป่วย และดูประวัติการประเมิน"
          />
          <ModuleCard
            href="/menu2"
            icon={CalculatorIcon}
            tone="bg-amber-50 text-amber-700 ring-amber-100"
            title="คำนวณแคลอรี่/สารอาหารต่อวัน"
            description="คำนวณพลังงานรวมและสัดส่วนสารอาหาร (CHO/PRO/FAT) ต่อวันของผู้ป่วย"
          />
          <ModuleCard
            href="/mis"
            icon={DropletIcon}
            tone="bg-sky-50 text-sky-700 ring-sky-100"
            title="ประเมินภาวะโภชนาการผู้ป่วยไตเทียม"
            description="แบบประเมิน MIS (M/R-NUT-003.1) สำหรับผู้ป่วยที่ฟอกเลือดด้วยเครื่องไตเทียม"
          />
        </div>
      </section>

      {/* ---------- ล่าสุด + เกณฑ์ ---------- */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section
          aria-labelledby="recent-heading"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
        >
          <div className="flex items-center justify-between">
            <h2
              id="recent-heading"
              className="text-base font-semibold text-zinc-900"
            >
              การประเมินล่าสุด
            </h2>
            <Link
              href="/history"
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              ดูทั้งหมด
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <LeafIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  ยังไม่มีการประเมิน
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  เริ่มประเมินผู้ป่วยรายแรกได้เลย
                </p>
              </div>
              <Link
                href="/sga/new"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <PlusIcon className="h-4 w-4" />
                ประเมินใหม่
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/sga/${a.id}`}
                    className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-zinc-50"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${SGA_RESULT_META[a.sgaResult].badgeClass}`}
                      aria-label={`ผล SGA ${a.sgaResult}`}
                    >
                      {a.sgaResult}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {a.patientNameSnapshot}
                      </p>
                      <p className="text-xs text-zinc-500">
                        HN {a.hn} · {formatThaiDateFromDateTime(a.assessedAt)}{" "}
                        {formatTime(a.assessedAt)}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-zinc-600">
                      {a.totalScore} คะแนน
                    </span>
                    <ArrowRightIcon className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="guide-heading"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
        >
          <h2
            id="guide-heading"
            className="text-base font-semibold text-zinc-900"
          >
            เกณฑ์แปลผล SGA
          </h2>
          <ol className="mt-3 flex flex-col gap-2.5">
            {(["A", "B", "C"] as const).map((r) => (
              <li
                key={r}
                className={`rounded-lg p-3 ring-1 ${RESULT_TONE[r].tile}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${RESULT_TONE[r].text}`}
                  >
                    {r} = {SGA_RESULT_META[r].label}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-600">
                    {RESULT_RANGE[r]} คะแนน
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-700">
                  {SGA_RESULT_META[r].action}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function ModuleCard({
  href,
  icon: Icon,
  tone,
  title,
  description,
  badge,
}: {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 motion-reduce:hover:translate-y-0"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-zinc-900">{title}</h3>
          {badge && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>
      <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-emerald-600" />
    </Link>
  );
}

/** ภาพประกอบ "จานอาหารสุขภาพ" — ผัก ½, ข้าว/แป้ง ¼, โปรตีน ¼ (ตกแต่งเท่านั้น) */
function HealthyPlate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <circle cx="100" cy="100" r="92" fill="rgb(255 255 255 / 0.14)" />
      <circle cx="100" cy="100" r="78" fill="rgb(255 255 255 / 0.92)" />
      <circle cx="100" cy="100" r="68" fill="#f8fafc" />
      {/* ผัก ครึ่งจาน (ซ้าย) */}
      <path d="M100 34 A66 66 0 0 0 100 166 Z" fill="#86efac" />
      <circle cx="72" cy="72" r="11" fill="#22c55e" />
      <circle cx="60" cy="100" r="13" fill="#16a34a" />
      <circle cx="76" cy="128" r="10" fill="#4ade80" />
      <circle cx="84" cy="98" r="6" fill="#f97316" />
      <circle cx="70" cy="150" r="5" fill="#ef4444" />
      {/* แป้ง ¼ (ขวาบน) */}
      <path d="M100 34 A66 66 0 0 1 166 100 L100 100 Z" fill="#fde68a" />
      <ellipse
        cx="128"
        cy="66"
        rx="8"
        ry="4"
        fill="#fbbf24"
        transform="rotate(-30 128 66)"
      />
      <ellipse
        cx="140"
        cy="82"
        rx="8"
        ry="4"
        fill="#fbbf24"
        transform="rotate(20 140 82)"
      />
      <ellipse cx="118" cy="84" rx="7" ry="3.5" fill="#f59e0b" />
      {/* โปรตีน ¼ (ขวาล่าง) */}
      <path d="M166 100 A66 66 0 0 1 100 166 L100 100 Z" fill="#fecaca" />
      <rect
        x="112"
        y="112"
        width="30"
        height="20"
        rx="8"
        fill="#f87171"
        transform="rotate(-15 127 122)"
      />
      <circle cx="140" cy="140" r="7" fill="#fb7185" />
      <path d="M100 34 V166 M100 100 H166" stroke="#fff" strokeWidth="3" />
      {/* ผลไม้ข้างจาน */}
      <circle cx="176" cy="36" r="14" fill="#ef4444" />
      <path
        d="M176 22 q4 -8 10 -8"
        stroke="#166534"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
