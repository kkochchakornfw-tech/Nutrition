"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  EDS_QR_CARE_PROVIDER_CODE,
  EDS_QR_PRINT_SPID,
} from "@/lib/eds/constants";
import type { QrContext } from "@/lib/sga/drawEdsQr";

const SP_QUERY = "nutrition,โภชนา"; // ← ปรับตามผล query ข้อ 1

type Visit = {
  visitId: string;
  visitRef: string;
  visitType: "IPD" | "OPD";
  visitDate: string;
  visitTime: string;
  visitSpidName: string;
  treatSpid: string;
  treatSpidName: string;
};
type Doctor = { code: string; name: string; spid?: string; spidName?: string };
type ServicePoint = { id: string; name: string };

type Props = {
  open: boolean;
  hn: string;
  onCancel: () => void;
  onConfirm: (qr: QrContext | null) => void; // null = ส่งออกไม่ใส่ QR
};

export function QrContextModal({ open, hn, onCancel, onConfirm }: Props) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitId, setVisitId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorCode, setDoctorCode] = useState(EDS_QR_CARE_PROVIDER_CODE);
  const [printSpid, setPrintSpid] = useState(EDS_QR_PRINT_SPID);
  const [spOptions, setSpOptions] = useState<ServicePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visit = visits.find((v) => v.visitId === visitId) ?? null;

  // เปิด modal → ดึง visit + จุดบริการพร้อมกัน
  useEffect(() => {
    if (!open || !hn) return;
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [vRes, spRes] = await Promise.all([
          fetch(`/api/his-visits?hn=${encodeURIComponent(hn)}`),
          fetch(`/api/his-service-points?q=${encodeURIComponent(SP_QUERY)}`),
        ]);
        if (!vRes.ok) throw new Error("ดึงรายการ visit จาก HIS ไม่สำเร็จ");
        const v: Visit[] = await vRes.json();
        const sp: ServicePoint[] = spRes.ok ? await spRes.json() : [];
        if (!alive) return;
        setVisits(v);
        setSpOptions(sp);
        setVisitId(v[0]?.visitId ?? "");
      } catch (err) {
        if (alive)
          setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, hn]);

  // เลือก visit → ดึงแพทย์ของ visit นั้น แล้วตั้งค่าเริ่มต้น
  useEffect(() => {
    if (!visitId) {
      setDoctors([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/his-doctors?visit_id=${encodeURIComponent(visitId)}`,
        );
        const d: Doctor[] = res.ok ? await res.json() : [];
        if (!alive) return;
        setDoctors(d);
        setDoctorCode(d[0]?.code ?? EDS_QR_CARE_PROVIDER_CODE);
        const v = visits.find((x) => x.visitId === visitId);
        setPrintSpid(d[0]?.spid || v?.treatSpid || EDS_QR_PRINT_SPID);
      } catch {
        if (alive) setDoctors([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visitId, visits]);

  if (!open) return null;

  const canConfirm =
    !!visit?.visitRef && doctorCode.trim() !== "" && printSpid.trim() !== "";
  const selectedDoctor = doctors.find((d) => d.code === doctorCode);
  const spName =
    spOptions.find((s) => s.id === printSpid)?.name ||
    (selectedDoctor?.spid === printSpid ? selectedDoctor?.spidName : "") ||
    (visit?.treatSpid === printSpid ? visit?.treatSpidName : "");

  const label = "text-xs font-medium uppercase tracking-wide text-zinc-500";
  const field =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eds-qr-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-zinc-100 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="eds-qr-title"
              className="text-base font-semibold text-zinc-900"
            >
              ข้อมูล QR สำหรับ EDScare
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              HN <span className="font-medium text-zinc-700">{hn}</span> · เลือก
              visit และแพทย์ที่จะระบุในเอกสาร
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="ปิด"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-zinc-100"
                />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Visit */}
              <section className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className={label}>Visit (VN / AN)</span>
                  <span className="text-xs text-zinc-400">
                    {visits.length} รายการล่าสุด
                  </span>
                </div>

                {visits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
                    ไม่พบ visit ของผู้ป่วยรายนี้ใน HIS
                  </div>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {visits.map((v) => {
                      const selected = v.visitId === visitId;
                      return (
                        <button
                          key={v.visitId}
                          type="button"
                          onClick={() => setVisitId(v.visitId)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                            selected
                              ? "border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10"
                              : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected ? "border-blue-600" : "border-zinc-300"
                            }`}
                          >
                            {selected && (
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-zinc-900">
                                {v.visitRef}
                              </span>
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                                  v.visitType === "IPD"
                                    ? "bg-violet-100 text-violet-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {v.visitType}
                              </span>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-zinc-500">
                              {v.visitDate} · {v.visitTime.slice(0, 5)} ·{" "}
                              {v.treatSpidName || v.visitSpidName || "-"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Doctor */}
              <section className="space-y-2">
                <span className={label}>แพทย์ (Care provider)</span>
                {doctors.length > 0 ? (
                  <select
                    className={field}
                    value={doctorCode}
                    onChange={(e) => {
                      setDoctorCode(e.target.value);
                      const d = doctors.find((x) => x.code === e.target.value);
                      if (d?.spid) setPrintSpid(d.spid);
                    }}
                  >
                    {doctors.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      className={field}
                      value={doctorCode}
                      onChange={(e) => setDoctorCode(e.target.value)}
                      placeholder="รหัสแพทย์ เช่น 67MED31"
                    />
                    <p className="text-xs text-amber-600">
                      ไม่พบแพทย์ผูกกับ visit นี้ กรอกรหัสเองได้
                    </p>
                  </>
                )}
              </section>

              {/* Print SPID */}
              <section className="space-y-2">
                <span className={label}>
                  จุดบริการที่สั่งพิมพ์ (Print SPID)
                </span>
                <input
                  className={`${field} font-mono`}
                  list="eds-sp-list"
                  value={printSpid}
                  onChange={(e) => setPrintSpid(e.target.value)}
                />
                <datalist id="eds-sp-list">
                  {spOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </datalist>
                {spName && <p className="text-xs text-zinc-500">{spName}</p>}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4">
          <button
            type="button"
            onClick={() => onConfirm(null)}
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
          >
            ส่งออกไม่ใส่ QR
          </button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              disabled={!canConfirm}
              onClick={() =>
                visit &&
                onConfirm({
                  visitRef: visit.visitRef,
                  visitType: visit.visitType,
                  careProviderCode: doctorCode.trim(),
                  printSpid: printSpid.trim(),
                })
              }
            >
              ยืนยันและสร้างรูป
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
