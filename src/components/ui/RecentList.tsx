import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface RecentItem {
  id: number;
  href: string;
  badge: ReactNode;
  badgeClass: string;
  title: string;
  subtitle: string;
  trailing?: string;
}

/** รายการ "ล่าสุด" ใช้ร่วมกันทุกโมดูล (SGA / MIS / คำนวณแคลอรี่) */
export function RecentList({
  heading,
  items,
  emptyIcon,
  emptyText,
  iconTone,
}: {
  heading: string;
  items: RecentItem[];
  emptyIcon: ReactNode;
  emptyText: string;
  iconTone: string;
}) {
  return (
    <section aria-label={heading} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <h2 className="text-base font-semibold text-zinc-900">{heading}</h2>
      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full ${iconTone}`}>{emptyIcon}</span>
          <p className="text-sm font-medium text-zinc-800">ยังไม่มีรายการ</p>
          <p className="text-sm text-zinc-500">{emptyText}</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={a.href}
                className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-zinc-50"
              >
                <span
                  className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border px-2 text-sm font-bold tabular-nums ${a.badgeClass}`}
                >
                  {a.badge}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{a.title || "ไม่ระบุชื่อ"}</p>
                  <p className="text-xs text-zinc-500">{a.subtitle}</p>
                </div>
                {a.trailing && <span className="hidden text-xs text-zinc-600 sm:block">{a.trailing}</span>}
                <ArrowRightIcon className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
