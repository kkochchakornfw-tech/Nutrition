"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import {
  CalculatorIcon,
  ClipboardIcon,
  DropletIcon,
  HistoryIcon,
  HomeIcon,
  MenuIcon,
  ShieldIcon,
  XIcon,
} from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** ใช้ตรงตัวเท่านั้นในการเช็ค active (ไม่รวมหน้าลูก) */
  exact?: boolean;
  /** สีไอคอนประจำฟอร์ม (ตรงกับสีในหน้าประวัติ) */
  accent?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "หน้าแรก", icon: HomeIcon, exact: true },
  { href: "/sga", label: "แบบประเมิน SGA/NAF", icon: ClipboardIcon, accent: "text-emerald-600" },
  { href: "/menu2", label: "คำนวณแคลอรี่/สารอาหาร", icon: CalculatorIcon, accent: "text-amber-600" },
  { href: "/mis", label: "ประเมินผู้ป่วยไตเทียม (MIS)", icon: DropletIcon, accent: "text-sky-600" },
  { href: "/history", label: "ประวัติ", icon: HistoryIcon },
];

const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "ผู้ดูแลระบบ",
  icon: ShieldIcon,
  accent: "text-zinc-700",
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppHeader({
  fullName,
  position,
  isAdmin = false,
}: {
  fullName: string;
  position: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function openDrawer() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function closeDrawer() {
    dialogRef.current?.close();
  }

  // ปิด drawer เมื่อเปลี่ยนหน้า
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const initial = fullName.trim().charAt(0);

  return (
    <>
      <header className="sticky top-0 z-30 print:hidden border-b border-white/60 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <button
            type="button"
            onClick={openDrawer}
            aria-label="เปิดเมนู"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="app-drawer"
            className="-ml-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md font-semibold text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Image src="/icons/logo.png" alt="" width={32} height={32} priority className="h-8 w-8" />
            <span className="truncate">ระบบประเมินภาวะโภชนาการ</span>
          </Link>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        id="app-drawer"
        aria-label="เมนูหลัก"
        className="glass-drawer"
        onClose={() => setOpen(false)}
        // คลิกที่ ::backdrop จะได้ target เป็นตัว dialog เอง
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDrawer();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Image src="/icons/logo.png" alt="" width={32} height={32} className="h-8 w-8" />
              Nutrition
            </span>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="ปิดเมนู"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl border border-white/70 bg-white/50 p-3 shadow-sm">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-semibold text-white"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">{fullName}</p>
              {position && <p className="truncate text-xs text-zinc-700">{position}</p>}
            </div>
          </div>

          <nav aria-label="เมนูหลัก" className="mt-4 flex-1 overflow-y-auto px-3">
            <ul className="flex flex-col gap-1">
              {(isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS).map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeDrawer}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 ${
                        active
                          ? "bg-white/80 text-emerald-800 shadow-sm ring-1 ring-white"
                          : "text-zinc-800 hover:bg-white/55"
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${item.accent ?? (active ? "text-emerald-600" : "text-zinc-600")}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-white/60 p-3">
            <LogoutButton className="min-h-11 w-full rounded-lg px-3 py-2 hover:bg-white/55" />
          </div>
        </div>
      </dialog>
    </>
  );
}
