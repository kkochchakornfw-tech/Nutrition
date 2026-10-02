"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertIcon, CalculatorIcon, CheckCircleIcon, SpinnerIcon } from "@/components/ui/icons";
import type { FoodItemAdminRow } from "@/lib/calorie/foodsRepo";

type NumField = "facCho" | "facPro" | "facFat" | "facKcal";
const NUM_COLS: { field: NumField; label: string }[] = [
  { field: "facCho", label: "fac CHO" },
  { field: "facPro", label: "fac PRO" },
  { field: "facFat", label: "fac FAT" },
  { field: "facKcal", label: "fac kcal" },
];

export default function AdminFoodsPage() {
  const [rows, setRows] = useState<FoodItemAdminRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch("/api/admin/foods");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
      return;
    }
    setRows(data.foods);
  }

  // โหลดครั้งแรกด้วย .then() ตรง ๆ ในเอฟเฟกต์ (ไม่เรียกผ่านฟังก์ชัน async ชื่อ)
  // ส่วน load() ด้านบนใช้เรียกซ้ำหลังบันทึกไม่สำเร็จจากตัวจัดการเหตุการณ์เท่านั้น
  useEffect(() => {
    fetch("/api/admin/foods")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) setRows(data.foods);
        else setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
      })
      .catch(() => setError("โหลดข้อมูลไม่สำเร็จ"));
  }, []);

  async function saveField(
    row: FoodItemAdminRow,
    patch: { labelTh?: string; facCho?: number; facPro?: number; facFat?: number; facKcal?: number }
  ) {
    setSavingKey(row.key);
    setError(null);
    const res = await fetch(`/api/admin/foods/${encodeURIComponent(row.key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSavingKey(null);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      await load();
      return;
    }
    setRows((prev) => prev?.map((r) => (r.key === row.key ? { ...r, ...patch } : r)) ?? null);
    setSavedKey(row.key);
    setTimeout(() => setSavedKey((k) => (k === row.key ? null : k)), 1500);
  }

  function handleNumBlur(row: FoodItemAdminRow, field: NumField, value: string) {
    const n = Number(value);
    if (value.trim() === "" || !Number.isFinite(n) || n < 0 || n === row[field]) return;
    void saveField(row, { [field]: n });
  }

  function handleLabelBlur(row: FoodItemAdminRow, value: string) {
    const label = value.trim();
    if (!label || label === row.labelTh) return;
    void saveField(row, { labelTh: label });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
            <CalculatorIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900">ค่า fac อาหาร (ตาราง 3)</h1>
            <p className="text-sm text-zinc-600">กรัม/kcal ต่อ 1 ส่วนของแต่ละรายการ — คลิกช่องแล้วกด Tab หรือคลิกที่อื่นเพื่อบันทึก</p>
          </div>
        </div>
        <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:underline">
          ← กลับหน้าผู้ดูแลระบบ
        </Link>
      </header>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertIcon className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        {rows === null ? (
          <p className="p-5 text-sm text-zinc-500">กำลังโหลด...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">รายการอาหาร</th>
                  {NUM_COLS.map((c) => (
                    <th key={c.field} className="px-3 py-3 text-right font-medium">
                      {c.label}
                    </th>
                  ))}
                  <th className="w-8 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => (
                  <tr key={row.key} className={row.manual ? "bg-sky-50/40" : undefined}>
                    <td className="px-5 py-2.5">
                      <input
                        defaultValue={row.labelTh}
                        onBlur={(e) => handleLabelBlur(row, e.target.value)}
                        disabled={savingKey === row.key}
                        className="w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-zinc-900 transition-colors hover:border-zinc-300 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600/25"
                      />
                      {row.manual && <span className="ml-2 text-xs text-sky-700">กรอกค่าเอง (ไม่ใช้ fac)</span>}
                    </td>
                    {NUM_COLS.map((c) => (
                      <td key={c.field} className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          defaultValue={row[c.field]}
                          onBlur={(e) => handleNumBlur(row, c.field, e.target.value)}
                          disabled={savingKey === row.key || row.manual}
                          className="w-20 min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-right text-sm tabular-nums text-zinc-900 transition-colors hover:border-zinc-300 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600/25 disabled:text-zinc-300"
                        />
                      </td>
                    ))}
                    <td className="px-2 text-center">
                      {savingKey === row.key && <SpinnerIcon className="h-4 w-4 text-zinc-400" />}
                      {savedKey === row.key && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        แก้ได้เฉพาะชื่อและค่า fac ของรายการที่มีอยู่แล้ว 16 รายการ — เพิ่ม/ลบรายการทำไม่ได้จากหน้านี้
        เพราะรายการผูกกับการจัดหมวดในธงโภชนาการ ต้องแก้โค้ดโดยผู้พัฒนาระบบ
      </p>
    </div>
  );
}
