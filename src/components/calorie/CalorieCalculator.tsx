"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  AlertIcon,
  CheckCircleIcon,
  SearchIcon,
  SpinnerIcon,
} from "@/components/ui/icons";
import { MacroBar, MacroTable, TotalEnergy } from "./MacroBreakdown";
import { FoodPlanTable, type FoodDraft } from "./FoodPlanTable";
import { NutritionFlag } from "./NutritionFlag";
import {
  calcFoodPlan,
  calcMacros,
  calcTotalEnergy,
  round,
} from "@/lib/calorie/calc";
import {
  DEFAULT_PORTIONS,
  FOOD_EXCHANGES,
  type FoodExchange,
} from "@/lib/calorie/foods";
import type {
  CalorieInputs,
  FoodLineInput,
  MacroMode,
} from "@/lib/calorie/types";
import type { Assessor } from "@/lib/sga/assessors";
import type { PatientInfo } from "@/lib/his/types";
import type { AssessmentSummary } from "@/lib/sga/types";
import {
  formatAge,
  formatThaiDateFromDateTime,
  genderLabel,
} from "@/lib/format";

/** "" → undefined, อื่น ๆ → number (NaN ถ้าพิมพ์ไม่ใช่ตัวเลข) */
const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

function initialFoodDrafts(foods: FoodExchange[]): Record<string, FoodDraft> {
  return Object.fromEntries(
    foods.map((f) => [
      f.key,
      {
        portions: String(DEFAULT_PORTIONS),
        manualCho: "",
        manualPro: "",
        manualFat: "",
        manualKcal: "",
      },
    ]),
  );
}

