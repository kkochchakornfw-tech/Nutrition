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
import { PatientCard } from "./PatientCard";
import {
  CriteriaSection,
  emptyAnswerState,
  scoreForCriteria,
  type CriteriaAnswerState,
} from "./CriteriaSection";
import type { Assessor } from "@/lib/sga/assessors";
import type { PatientInfo } from "@/lib/his/types";
import type { InfoSource, SgaCriteria, SgaResult } from "@/lib/sga/types";
import {
  calcBmi,
  determineSgaResult,
  SGA_RESULT_META,
} from "@/lib/sga/scoring";

function nowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

type FlatAnswer = {
  criteriaId: number;
  optionId?: number;
  notApplicable?: boolean;
  customLabel?: string;
};

export function AssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hn, setHn] = useState(searchParams.get("hn") ?? "");
  const [searched, setSearched] = useState(false);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [patientNotFound, setPatientNotFound] = useState(false);
  const [manualPatientName, setManualPatientName] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [criteria, setCriteria] = useState<SgaCriteria[]>([]);
  const [assessors, setAssessors] = useState<Assessor[]>([]);

  // ลำดับครั้งที่ประเมินโดยรวม (1, 2, 3, 4, ...) — กระดาษจริงมี 3 คอลัมน์ต่อแผ่น
  // แผ่นที่ = ceil(visitNo / 3), ครั้งที่ในแผ่นนั้น = ((visitNo - 1) % 3) + 1
  const [visitNo, setVisitNo] = useState(1);
  const sheetNo = Math.floor((visitNo - 1) / 3) + 1;
  const positionInSheet = ((visitNo - 1) % 3) + 1;
  function setSheetNo(nextSheet: number) {
    setVisitNo((Math.max(1, nextSheet) - 1) * 3 + positionInSheet);
  }
  function setPositionInSheet(nextPosition: number) {
    setVisitNo((sheetNo - 1) * 3 + nextPosition);
  }
  const [assessedAt, setAssessedAt] = useState(nowForInput());
  const [assessorName, setAssessorName] = useState("");
  const [vnAn, setVnAn] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [dietOrder, setDietOrder] = useState("");
  const [religion, setReligion] = useState("");
  const [infoSource, setInfoSource] = useState<InfoSource>("patient");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [diagnosisSnapshot, setDiagnosisSnapshot] = useState("");
  const [allergiesSnapshot, setAllergiesSnapshot] = useState("");

  const [answers, setAnswers] = useState<Record<number, CriteriaAnswerState>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // กดบันทึกไปแล้วอย่างน้อยครั้งหนึ่ง — ใช้แสดง error ใต้ช่องบังคับ
  const [attempted, setAttempted] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // จำนวนหัวข้อที่ยังไม่ตอบ ณ ตอนที่ผู้ใช้กดบันทึกแล้วถูกเตือน — กดซ้ำโดยไม่เปลี่ยนจำนวน = ยืนยันบันทึกทั้งที่ไม่ครบ
  const [ackedMissingCount, setAckedMissingCount] = useState<number | null>(
    null,
  );
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, []);

  useEffect(() => {
    fetch("/api/sga/criteria")
      .then((res) => res.json())
      .then((data) => {
        setCriteria(data.criteria);
        setAssessors(data.assessors);
        if (data.assessors[0]) setAssessorName(data.assessors[0].fullName);
      });
  }, []);

  useEffect(() => {
    const initialHn = searchParams.get("hn");
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
      if (!data.patient)
        throw new Error("รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง");
      setPatient(data.patient);
      setDiagnosisSnapshot(data.patient.diagnosisText ?? "");
      setAllergiesSnapshot(data.patient.foodAllergiesText ?? "");
      setReligion(data.patient.religion ?? "");
      setChiefComplaint(data.patient.chiefComplaint ?? "");
      setVnAn(data.patient.vnAn ?? "");
      setSearched(true);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "ค้นหาผู้ป่วยไม่สำเร็จ",
      );
    } finally {
      setLookupLoading(false);
    }
  }

  const bmi = useMemo(() => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w) return null;
    return calcBmi(h, w);
  }, [heightCm, weightKg]);

  const totalScore = useMemo(
    () =>
      criteria.reduce((sum, c) => sum + scoreForCriteria(c, answers[c.id]), 0),
    [criteria, answers],
  );
  const previewResult = determineSgaResult(totalScore);

  function updateCriteriaAnswer(criteriaId: number, next: CriteriaAnswerState) {
    setAnswers((prev) => ({ ...prev, [criteriaId]: next }));
  }

  const patientName = patient?.fullName ?? manualPatientName;
  const canFillRest =
    searched && (patient || (patientNotFound && manualPatientName.trim()));

  // หัวข้อที่ยังไม่ได้ตอบ (เรียงตามลำดับในฟอร์ม) — โรคที่เป็นอยู่เว้นได้จึงแยกเป็น optional
  const missingItems = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    if (!assessedAt)
      items.push({ id: "sec-assessed-at", label: "วันที่/เวลาประเมิน" });
    if (!assessorName)
      items.push({ id: "sec-assessor", label: "ผู้ประเมิน (Dietitian)" });
    if (!heightCm) items.push({ id: "sec-height", label: "ส่วนสูง" });
    if (!weightKg) items.push({ id: "sec-weight", label: "น้ำหนักปัจจุบัน" });
    criteria.forEach((c, index) => {
      const a = answers[c.id];
      if (
        !c.allowMultiple &&
        !a?.notApplicable &&
        !(a?.optionIds.length ?? 0)
      ) {
        items.push({
          id: `sec-criteria-${c.id}`,
          label: `${index + 1}. ${c.labelTh}`,
        });
      }
    });
    return items;
  }, [assessedAt, assessorName, heightCm, weightKg, criteria, answers]);

  const requiredTotal = 4 + criteria.filter((c) => !c.allowMultiple).length;
  const answeredCount = requiredTotal - missingItems.length;

  // จัดกลุ่มหัวข้อตาม section โดยคงลำดับเดิม (index นับต่อเนื่องทั้งฟอร์ม)
  const criteriaGroups = useMemo(() => {
    const groups: {
      section: string;
      items: { c: SgaCriteria; index: number }[];
    }[] = [];
    criteria.forEach((c, i) => {
      const last = groups[groups.length - 1];
      if (last && last.section === c.section)
        last.items.push({ c, index: i + 1 });
      else groups.push({ section: c.section, items: [{ c, index: i + 1 }] });
    });
    return groups;
  }, [criteria]);

  const optionalItems = useMemo(
    () =>
      criteria
        .filter(
          (c) =>
            c.allowMultiple &&
            !answers[c.id]?.notApplicable &&
            !(answers[c.id]?.optionIds.length ?? 0),
        )
        .map((c) => ({ id: `sec-criteria-${c.id}`, label: c.labelTh })),
    [criteria, answers],
  );

  function focusSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
    el.querySelector<HTMLElement>("input, select, textarea")?.focus({
      preventScroll: true,
    });
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
    setAttempted(true);

    if (!canFillRest) {
      setSubmitError("กรุณาระบุ HN และข้อมูลผู้ป่วยก่อน");
      return;
    }
    if (!heightCm || !weightKg) {
      setSubmitError("กรุณากรอกส่วนสูงและน้ำหนัก");
      focusSection(!heightCm ? "sec-height" : "sec-weight");
      return;
    }
    if (missingItems.length > 0 && ackedMissingCount !== missingItems.length) {
      setAckedMissingCount(missingItems.length);
      setSubmitError(
        `ยังตอบไม่ครบ ${missingItems.length} หัวข้อ (คะแนนรวมอาจต่ำกว่าจริง) — กดบันทึกอีกครั้งหากต้องการบันทึกทั้งที่ยังไม่ครบ`,
      );
      focusSection(missingItems[0].id);
      return;
    }

    const flatAnswers = criteria.flatMap<FlatAnswer>((c) => {
      const state = answers[c.id];
      if (!state) return [];
      if (state.notApplicable)
        return [{ criteriaId: c.id, notApplicable: true }]; // ← ต้องมีบรรทัดนี้
      return state.optionIds.map((optionId) => {
        const option = c.options.find((o) => o.id === optionId)!;
        return {
          criteriaId: c.id,
          optionId,
          customLabel: option.isOther
            ? state.customLabels[optionId]
            : undefined,
        };
      });
    });

    if (flatAnswers.length === 0) {
      setSubmitError("กรุณาเลือกคำตอบอย่างน้อย 1 หมวด");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sga/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hn: hn.trim(),
          vnAn: vnAn || null,
          visitNo,
          assessedAt: new Date(assessedAt).toISOString(),
          assessorName,
          chiefComplaint: chiefComplaint || null,
          dietOrder: dietOrder || null,
          religion: religion || null,
          infoSource: infoSource || null,
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          patientNameSnapshot: patientName,
          diagnosisSnapshot: diagnosisSnapshot || null,
          allergiesSnapshot: allergiesSnapshot || null,
          answers: flatAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      router.push(`/sga/${data.assessment.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  const heightError = attempted && !heightCm ? "กรุณากรอกส่วนสูง" : null;
  const weightError = attempted && !weightKg ? "กรุณากรอกน้ำหนัก" : null;

  return (
    <div className="flex flex-col gap-6 pb-16">
      <Card>
        <SectionHeader
          step={1}
          title="ค้นหาข้อมูลผู้ป่วย"
          subtitle="ดึงข้อมูลจาก HIS ด้วยหมายเลข HN"
        />
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
        {patientNotFound && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              ไม่พบข้อมูล HN นี้ใน HIS (mock) —
              กรอกชื่อผู้ป่วยด้วยตนเองเพื่อดำเนินการต่อ
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
          <form
            onSubmit={handleSubmit}
            className="flex min-w-0 flex-col gap-6 lg:order-1"
          >
            <Card>
              <SectionHeader
                step={2}
                title="ข้อมูลหัวฟอร์ม"
                subtitle="ข้อมูลการประเมินและสัดส่วนร่างกาย"
              />

              <SubGroup title="ข้อมูลการประเมิน">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="แผ่นที่"
                    htmlFor="sheet-no"
                    hint="ครบ 3 ครั้งในแผ่นนี้แล้ว กด + เพื่อขึ้นแผ่นใหม่"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSheetNo(sheetNo - 1)}
                        disabled={sheetNo <= 1}
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="แผ่นก่อนหน้า"
                      >
                        −
                      </button>
                      <span
                        id="sheet-no"
                        className="flex-1 text-center text-sm font-semibold tabular-nums text-zinc-900"
                      >
                        แผ่นที่ {sheetNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSheetNo(sheetNo + 1)}
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                        aria-label="เริ่มแผ่นใหม่"
                      >
                        +
                      </button>
                    </div>
                  </Field>
                  <Field label="ครั้งที่ (ในแผ่นนี้)" htmlFor="visit-no" required>
                    <Select
                      id="visit-no"
                      value={positionInSheet}
                      onChange={(e) =>
                        setPositionInSheet(Number(e.target.value))
                      }
                    >
                      <option value={1}>ครั้งที่ 1</option>
                      <option value={2}>ครั้งที่ 2</option>
                      <option value={3}>ครั้งที่ 3</option>
                    </Select>
                  </Field>
                  <div
                    id="sec-assessed-at"
                    className={highlightClass("sec-assessed-at")}
                  >
                    <Field
                      label="วันที่/เวลาประเมิน"
                      htmlFor="assessed-at"
                      required
                    >
                      <Input
                        id="assessed-at"
                        type="datetime-local"
                        value={assessedAt}
                        onChange={(e) => setAssessedAt(e.target.value)}
                      />
                    </Field>
                  </div>
                  <div
                    id="sec-assessor"
                    className={highlightClass("sec-assessor")}
                  >
                    <Field
                      label="ผู้ประเมิน (Dietitian)"
                      htmlFor="assessor"
                      required
                    >
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
                  <Field label="VN/AN" htmlFor="vn-an">
                    <Input
                      id="vn-an"
                      value={vnAn}
                      onChange={(e) => setVnAn(e.target.value)}
                    />
                  </Field>
                  <Field label="ข้อมูลจาก" htmlFor="info-source" required>
                    <Select
                      id="info-source"
                      value={infoSource}
                      onChange={(e) =>
                        setInfoSource(e.target.value as InfoSource)
                      }
                    >
                      <option value="patient">ผู้ป่วย</option>
                      <option value="relative">ญาติ</option>
                      <option value="other">อื่นๆ</option>
                    </Select>
                  </Field>
                  <Field label="ศาสนา" htmlFor="religion">
                    <Input
                      id="religion"
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                    />
                  </Field>
                  <Field label="Diet Order" htmlFor="diet-order">
                    <Input
                      id="diet-order"
                      value={dietOrder}
                      onChange={(e) => setDietOrder(e.target.value)}
                    />
                  </Field>
                </div>
              </SubGroup>

              <SubGroup title="สัดส่วนร่างกาย">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div id="sec-height" className={highlightClass("sec-height")}>
                    <Field
                      label="ส่วนสูง"
                      suffix="ซม."
                      htmlFor="height"
                      required
                      error={heightError}
                    >
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        min="0"
                        inputMode="decimal"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        aria-invalid={heightError ? true : undefined}
                        aria-describedby={
                          heightError ? "height-error" : undefined
                        }
                      />
                    </Field>
                  </div>
                  <div id="sec-weight" className={highlightClass("sec-weight")}>
                    <Field
                      label="น้ำหนักปัจจุบัน"
                      suffix="กก."
                      htmlFor="weight"
                      required
                      error={weightError}
                    >
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        inputMode="decimal"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        aria-invalid={weightError ? true : undefined}
                        aria-describedby={
                          weightError ? "weight-error" : undefined
                        }
                      />
                    </Field>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-zinc-700">
                      BMI{" "}
                      <span className="font-normal text-zinc-500">
                        (คำนวณอัตโนมัติ)
                      </span>
                    </span>
                    <output
                      htmlFor="height weight"
                      aria-live="polite"
                      className="flex min-h-10 items-baseline gap-1.5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2"
                    >
                      {bmi !== null ? (
                        <>
                          <span className="text-base font-semibold tabular-nums text-zinc-900">
                            {bmi}
                          </span>
                          <span className="text-xs text-zinc-500">kg/m²</span>
                        </>
                      ) : (
                        <span className="text-zinc-400">
                          กรอกส่วนสูง/น้ำหนักก่อน
                        </span>
                      )}
                    </output>
                  </div>
                </div>
              </SubGroup>

              <SubGroup title="ข้อมูลทางคลินิก">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="อาการสำคัญที่มาโรงพยาบาล"
                    htmlFor="chief-complaint"
                  >
                    <Textarea
                      id="chief-complaint"
                      rows={2}
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="ไม่พบข้อมูลจาก HIS กรุณากรอก"
                    />
                  </Field>
                  <Field label="การวินิจฉัยโรค" htmlFor="diagnosis">
                    <Textarea
                      id="diagnosis"
                      rows={2}
                      value={diagnosisSnapshot}
                      onChange={(e) => setDiagnosisSnapshot(e.target.value)}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Food Allergy" htmlFor="allergies">
                      <Textarea
                        id="allergies"
                        rows={2}
                        value={allergiesSnapshot}
                        onChange={(e) => setAllergiesSnapshot(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </SubGroup>
            </Card>

            <Card>
              <SectionHeader
                step={3}
                title="ตารางให้คะแนน SGA"
                subtitle="เลือกคำตอบที่ตรงกับผู้ป่วยมากที่สุดในแต่ละหัวข้อ"
              />
              <div className="mt-5 flex flex-col gap-8">
                {criteriaGroups.map((group, gi) => (
                  <section
                    key={group.section}
                    aria-labelledby={`criteria-group-${gi}`}
                  >
                    <h3
                      id={`criteria-group-${gi}`}
                      className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    >
                      {group.section}
                      <span
                        className="h-px flex-1 bg-zinc-200"
                        aria-hidden="true"
                      />
                    </h3>
                    <div className="flex flex-col gap-3">
                      {group.items.map(({ c, index }) => (
                        <CriteriaSection
                          key={c.id}
                          id={`sec-criteria-${c.id}`}
                          index={index}
                          highlighted={highlightId === `sec-criteria-${c.id}`}
                          criteria={c}
                          state={answers[c.id] ?? emptyAnswerState()}
                          onChange={(next) => updateCriteriaAnswer(c.id, next)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </Card>

            <div className="sticky bottom-2 z-10 rounded-xl border border-zinc-200 bg-white/95 p-3 sm:bottom-4 sm:p-4 shadow-lg shadow-zinc-900/10 backdrop-blur supports-[backdrop-filter]:bg-white/85">
              <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">คะแนนรวม</p>
                    <p
                      className="text-3xl font-semibold leading-none tabular-nums text-zinc-900"
                      aria-live="polite"
                    >
                      {totalScore}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium ${SGA_RESULT_META[previewResult].badgeClass}`}
                    >
                      <span className="font-bold">{previewResult}</span>
                      <span aria-hidden="true">·</span>
                      {SGA_RESULT_META[previewResult].label}
                    </span>
                    <ResultScale result={previewResult} />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 sm:w-auto"
                >
                  {submitting && <SpinnerIcon />}
                  {submitting ? "กำลังบันทึก..." : "บันทึกผลการประเมิน"}
                </Button>
              </div>
              {submitError && (
                <p
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {submitError}
                </p>
              )}
            </div>
          </form>

          <aside
            className="order-first lg:order-2 lg:sticky lg:top-4"
            aria-label="ความคืบหน้าการกรอก"
          >
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">
                  ความคืบหน้า
                </h2>
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
                  style={{
                    width: `${requiredTotal ? (answeredCount / requiredTotal) * 100 : 0}%`,
                  }}
                />
              </div>

              {missingItems.length > 0 ? (
                <>
                  <p className="mt-4 text-xs font-medium text-amber-800">
                    ยังไม่ได้กรอก {missingItems.length} หัวข้อ —
                    กดเพื่อไปยังช่องนั้น
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
              {optionalItems.length > 0 && (
                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <p className="text-xs text-zinc-500">
                    ไม่บังคับ (เว้นได้หากไม่มีโรคในรายการ)
                  </p>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {optionalItems.map((item) => (
                      <li key={item.id}>
                        <JumpButton onClick={() => focusSection(item.id)} muted>
                          <CircleIcon className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                          <span className="flex-1">{item.label}</span>
                        </JumpButton>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
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

function SubGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 border-t border-zinc-100 pt-5 first-of-type:mt-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function JumpButton({
  onClick,
  muted = false,
  children,
}: {
  onClick: () => void;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
        muted ? "text-zinc-500" : "text-zinc-800"
      }`}
    >
      {children}
      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

// แถบช่วงคะแนน A (0–5) / B (6–10) / C (≥11) พร้อมไฮไลต์ช่วงปัจจุบัน
function ResultScale({ result }: { result: SgaResult }) {
  const bands: { key: SgaResult; range: string; on: string }[] = [
    { key: "A", range: "0–5", on: "bg-green-500 text-white" },
    { key: "B", range: "6–10", on: "bg-yellow-400 text-yellow-950" },
    { key: "C", range: "≥11", on: "bg-red-500 text-white" },
  ];
  return (
    <div
      className="hidden gap-0.5 text-[11px] leading-none sm:flex"
      aria-hidden="true"
    >
      {bands.map((b) => (
        <span
          key={b.key}
          className={`rounded px-1.5 py-1 tabular-nums ${
            b.key === result
              ? `${b.on} font-semibold`
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {b.key} {b.range}
        </span>
      ))}
    </div>
  );
}
