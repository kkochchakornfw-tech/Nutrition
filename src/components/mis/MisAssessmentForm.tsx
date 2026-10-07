"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  AlertIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CircleIcon,
  SearchIcon,
  SpinnerIcon,
} from "@/components/ui/icons";
import { PatientCard } from "@/components/sga/PatientCard";
import { MisCriteriaSection } from "./MisCriteriaSection";
import type { Assessor } from "@/lib/sga/assessors";
import type { PatientInfo } from "@/lib/his/types";
import type { AssessorRole, MisAssessment, MisCriteria } from "@/lib/mis/types";
import { calcBmi } from "@/lib/sga/scoring";
import { determineNutritionStatus, NUTRITION_STATUS_META } from "@/lib/mis/scoring";

function nowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/** ISO → "YYYY-MM-DDTHH:mm" ตามเวลาเครื่อง สำหรับ <input type="datetime-local"> */
function isoToInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function numToStr(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : String(n);
}

function toNumberOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function MisAssessmentForm({ initial }: { initial?: MisAssessment }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hn, setHn] = useState(initial?.hn ?? searchParams.get("hn") ?? "");
  const [searched, setSearched] = useState(false);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [patientNotFound, setPatientNotFound] = useState(false);
  const [manualPatientName, setManualPatientName] = useState(initial?.patientNameSnapshot ?? "");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [criteria, setCriteria] = useState<MisCriteria[]>([]);
  const [assessors, setAssessors] = useState<Assessor[]>([]);

  const [assessedAt, setAssessedAt] = useState(initial ? isoToInput(initial.assessedAt) : nowForInput());
  const [assessorName, setAssessorName] = useState(initial?.assessorName ?? "");
  const [assessorRole, setAssessorRole] = useState<AssessorRole>(initial?.assessorRole ?? "dietitian");
  const [vnAn, setVnAn] = useState(initial?.vnAn ?? "");
  const [comorbidityText, setComorbidityText] = useState(initial?.comorbidityText ?? "");
  const [serumCreatinine, setSerumCreatinine] = useState(initial?.serumCreatinine ?? "");
  const [bun, setBun] = useState(initial?.bun ?? "");
  const [serumAlbumin, setSerumAlbumin] = useState(initial?.serumAlbumin ?? "");
  const [serumTibc, setSerumTibc] = useState(initial?.serumTibc ?? "");
  const [heightCm, setHeightCm] = useState(numToStr(initial?.heightCm));
  const [dryWeightKg, setDryWeightKg] = useState(numToStr(initial?.dryWeightKg));
  const [ibwKg, setIbwKg] = useState(numToStr(initial?.ibwKg));
  const [waistCm, setWaistCm] = useState(numToStr(initial?.waistCm));
  const [armCm, setArmCm] = useState(numToStr(initial?.armCm));
  const [legCm, setLegCm] = useState(numToStr(initial?.legCm));
  const [allergiesSnapshot, setAllergiesSnapshot] = useState(initial?.allergiesSnapshot ?? "");

  const [answers, setAnswers] = useState<Record<number, number>>(
    () => Object.fromEntries((initial?.answers ?? []).map((a) => [a.criteriaId, a.optionId])),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [ackedMissingCount, setAckedMissingCount] = useState<number | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, []);

  useEffect(() => {
    fetch("/api/mis/criteria")
      .then((res) => res.json())
      .then((data) => {
        setCriteria(data.criteria);
        setAssessors(data.assessors);
        if (!initial && data.assessors[0]) setAssessorName(data.assessors[0].fullName);
      });
    // initial คงที่ตลอดอายุของฟอร์ม — โหลดเกณฑ์ครั้งเดียวตอน mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const initialHn = initial?.hn ?? searchParams.get("hn");
    if (initialHn) void handleLookup(initialHn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLookup(hnValue?: string) {
    const target = (hnValue ?? hn).trim();
    if (!target) return;
    setLookupLoading(true);
    setLookupError(null);
    setPatientNotFound(false);
    setPatient(null);

    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(target)}`);
      if (res.status === 404) {
        setPatientNotFound(true);
        setSearched(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ค้นหาผู้ป่วยไม่สำเร็จ");
      if (!data.patient) throw new Error("รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง");
      setPatient(data.patient);
      // โหมดแก้ไข: คงค่าที่บันทึกไว้เดิม ไม่ทับด้วยข้อมูลล่าสุดจาก HIS
      if (!initial) {
        setAllergiesSnapshot(data.patient.allergiesText ?? "");
        setVnAn(data.patient.vnAn ?? "");
      }
      setSearched(true);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "ค้นหาผู้ป่วยไม่สำเร็จ");
    } finally {
      setLookupLoading(false);
    }
  }

  const bmi = useMemo(() => {
    const h = Number(heightCm);
    const w = Number(dryWeightKg);
    if (!h || !w) return null;
    return calcBmi(h, w);
  }, [heightCm, dryWeightKg]);

  const totalScore = useMemo(
    () =>
      criteria.reduce((sum, c) => {
        const optionId = answers[c.id];
        const option = c.options.find((o) => o.id === optionId);
        return sum + (option?.score ?? 0);
      }, 0),
    [criteria, answers],
  );
  const previewStatus = determineNutritionStatus(totalScore);

  const patientName = patient?.fullName ?? manualPatientName;
  const canFillRest = searched && (patient || (patientNotFound && manualPatientName.trim()));

  const missingItems = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    if (!assessedAt) items.push({ id: "sec-assessed-at", label: "วันที่/เวลาประเมิน" });
    if (!assessorName) items.push({ id: "sec-assessor", label: "ผู้ประเมิน" });
    criteria.forEach((c, index) => {
      if (answers[c.id] === undefined) {
        items.push({ id: `sec-criteria-${c.id}`, label: `${index + 1}. ${c.labelEn}` });
      }
    });
    return items;
  }, [assessedAt, assessorName, criteria, answers]);

  const requiredTotal = 2 + criteria.length;
  const answeredCount = requiredTotal - missingItems.length;

  function focusSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    el.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
    setHighlightId(id);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightId(null), 2500);
  }

  const highlightClass = (id: string) =>
    `scroll-mt-24 rounded-md p-1 -m-1 transition-colors duration-300 ${
      highlightId === id ? "bg-amber-100 ring-2 ring-amber-400" : ""
    }`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!canFillRest) {
      setSubmitError("กรุณาระบุ HN และข้อมูลผู้ป่วยก่อน");
      return;
    }
    if (missingItems.length > 0 && ackedMissingCount !== missingItems.length) {
      setAckedMissingCount(missingItems.length);
      setSubmitError(
        `ยังตอบไม่ครบ ${missingItems.length} หัวข้อ — กดบันทึกอีกครั้งหากต้องการบันทึกทั้งที่ยังไม่ครบ`,
      );
      focusSection(missingItems[0].id);
      return;
    }

    const flatAnswers = criteria
      .filter((c) => answers[c.id] !== undefined)
      .map((c) => ({ criteriaId: c.id, optionId: answers[c.id] }));

    if (flatAnswers.length === 0) {
      setSubmitError("กรุณาเลือกคำตอบอย่างน้อย 1 หมวด");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(initial ? `/api/mis/assessments/${initial.id}` : "/api/mis/assessments", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hn: hn.trim(),
          vnAn: vnAn || null,
          assessedAt: new Date(assessedAt).toISOString(),
          assessorName,
          assessorRole,
          comorbidityText: comorbidityText || null,
          serumCreatinine: serumCreatinine.trim() || null,
          bun: bun.trim() || null,
          serumAlbumin: serumAlbumin.trim() || null,
          serumTibc: serumTibc.trim() || null,
          heightCm: toNumberOrNull(heightCm),
          dryWeightKg: toNumberOrNull(dryWeightKg),
          ibwKg: toNumberOrNull(ibwKg),
          bmi,
          waistCm: toNumberOrNull(waistCm),
          armCm: toNumberOrNull(armCm),
          legCm: toNumberOrNull(legCm),
          patientNameSnapshot: patientName,
          allergiesSnapshot: allergiesSnapshot || null,
          answers: flatAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      router.push(`/mis/${data.assessment.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <Card>
        <SectionHeader step={1} title="ค้นหาข้อมูลผู้ป่วย" subtitle="ดึงข้อมูลจาก HIS ด้วยหมายเลข HN" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleLookup();
          }}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div className="w-full sm:w-56">
            <Field label="HN" htmlFor="hn" required>
              <Input
                id="hn"
                value={hn}
                onChange={(e) => setHn(e.target.value)}
                placeholder="เช่น 67-12-345678"
                inputMode="numeric"
                autoComplete="off"
                autoFocus={!hn}
                readOnly={!!initial}
              />
            </Field>
          </div>
          {!initial && (
          <Button type="submit" variant="secondary" disabled={lookupLoading || !hn.trim()}>
            {lookupLoading ? <SpinnerIcon /> : <SearchIcon />}
            {lookupLoading ? "กำลังค้นหา..." : "ค้นหา"}
          </Button>
          )}
        </form>
        {lookupError && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertIcon className="h-4 w-4 shrink-0" />
            {lookupError}
          </p>
        )}
        {patientNotFound && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              ไม่พบข้อมูล HN นี้ใน HIS — กรอกชื่อผู้ป่วยด้วยตนเองเพื่อดำเนินการต่อ
            </p>
            <div className="sm:max-w-sm">
              <Field label="ชื่อผู้ป่วย" htmlFor="manual-patient-name" required>
                <Input
                  id="manual-patient-name"
                  value={manualPatientName}
                  onChange={(e) => setManualPatientName(e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}
      </Card>
      {patient && <PatientCard patient={patient} />}

      {canFillRest && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
          <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-6 lg:order-1">
            <Card>
              <SectionHeader step={2} title="ข้อมูลหัวฟอร์ม" subtitle="วันที่ประเมิน ผล lab และสัดส่วนร่างกาย" />

              <SubGroup title="ข้อมูลการประเมิน">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div id="sec-assessed-at" className={highlightClass("sec-assessed-at")}>
                    <Field label="วันที่/เวลาประเมิน" htmlFor="assessed-at" required>
                      <Input
                        id="assessed-at"
                        type="datetime-local"
                        value={assessedAt}
                        onChange={(e) => setAssessedAt(e.target.value)}
                      />
                    </Field>
                  </div>
                  <div id="sec-assessor" className={highlightClass("sec-assessor")}>
                    <Field label="ผู้ประเมิน" htmlFor="assessor" required>
                      <Select
                        id="assessor"
                        value={assessorName}
                        onChange={(e) => setAssessorName(e.target.value)}
                      >
                        {assessors.map((a) => (
                          <option key={a.id} value={a.fullName}>
                            {a.fullName}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Field label="ตำแหน่งผู้ประเมิน" htmlFor="assessor-role" required>
                    <Select
                      id="assessor-role"
                      value={assessorRole}
                      onChange={(e) => setAssessorRole(e.target.value as AssessorRole)}
                    >
                      <option value="dietitian">นักกำหนดอาหาร</option>
                      <option value="nurse">พยาบาลไตเทียม</option>
                    </Select>
                  </Field>
                  <Field label="VN/AN" htmlFor="vn-an">
                    <Input id="vn-an" value={vnAn} onChange={(e) => setVnAn(e.target.value)} />
                  </Field>
                </div>
              </SubGroup>

              <SubGroup title="ผลตรวจทางห้องปฏิบัติการ">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Serum creatinine" suffix="mg/dL" htmlFor="creatinine">
                    <Input
                      id="creatinine"
                      autoComplete="off"
                      value={serumCreatinine}
                      onChange={(e) => setSerumCreatinine(e.target.value)}
                    />
                  </Field>
                  <Field label="BUN" suffix="mg/dL" htmlFor="bun">
                    <Input
                      id="bun"
                      autoComplete="off"
                      value={bun}
                      onChange={(e) => setBun(e.target.value)}
                    />
                  </Field>
                  <Field label="Serum albumin" suffix="g/dl" htmlFor="serum-albumin">
                    <Input
                      id="serum-albumin"
                      autoComplete="off"
                      value={serumAlbumin}
                      onChange={(e) => setSerumAlbumin(e.target.value)}
                    />
                  </Field>
                  <Field label="Serum TIBC" suffix="ug/dL" htmlFor="serum-tibc">
                    <Input
                      id="serum-tibc"
                      autoComplete="off"
                      value={serumTibc}
                      onChange={(e) => setSerumTibc(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="โรคประจำตัวร่วม" htmlFor="comorbidity">
                    <Textarea
                      id="comorbidity"
                      rows={2}
                      value={comorbidityText}
                      onChange={(e) => setComorbidityText(e.target.value)}
                    />
                  </Field>
                </div>
              </SubGroup>

              <SubGroup title="Anthropometric Measurement">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="ส่วนสูง" suffix="ซม." htmlFor="height">
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                    />
                  </Field>
                  <Field label="Dry Weight" suffix="กก." htmlFor="dry-weight">
                    <Input
                      id="dry-weight"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={dryWeightKg}
                      onChange={(e) => setDryWeightKg(e.target.value)}
                    />
                  </Field>
                  <Field label="น้ำหนักที่ควรจะเป็น (IBW)" suffix="กก." htmlFor="ibw">
                    <Input
                      id="ibw"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={ibwKg}
                      onChange={(e) => setIbwKg(e.target.value)}
                    />
                  </Field>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-zinc-700">
                      BMI <span className="font-normal text-zinc-500">(คำนวณอัตโนมัติ)</span>
                    </span>
                    <output className="flex min-h-10 items-baseline gap-1.5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2">
                      {bmi !== null ? (
                        <>
                          <span className="text-base font-semibold tabular-nums text-zinc-900">{bmi}</span>
                          <span className="text-xs text-zinc-500">kg/m²</span>
                        </>
                      ) : (
                        <span className="text-zinc-400">กรอกส่วนสูง/dry weight ก่อน</span>
                      )}
                    </output>
                  </div>
                  <Field label="เส้นรอบเอว" suffix="นิ้ว" htmlFor="waist">
                    <Input
                      id="waist"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={waistCm}
                      onChange={(e) => setWaistCm(e.target.value)}
                    />
                  </Field>
                  <Field label="เส้นรอบวงแขน" suffix="ซม." htmlFor="arm">
                    <Input
                      id="arm"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={armCm}
                      onChange={(e) => setArmCm(e.target.value)}
                    />
                  </Field>
                  <Field label="เส้นรอบวงขา" suffix="ซม." htmlFor="leg">
                    <Input
                      id="leg"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={legCm}
                      onChange={(e) => setLegCm(e.target.value)}
                    />
                  </Field>
                </div>
              </SubGroup>
            </Card>

            <Card>
              <SectionHeader
                step={3}
                title="Malnutrition Inflammation Score (MIS)"
                subtitle="เลือกคำตอบที่ตรงกับผู้ป่วยมากที่สุดในแต่ละหัวข้อ (คะแนน 0-3)"
              />
              <div className="mt-5 flex flex-col gap-3">
                {criteria.map((c, i) => (
                  <MisCriteriaSection
                    key={c.id}
                    id={`sec-criteria-${c.id}`}
                    index={i + 1}
                    highlighted={highlightId === `sec-criteria-${c.id}`}
                    criteria={c}
                    selectedOptionId={answers[c.id] ?? null}
                    onChange={(optionId) =>
                      setAnswers((prev) => ({ ...prev, [c.id]: optionId }))
                    }
                  />
                ))}
              </div>
            </Card>

            <div className="sticky bottom-2 z-10 rounded-xl border border-zinc-200 bg-white/95 p-3 sm:bottom-4 sm:p-4 shadow-lg shadow-zinc-900/10 backdrop-blur supports-[backdrop-filter]:bg-white/85">
              <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">คะแนนรวม</p>
                    <p className="text-3xl font-semibold leading-none tabular-nums text-zinc-900" aria-live="polite">
                      {totalScore}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium ${NUTRITION_STATUS_META[previewStatus].badgeClass}`}
                  >
                    {NUTRITION_STATUS_META[previewStatus].label}
                  </span>
                </div>
                <Button type="submit" disabled={submitting} className="w-full px-6 sm:w-auto">
                  {submitting && <SpinnerIcon />}
                  {submitting ? "กำลังบันทึก..." : initial ? "บันทึกการแก้ไข" : "บันทึกผลการประเมิน"}
                </Button>
              </div>
              {submitError && (
                <p role="alert" className="mt-3 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {submitError}
                </p>
              )}
            </div>
          </form>

          <aside className="order-first lg:order-2 lg:sticky lg:top-4" aria-label="ความคืบหน้าการกรอก">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">ความคืบหน้า</h2>
                <span className="text-sm tabular-nums text-zinc-600">
                  {answeredCount}/{requiredTotal}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={requiredTotal}
                aria-valuenow={answeredCount}
                aria-label="หัวข้อที่กรอกแล้ว"
                className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${
                    missingItems.length === 0 ? "bg-green-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${requiredTotal ? (answeredCount / requiredTotal) * 100 : 0}%` }}
                />
              </div>

              {missingItems.length > 0 ? (
                <>
                  <p className="mt-4 text-xs font-medium text-amber-800">
                    ยังไม่ได้กรอก {missingItems.length} หัวข้อ — กดเพื่อไปยังช่องนั้น
                  </p>
                  <ul className="mt-2 flex max-h-40 lg:max-h-[55vh] flex-col gap-0.5 overflow-y-auto">
                    {missingItems.map((item) => (
                      <li key={item.id}>
                        <JumpButton onClick={() => focusSection(item.id)}>
                          <CircleIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="flex-1">{item.label}</span>
                        </JumpButton>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                  <CheckCircleIcon className="h-4 w-4 shrink-0" />
                  กรอกครบทุกหัวข้อแล้ว
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function SubGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-zinc-100 pt-5 first-of-type:mt-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      {children}
    </div>
  );
}

function JumpButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-800 transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
    >
      {children}
      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
