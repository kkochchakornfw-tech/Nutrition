import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { listHistory, listPerformers, toDateKey, type HistoryEntry, type HistoryKind } from "@/lib/history";
import { FORM_KIND_META } from "@/lib/formKinds";
import { SGA_RESULT_META } from "@/lib/sga/scoring";
import { NUTRITION_STATUS_META } from "@/lib/mis/scoring";
import {
  ArrowRightIcon,
  CalculatorIcon,
  CalendarIcon,
  ClipboardIcon,
  DropletIcon,
  HistoryIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from "@/components/ui/icons";

const KIND_ICON: Record<HistoryKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  sga: ClipboardIcon,
  calorie: CalculatorIcon,
  mis: DropletIcon,
};

const TZ = "Asia/Bangkok";
const dayHeading = new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeZone: TZ });
const timeLabel = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

function isKind(v: string | undefined): v is HistoryKind {
  return v === "sga" || v === "calorie" || v === "mis";
}

/** สร้าง query string โดยคงตัวกรองอื่นไว้ */
function hrefWith(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/history?${qs}` : "/history";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const date = first(sp.date);
  const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  const hn = first(sp.hn);
  const rawKind = first(sp.kind);
  const kind = isKind(rawKind) ? rawKind : undefined;
  const performers = await listPerformers();
  const rawBy = first(sp.by);
  const by = rawBy && performers.includes(rawBy) ? rawBy : undefined;
  const current = { date: validDate, hn, by, kind };

  const all = await listHistory({ date: validDate, hn, performedBy: by });
  const entries = kind ? all.filter((e) => e.kind === kind) : all;
  const kindCounts: Record<HistoryKind, number> = { sga: 0, calorie: 0, mis: 0 };
  for (const e of all) kindCounts[e.kind] += 1;

  const groups: { dateKey: string; items: HistoryEntry[] }[] = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last?.dateKey === e.dateKey) last.items.push(e);
    else groups.push({ dateKey: e.dateKey, items: [e] });
  }

  const hasFilter = Boolean(validDate || hn || by || kind);
  const todayKey = toDateKey(new Date().toISOString());

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <HistoryIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900 sm:text-3xl">ประวัติ</h1>
          <p className="text-sm text-zinc-600">รายการแบบฟอร์มที่บันทึกไว้ทั้งหมด กรองตามวันที่ HN หรือผู้ประเมินได้</p>
        </div>
      </header>

      {/* ---------- ตัวกรอง ---------- */}
      <section aria-label="ตัวกรองประวัติ" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
        <form method="get" action="/history" className="grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
          {kind && <input type="hidden" name="kind" value={kind} />}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700">วันที่</span>
            <span className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="date"
                name="date"
                defaultValue={validDate}
                max={todayKey}
                className="min-h-10 w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700">HN</span>
            <span className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                name="hn"
                defaultValue={hn}
                inputMode="numeric"
                autoComplete="off"
                placeholder="เช่น 67-12-345678"
                className="min-h-10 w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700">ผู้ประเมิน</span>
            <span className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <select
                name="by"
                defaultValue={by ?? ""}
                className="min-h-10 w-full cursor-pointer appearance-none rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-8 text-sm text-zinc-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
              >
                <option value="">ทุกคน</option>
                {performers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="min-h-10 flex-1 cursor-pointer rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:flex-none"
            >
              กรอง
            </button>
            {hasFilter && (
              <Link
                href="/history"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                <XIcon className="h-4 w-4" />
                ล้าง
              </Link>
            )}
          </div>
        </form>

        {/* ชนิดฟอร์ม (แยกสี) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
          <span className="text-xs text-zinc-500">ชนิดฟอร์ม</span>
          <KindChip href={hrefWith(current, { kind: undefined })} active={!kind} activeClass="bg-zinc-900 text-white ring-zinc-900">
            ทั้งหมด <Count n={all.length} />
          </KindChip>
          {(Object.keys(FORM_KIND_META) as HistoryKind[]).map((k) => {
            const meta = FORM_KIND_META[k];
            return (
              <KindChip key={k} href={hrefWith(current, { kind: k })} active={kind === k} activeClass={meta.activeFilter}>
                <span className={`h-2.5 w-2.5 rounded-full ring-2 ring-white/70 ${meta.dot}`} aria-hidden="true" />
                {meta.label} <Count n={kindCounts[k]} />
              </KindChip>
            );
          })}
        </div>
      </section>

      {/* ---------- ผลลัพธ์ ---------- */}
      <p className="-mb-2 text-sm text-zinc-600" aria-live="polite">
        {hasFilter ? "พบ" : "ทั้งหมด"} <span className="font-semibold tabular-nums text-zinc-900">{entries.length}</span> รายการ
        {validDate && <> · วันที่ {dayHeading.format(new Date(`${validDate}T12:00:00+07:00`))}</>}
        {hn && <> · HN มี “{hn}”</>}
        {by && <> · ผู้ประเมิน {by}</>}
      </p>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <HistoryIcon className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-zinc-800">
            {hasFilter ? "ไม่พบประวัติตามเงื่อนไขที่เลือก" : "ยังไม่มีประวัติการบันทึก"}
          </p>
          {hasFilter ? (
            <Link href="/history" className="text-sm font-medium text-emerald-700 hover:underline">
              ดูประวัติทั้งหมด
            </Link>
          ) : (
            <Link href="/sga/new" className="text-sm font-medium text-emerald-700 hover:underline">
              เริ่มประเมินใหม่
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.dateKey} aria-labelledby={`day-${g.dateKey}`}>
              <h2
                id={`day-${g.dateKey}`}
                className="sticky top-14 z-10 -mx-1 mb-2 flex items-center gap-2 bg-zinc-50/90 px-1 py-1.5 text-sm font-semibold text-zinc-700 backdrop-blur"
              >
                <CalendarIcon className="h-4 w-4 text-zinc-400" />
                {dayHeading.format(new Date(`${g.dateKey}T12:00:00+07:00`))}
                <span className="font-normal text-zinc-500">· {g.items.length} รายการ</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {g.items.map((e) => (
                  <li key={e.id}>
                    <HistoryRow entry={e} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry: e }: { entry: HistoryEntry }) {
  const meta = FORM_KIND_META[e.kind];
  const Icon = KIND_ICON[e.kind];
  return (
    <Link
      href={e.href}
      className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-white py-3 pl-5 pr-4 shadow-sm ring-1 ring-zinc-200 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.bar}`} aria-hidden="true" />
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${meta.chip}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-medium text-zinc-900">{e.patientName}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${meta.chip}`}>{meta.shortLabel}</span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          HN {e.hn} · {timeLabel.format(new Date(e.at))} น.
          {e.sga && <> · ครั้งที่ {e.sga.visitNo}</>} · {e.performedBy}
        </p>
      </div>
      {e.sga && (
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-sm tabular-nums text-zinc-600 sm:inline">{e.sga.totalScore} คะแนน</span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${SGA_RESULT_META[e.sga.result].badgeClass}`}
            title={SGA_RESULT_META[e.sga.result].label}
          >
            {e.sga.result}
            <span className="sr-only"> · {SGA_RESULT_META[e.sga.result].label}</span>
          </span>
        </div>
      )}
      {e.calorie && (
        <span className="shrink-0 text-right">
          <span className="block text-sm font-semibold tabular-nums text-zinc-900">
            {Math.round(e.calorie.totalEnergy).toLocaleString("th-TH")} kcal
          </span>
          <span className="hidden text-xs text-zinc-500 sm:block">
            {e.calorie.mode === "percent" ? "ตาม %" : "ตามโปรตีน"}
          </span>
        </span>
      )}
      {e.mis && (
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-sm tabular-nums text-zinc-600 sm:inline">{e.mis.totalScore} คะแนน</span>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${NUTRITION_STATUS_META[e.mis.status].badgeClass}`}
          >
            {NUTRITION_STATUS_META[e.mis.status].label}
          </span>
        </div>
      )}
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
    </Link>
  );
}

function KindChip({
  href,
  active,
  activeClass,
  children,
}: {
  href: string;
  active: boolean;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-medium ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
        active ? activeClass : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
}

function Count({ n }: { n: number }) {
  return <span className="tabular-nums opacity-75">({n})</span>;
}
