"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AlertIcon, ArrowRightIcon, SpinnerIcon, UserIcon } from "@/components/ui/icons";
import type { DietitianRow } from "@/lib/sga/assessors";

export default function AdminDietitiansPage() {
  const [rows, setRows] = useState<DietitianRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function load() {
    setError(null);
    const res = await fetch("/api/admin/dietitians");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
      return;
    }
    setRows(data.dietitians);
  }

  // โหลดครั้งแรกด้วย .then() ตรง ๆ ในเอฟเฟกต์ (ไม่เรียกผ่านฟังก์ชัน async ชื่อ)
  // ส่วน load() ด้านบนใช้เรียกซ้ำหลังบันทึก/แก้ไขจากตัวจัดการเหตุการณ์เท่านั้น
  useEffect(() => {
    fetch("/api/admin/dietitians")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) setRows(data.dietitians);
        else setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
      })
      .catch(() => setError("โหลดข้อมูลไม่สำเร็จ"));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const fullName = newName.trim();
    if (!fullName) return;
    setAdding(true);
    setError(null);
    const res = await fetch("/api/admin/dietitians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มไม่สำเร็จ");
      return;
    }
    setNewName("");
    await load();
  }

  async function toggleActive(row: DietitianRow) {
    setSavingId(row.id);
    setError(null);
    const res = await fetch(`/api/admin/dietitians/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    const data = await res.json();
    setSavingId(null);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, isActive: !row.isActive } : r)) ?? null);
  }

  async function renameRow(row: DietitianRow, fullName: string) {
    if (!fullName.trim() || fullName === row.fullName) return;
    setSavingId(row.id);
    setError(null);
    const res = await fetch(`/api/admin/dietitians/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: fullName.trim() }),
    });
    const data = await res.json();
    setSavingId(null);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      await load(); // คืนค่าชื่อเดิมกลับมาแสดง
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, fullName: fullName.trim() } : r)) ?? null);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <UserIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900">ผู้ประเมิน (Dietitian)</h1>
            <p className="text-sm text-zinc-600">รายชื่อที่ขึ้นในช่อง “ผู้ประเมิน” ของแบบฟอร์ม SGA</p>
          </div>
        </div>
        <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:underline">
          ← กลับหน้าผู้ดูแลระบบ
        </Link>
      </header>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <Field label="เพิ่มผู้ประเมินใหม่" htmlFor="new-dietitian">
              <Input
                id="new-dietitian"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ชื่อ-นามสกุล"
              />
            </Field>
          </div>
          <Button type="submit" disabled={adding || !newName.trim()}>
            {adding && <SpinnerIcon />}
            {adding ? "กำลังเพิ่ม..." : "เพิ่ม"}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertIcon className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        {rows === null ? (
          <p className="p-5 text-sm text-zinc-500">กำลังโหลด...</p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">ยังไม่มีรายชื่อผู้ประเมิน</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-5 py-3 font-medium">สถานะ</th>
                <th className="w-24 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => (
                <tr key={row.id} className={row.isActive ? undefined : "bg-zinc-50/60"}>
                  <td className="px-5 py-3">
                    <input
                      defaultValue={row.fullName}
                      onBlur={(e) => void renameRow(row, e.target.value)}
                      disabled={savingId === row.id}
                      className={`w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition-colors hover:border-zinc-300 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600/25 ${
                        row.isActive ? "text-zinc-900" : "text-zinc-400"
                      }`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        row.isActive
                          ? "bg-green-50 text-green-700 ring-green-200"
                          : "bg-zinc-100 text-zinc-500 ring-zinc-200"
                      }`}
                    >
                      {row.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void toggleActive(row)}
                      disabled={savingId === row.id}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === row.id ? (
                        <SpinnerIcon className="h-3.5 w-3.5" />
                      ) : row.isActive ? (
                        "ปิดใช้งาน"
                      ) : (
                        "เปิดใช้งาน"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        ปิดใช้งานแทนการลบ เพื่อให้ชื่อเดิมยังแสดงถูกต้องในประวัติการประเมินเก่า
      </p>
      <Link href="/admin/foods" className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline">
        ไปหน้าแก้ค่า fac อาหาร (ตาราง 3)
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