export function CalorieCalculator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------- ผู้ป่วย ----------
  const [hn, setHn] = useState(searchParams.get("hn") ?? "");
  const [searched, setSearched] = useState(false);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [patientNotFound, setPatientNotFound] = useState(false);
  const [manualPatientName, setManualPatientName] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [latestSga, setLatestSga] = useState<AssessmentSummary | null>(null);

  // ---------- ตาราง 1–2 ----------
  const [weightKg, setWeightKg] = useState("");
  const [factorCal, setFactorCal] = useState("");
  const [mode, setMode] = useState<MacroMode>("percent");
  const [pctCho, setPctCho] = useState("");
  const [pctPro, setPctPro] = useState("");
  const [pctFat, setPctFat] = useState("");
  const [factorProtein, setFactorProtein] = useState("");
  const [note, setNote] = useState("");
  // เริ่มด้วยค่าคงที่ในโค้ดก่อนให้ฟอร์มใช้งานได้ทันที แล้วอัปเดตเป็นค่า fac ล่าสุดจาก DB
  // (ที่ admin แก้ได้) เมื่อโหลดเสร็จ — คีย์ของรายการอาหารคงที่เสมอจึง merge ได้ปลอดภัย
  const [foods, setFoods] = useState<FoodExchange[]>(FOOD_EXCHANGES);
  const [foodDrafts, setFoodDrafts] = useState<Record<string, FoodDraft>>(() =>
    initialFoodDrafts(FOOD_EXCHANGES),
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [assessors, setAssessors] = useState<Assessor[]>([]);
  const [performedBy, setPerformedBy] = useState("");

  useEffect(() => {
    const initialHn = searchParams.get("hn");
    if (initialHn) void handleLookup(initialHn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/calorie/foods")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.foods?.length) setFoods(data.foods);
      })
      .catch(() => {
        /* ใช้ค่าคงที่ในโค้ดต่อไปถ้าโหลดไม่สำเร็จ */
      });
  }, []);

  useEffect(() => {
    fetch("/api/sga/criteria")
      .then((res) => res.json())
      .then((data) => {
        setAssessors(data.assessors);
        if (data.assessors[0]) setPerformedBy(data.assessors[0].fullName);
      });
  }, []);
  async function handleLookup(hnValue?: string) {
    const target = (hnValue ?? hn).trim();
    if (!target) return;
    setLookupLoading(true);
    setLookupError(null);
    setPatientNotFound(false);
    setPatient(null);
    setLatestSga(null);

    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(target)}`);
      if (res.status === 404) {
        setPatientNotFound(true);
        setSearched(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ค้นหาผู้ป่วยไม่สำเร็จ");
      setPatient(data.patient);
      setSearched(true);

      // น้ำหนักล่าสุดจากแบบประเมิน SGA — เติมให้อัตโนมัติถ้ายังไม่ได้กรอก
      const hist = await fetch(
        `/api/sga/assessments?hn=${encodeURIComponent(target)}`,
      )
        .then((r) => (r.ok ? r.json() : { assessments: [] }))
        .catch(() => ({ assessments: [] }));
      const latest: AssessmentSummary | undefined = hist.assessments?.[0];
      if (latest) {
        setLatestSga(latest);
        setWeightKg((w) => w || String(latest.weightKg));
      }
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "ค้นหาผู้ป่วยไม่สำเร็จ",
      );
    } finally {
      setLookupLoading(false);
    }
  }

  const patientName = patient?.fullName ?? manualPatientName.trim();
  const hasPatient =
    searched &&
    Boolean(patient || (patientNotFound && manualPatientName.trim()));

  const inputs: CalorieInputs = useMemo(
    () => ({
      weightKg: num(weightKg) ?? NaN,
      factorCal: num(factorCal) ?? NaN,
      mode,
      ...(mode === "percent"
        ? { pctCho: num(pctCho), pctPro: num(pctPro), pctFat: num(pctFat) }
        : { factorProtein: num(factorProtein), pctFat: num(pctFat) }),
    }),
    [weightKg, factorCal, mode, pctCho, pctPro, pctFat, factorProtein],
  );

  const outcome = useMemo(() => calcMacros(inputs), [inputs]);

  const foodInputs: FoodLineInput[] = useMemo(
    () =>
      foods.map((f) => {
        const d = foodDrafts[f.key];
        return {
          key: f.key,
          portions: num(d.portions) ?? 0,
          ...(f.manual && {
            manualCho: num(d.manualCho),
            manualPro: num(d.manualPro),
            manualFat: num(d.manualFat),
            manualKcal: num(d.manualKcal),
          }),
        };
      }),
    [foods, foodDrafts],
  );
  const foodPlan = useMemo(
    () => calcFoodPlan(foodInputs, foods),
    [foodInputs, foods],
  );

  function updateFood(key: string, field: keyof FoodDraft, value: string) {
    setFoodDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }
  const w = num(weightKg);
  const fc = num(factorCal);
  const totalEnergy =
    w && fc && w > 0 && fc > 0 ? calcTotalEnergy(w, fc) : null;

  // ค่าที่คำนวณได้ระหว่างกรอก (แสดงเป็นตัวช่วยใต้ช่อง)
  const pctSum = (num(pctCho) ?? 0) + (num(pctPro) ?? 0) + (num(pctFat) ?? 0);
  const pctAllFilled = [pctCho, pctPro, pctFat].every((v) => v.trim() !== "");
  const derivedPro =
    mode === "protein" && totalEnergy && num(factorProtein)
      ? ((num(factorProtein)! * w! * 4) / totalEnergy) * 100
      : null;
  const derivedCho =
    derivedPro !== null && num(pctFat) !== undefined
      ? 100 - derivedPro - num(pctFat)!
      : null;

  async function handleSave() {
    setSubmitError(null);
    if (!hasPatient) {
      setSubmitError("กรุณาระบุ HN และข้อมูลผู้ป่วยก่อน");
      return;
    }
    if (!hasPatient) {
      setSubmitError("กรุณาระบุ HN และข้อมูลผู้ป่วยก่อน");
      return;
    }
    if (!performedBy) {
      setSubmitError("กรุณาเลือกผู้คำนวณ (Dietitian)");
      return;
    }
    if (!outcome.ok) {
      setSubmitError(outcome.error);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/calorie/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hn: hn.trim(),
          patientNameSnapshot: patientName,
          note: note || null,
          inputs,
          foods: foodInputs,
          performedBy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      router.push(`/menu2/${data.calculation.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* ---------- ผู้ป่วย ---------- */}
      <Card>
        <StepHeader
          step={1}
          title="ผู้ป่วย"
          subtitle="ค้นหาด้วย HN เพื่อบันทึกผลการคำนวณเข้าประวัติ"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleLookup();
          }}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div className="w-full sm:w-56">
            <Field label="HN" htmlFor="calc-hn" required>
              <Input
                id="calc-hn"
                value={hn}
                onChange={(e) => setHn(e.target.value)}
                placeholder="เช่น 1234567"
                inputMode="numeric"
                autoComplete="off"
                autoFocus={!hn}
              />
            </Field>
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={lookupLoading || !hn.trim()}
          >
            {lookupLoading ? <SpinnerIcon /> : <SearchIcon />}
            {lookupLoading ? "กำลังค้นหา..." : "ค้นหา"}
          </Button>
        </form>

        {lookupError && (
          <p
            role="alert"
            className="mt-3 flex items-center gap-2 text-sm text-red-600"
          >
            <AlertIcon className="h-4 w-4 shrink-0" />
            {lookupError}
          </p>
        )}

        {patient && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border-l-4 border-amber-500 bg-amber-50/60 px-4 py-3">
            <div>
              <p className="text-xs text-zinc-500">ชื่อผู้ป่วย</p>
              <p className="font-semibold text-zinc-900">{patient.fullName}</p>
            </div>
            <Meta label="HN" value={patient.hn} />
            <Meta label="เพศ" value={genderLabel(patient.gender)} />
            <Meta label="อายุ" value={formatAge(patient.dateOfBirth)} />
            {latestSga && (
              <Meta
                label="SGA ล่าสุด"
                value={`${latestSga.sgaResult} · ${latestSga.weightKg} กก. (${formatThaiDateFromDateTime(latestSga.assessedAt)})`}
              />
            )}
          </div>
        )}

        {patientNotFound && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              ไม่พบข้อมูล HN นี้ใน HIS (mock) —
              กรอกชื่อผู้ป่วยด้วยตนเองเพื่อดำเนินการต่อ
            </p>
            <div className="sm:max-w-sm">
              <Field label="ชื่อผู้ป่วย" htmlFor="calc-manual-name" required>
                <Input
                  id="calc-manual-name"
                  value={manualPatientName}
                  onChange={(e) => setManualPatientName(e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {/* ---------- ตาราง 1 ---------- */}
          <Card>
            <StepHeader
              step={2}
              title="พลังงานรวมต่อวัน"
              subtitle="ตาราง 1 · Total Energy = น้ำหนัก × factor cal"
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="น้ำหนักตัว"
                suffix="กก."
                htmlFor="calc-weight"
                required
                hint={
                  latestSga
                    ? "เติมจากแบบประเมิน SGA ล่าสุด แก้ไขได้"
                    : undefined
                }
              >
                <UnitInput
                  id="calc-weight"
                  unit="กก."
                  value={weightKg}
                  onChange={setWeightKg}
                  step="0.1"
                  describedBy={latestSga ? "calc-weight-hint" : undefined}
                />
              </Field>
              <Field
                label="Factor cal"
                suffix="kcal/กก./วัน"
                htmlFor="calc-factor-cal"
                required
              >
                <UnitInput
                  id="calc-factor-cal"
                  unit="kcal/กก."
                  value={factorCal}
                  onChange={setFactorCal}
                  step="0.1"
                />
              </Field>
            </div>
            <div
              className="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-zinc-50 px-4 py-3"
              aria-live="polite"
            >
              <span className="text-sm text-zinc-600">
                {totalEnergy !== null ? (
                  <>
                    <span className="tabular-nums">{w}</span> กก. ×{" "}
                    <span className="tabular-nums">{fc}</span> kcal/กก.
                  </>
                ) : (
                  "กรอกน้ำหนักและ factor cal"
                )}
              </span>
              <span className="text-lg font-semibold tabular-nums text-zinc-900">
                {totalEnergy !== null
                  ? `${round(totalEnergy, 0).toLocaleString("th-TH")} kcal`
                  : "—"}
              </span>
            </div>
          </Card>

          {/* ---------- ตาราง 2 ---------- */}
          <Card>
            <StepHeader
              step={3}
              title="สัดส่วนสารอาหาร"
              subtitle="ตาราง 2 · เลือกวิธีคำนวณ"
            />

            <fieldset className="mt-4">
              <legend className="sr-only">วิธีคำนวณสัดส่วนสารอาหาร</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <ModeOption
                  value="percent"
                  current={mode}
                  onSelect={setMode}
                  title="คำนวณตามเปอร์เซ็นต์"
                  description="กรอก %CHO, %PRO, %FAT เอง (รวม 100%)"
                />
                <ModeOption
                  value="protein"
                  current={mode}
                  onSelect={setMode}
                  title="คำนวณตามโปรตีน"
                  description="กรอก factor protein และ %FAT — %CHO คำนวณให้"
                />
              </div>
            </fieldset>

            {mode === "percent" ? (
              <div className="mt-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="%CHO" htmlFor="calc-pct-cho" required>
                    <UnitInput
                      id="calc-pct-cho"
                      unit="%"
                      value={pctCho}
                      onChange={setPctCho}
                      step="0.1"
                    />
                  </Field>
                  <Field label="%PRO" htmlFor="calc-pct-pro" required>
                    <UnitInput
                      id="calc-pct-pro"
                      unit="%"
                      value={pctPro}
                      onChange={setPctPro}
                      step="0.1"
                    />
                  </Field>
                  <Field label="%FAT" htmlFor="calc-pct-fat" required>
                    <UnitInput
                      id="calc-pct-fat"
                      unit="%"
                      value={pctFat}
                      onChange={setPctFat}
                      step="0.1"
                    />
                  </Field>
                </div>
                <p
                  aria-live="polite"
                  className={`mt-3 flex items-center gap-2 text-sm ${
                    !pctAllFilled
                      ? "text-zinc-500"
                      : Math.abs(pctSum - 100) <= 0.01
                        ? "text-green-700"
                        : "text-red-600"
                  }`}
                >
                  {pctAllFilled && Math.abs(pctSum - 100) <= 0.01 ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : pctAllFilled ? (
                    <AlertIcon className="h-4 w-4" />
                  ) : null}
                  รวม{" "}
                  <span className="font-semibold tabular-nums">
                    {round(pctSum, 1)}%
                  </span>
                  {pctAllFilled &&
                    Math.abs(pctSum - 100) > 0.01 &&
                    " — ต้องรวมได้ 100%"}
                </p>
              </div>
            ) : (
              <div className="mt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Factor protein"
                    suffix="ก./กก./วัน"
                    htmlFor="calc-factor-pro"
                    required
                  >
                    <UnitInput
                      id="calc-factor-pro"
                      unit="ก./กก."
                      value={factorProtein}
                      onChange={setFactorProtein}
                      step="0.1"
                    />
                  </Field>
                  <Field label="%FAT" htmlFor="calc-pct-fat-b" required>
                    <UnitInput
                      id="calc-pct-fat-b"
                      unit="%"
                      value={pctFat}
                      onChange={setPctFat}
                      step="0.1"
                    />
                  </Field>
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-3 text-sm"
                  aria-live="polite"
                >
                  <Derived
                    label="%PRO (คำนวณ)"
                    value={
                      derivedPro !== null ? `${round(derivedPro, 1)}%` : "—"
                    }
                    hint={
                      derivedPro !== null && w
                        ? `${round(num(factorProtein)! * w, 1)} ก. × 4 ÷ TE`
                        : "factor protein × น้ำหนัก × 4 ÷ TE"
                    }
                  />
                  <Derived
                    label="%CHO (คำนวณ)"
                    value={
                      derivedCho !== null ? `${round(derivedCho, 1)}%` : "—"
                    }
                    hint="100 − %PRO − %FAT"
                    error={derivedCho !== null && derivedCho < 0}
                  />
                </dl>
              </div>
            )}
          </Card>
        </div>

        {/* ---------- ผลลัพธ์ ---------- */}
        <aside className="lg:sticky lg:top-20" aria-label="ผลการคำนวณ">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
            <h2 className="text-sm font-semibold text-zinc-900">ผลการคำนวณ</h2>
            {outcome.ok ? (
              <div className="mt-3 flex flex-col gap-4">
                <TotalEnergy value={outcome.result.totalEnergy} />
                <MacroBar result={outcome.result} />
                <MacroTable result={outcome.result} />
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                <p className="font-display text-4xl font-semibold text-zinc-300">
                  —
                </p>
                <p className="text-sm text-zinc-500">{outcome.error}</p>
              </div>
            )}

            <div className="mt-5 border-t border-zinc-100 pt-4">
              <Field
                label="ผู้คำนวณ (Dietitian)"
                htmlFor="performed-by"
                required
              >
                <Select
                  id="performed-by"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                >
                  {assessors.map((a) => (
                    <option key={a.id} value={a.fullName}>
                      {a.fullName}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="mt-3">
                <Field label="หมายเหตุ" htmlFor="calc-note">
                  <Textarea
                    id="calc-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Field>
              </div>
              <Button
                type="button"
                onClick={handleSave}
                disabled={submitting || !outcome.ok || !hasPatient}
                className="mt-3 w-full"
              >
                {submitting && <SpinnerIcon />}
                {submitting ? "กำลังบันทึก..." : "บันทึกผลการคำนวณ"}
              </Button>
              {!hasPatient && (
                <p className="mt-2 text-xs text-zinc-500">
                  ค้นหาผู้ป่วยก่อนจึงจะบันทึกได้ (คำนวณดูได้เลย)
                </p>
              )}
              {submitError && (
                <p
                  role="alert"
                  className="mt-2 flex items-start gap-2 text-sm text-red-600"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {submitError}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ---------- ตาราง 3 ---------- */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <StepHeader
            step={4}
            title="สัดส่วนอาหารต่อวัน"
            subtitle="ตาราง 3 · กรอกจำนวนส่วน ระบบคูณ fac ต่อส่วนให้ แล้วเทียบกับเป้าหมายจากตาราง 2"
          />
          <button
            type="button"
            onClick={() => setFoodDrafts(initialFoodDrafts(foods))}
            className="min-h-9 cursor-pointer rounded-md px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            รีเซ็ตเป็น 1 ส่วน
          </button>
        </div>
        <div className="mt-4">
          <FoodPlanTable
            plan={foodPlan}
            target={outcome.ok ? outcome.result : null}
            drafts={foodDrafts}
            onChange={updateFood}
          />
        </div>
        {!outcome.ok && (
          <p className="mt-3 text-xs text-zinc-500">
            กรอกตาราง 1–2 ให้ครบเพื่อเทียบกับเป้าหมาย
          </p>
        )}
      </Card>

      <Card>
        <NutritionFlag
          plan={foodPlan}
          targetKcal={outcome.ok ? outcome.result.totalEnergy : null}
        />
      </Card>
    </div>
  );
}

function StepHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-sm font-semibold text-amber-950">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}

function UnitInput({
  id,
  unit,
  value,
  onChange,
  step,
  describedBy,
}: {
  id: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  describedBy?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy}
        className="w-full pr-16 tabular-nums"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
        {unit}
      </span>
    </div>
  );
}

function ModeOption({
  value,
  current,
  onSelect,
  title,
  description,
}: {
  value: MacroMode;
  current: MacroMode;
  onSelect: (m: MacroMode) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 transition-colors duration-150 hover:border-amber-300 hover:bg-amber-50/50 has-checked:border-amber-500 has-checked:bg-amber-50 has-checked:ring-1 has-checked:ring-amber-500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-amber-600">
      <input
        type="radio"
        name="macro-mode"
        value={value}
        checked={current === value}
        onChange={() => onSelect(value)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-amber-600 focus:outline-none"
      />
      <span>
        <span className="block text-sm font-medium text-zinc-900">{title}</span>
        <span className="block text-xs text-zinc-600">{description}</span>
      </span>
    </label>
  );
}

function Derived({
  label,
  value,
  hint,
  error = false,
}: {
  label: string;
  value: string;
  hint: string;
  error?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 ${error ? "bg-red-50" : "bg-zinc-50"}`}
    >
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd
        className={`text-lg font-semibold tabular-nums ${error ? "text-red-600" : "text-zinc-900"}`}
      >
        {value}
      </dd>
      <dd className="text-xs text-zinc-500">{hint}</dd>
    </div>
  );
}
