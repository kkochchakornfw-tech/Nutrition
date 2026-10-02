"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { PatientCard } from "./PatientCard";
import type { PatientInfo } from "@/lib/his/types";
import type { AssessmentSummary } from "@/lib/sga/types";
import { SGA_RESULT_META } from "@/lib/sga/scoring";

function PatientResult({ patient }: { patient: PatientInfo }) {
  const [history, setHistory] = useState<AssessmentSummary[] | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/sga/assessments?hn=${encodeURIComponent(patient.hn)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setHistory(data.assessments ?? []);
      })
      .catch(() => {
        if (!ignore) setHistory([]);
      });
    return () => {
      ignore = true;
    };
  }, [patient.hn]);

  return (
    <div className="flex flex-col gap-2">
      <PatientCard
        patient={patient}
        actions={
          <Link href={`/sga/new?hn=${encodeURIComponent(patient.hn)}`}>
            <Button type="button">ประเมินใหม่</Button>
          </Link>
        }
      />
      <div className="rounded-lg border border-zinc-200 bg-white px-5 py-3">
        <h4 className="text-sm font-semibold text-zinc-700">ประวัติการประเมิน</h4>
        {history === null ? (
          <p className="mt-2 text-sm text-zinc-500">กำลังโหลด...</p>
        ) : history.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">ยังไม่มีประวัติการประเมินสำหรับ HN นี้</p>
        ) : (
          <ul className="mt-1 divide-y divide-zinc-100">
            {history.map((a) => {
              const meta = SGA_RESULT_META[a.sgaResult];
              return (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div className="text-sm">
                    <p className="font-medium text-zinc-900">ครั้งที่ {a.visitNo}</p>
                    <p className="text-zinc-500">
                      {new Date(a.assessedAt).toLocaleString("th-TH")} · ผู้ประเมิน {a.assessorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}
                    >
                      {a.sgaResult} · {a.totalScore} คะแนน
                    </span>
                    <Link
                      href={`/sga/${a.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      ดูรายละเอียด
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SgaSearch() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("hn") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(target: string) {
    const q = target.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ค้นหาไม่สำเร็จ");
      setPatients(data.patients);
      setSearchedQuery(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ค้นหาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time search on mount from the ?hn= query param
    if (initialQuery) void runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(query);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full flex-1">
          <Field label="ค้นหาผู้ป่วยด้วย HN หรือชื่อ" htmlFor="patient-search">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <Input
                id="patient-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="เช่น 67-12-345678"
                autoComplete="off"
                className="min-h-12 w-full pl-10 text-base"
              />
            </div>
          </Field>
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="min-h-12 px-6">
          {loading ? "กำลังค้นหา..." : "ค้นหา"}
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {searchedQuery !== null && patients.length === 0 && !error && (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          <p>ไม่พบผู้ป่วยที่ตรงกับ &ldquo;{searchedQuery}&rdquo; ใน HIS (mock)</p>
          {/^\d+$/.test(searchedQuery) && (
            <p className="mt-1">
              หากต้องการประเมินโดยกรอกข้อมูลผู้ป่วยเอง{" "}
              <Link
                href={`/sga/new?hn=${encodeURIComponent(searchedQuery)}`}
                className="font-medium text-blue-600 hover:underline"
              >
                เริ่มประเมินใหม่ด้วย HN {searchedQuery}
              </Link>
            </p>
          )}
        </div>
      )}

      {patients.length > 0 && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-zinc-500">พบผู้ป่วย {patients.length} ราย</p>
          {patients.map((p) => (
            <PatientResult key={p.hn} patient={p} />
          ))}
        </div>
      )}
    </div>
  );
}
