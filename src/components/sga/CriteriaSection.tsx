"use client";

import type { SgaCriteria, SgaCriteriaOption } from "@/lib/sga/types";
import { Field, Input } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";

export interface CriteriaAnswerState {
  optionIds: number[];
  customLabels: Record<number, string>;
  notApplicable: boolean;
}

export function emptyAnswerState(): CriteriaAnswerState {
  return {
    optionIds: [],
    customLabels: {},
    notApplicable: false,
  };
}

export function scoreForCriteria(
  criteria: SgaCriteria,
  state: CriteriaAnswerState | undefined,
): number {
  if (!state || state.notApplicable) return 0;
  return state.optionIds.reduce((sum, optionId) => {
    const option = criteria.options.find((o) => o.id === optionId);
    return option ? sum + option.score : sum;
  }, 0);
}

export function CriteriaSection({
  criteria,
  state,
  onChange,
  id,
  index,
  highlighted = false,
}: {
  criteria: SgaCriteria;
  /** ลำดับหัวข้อ (เริ่มที่ 1) แสดงในวงกลมหน้าชื่อหัวข้อ */
  index: number;
  state: CriteriaAnswerState;
  onChange: (next: CriteriaAnswerState) => void;
  id?: string;
  highlighted?: boolean;
}) {
  const inputType = criteria.allowMultiple ? "checkbox" : "radio";

  function toggleOption(optionId: number, checked: boolean) {
    if (criteria.allowMultiple) {
      const optionIds = checked
        ? [...state.optionIds, optionId]
        : state.optionIds.filter((id) => id !== optionId);
      onChange({ ...state, optionIds, notApplicable: false });
    } else {
      onChange({
        ...state,
        optionIds: checked ? [optionId] : [],
        notApplicable: false,
      });
    }
  }

  function toggleNotApplicable(checked: boolean) {
    onChange({ ...emptyAnswerState(), notApplicable: checked });
  }

  function setCustomLabel(optionId: number, value: string) {
    onChange({
      ...state,
      customLabels: { ...state.customLabels, [optionId]: value },
    });
  }

  const sectionScore = scoreForCriteria(criteria, state);
  const answered = state.optionIds.length > 0 || state.notApplicable;
  const isDisease = criteria.criteriaKey === "disease";

  return (
    <fieldset
      id={id}
      className={`scroll-mt-24 rounded-xl border p-4 transition-[background-color,border-color,box-shadow] duration-300 sm:p-5 ${
        highlighted
          ? "border-amber-400 bg-amber-50 ring-2 ring-amber-400"
          : answered
            ? "border-zinc-200 bg-white"
            : "border-zinc-200 bg-zinc-50/60"
      }`}
    >
      {/* float+w-full ให้ legend จัด layout แบบ block ปกติ */}
      <legend className="float-left mb-3 flex w-full flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
            answered
              ? "bg-green-600 text-white"
              : "border border-zinc-300 bg-white text-zinc-600"
          }`}
        >
          {answered ? <CheckIcon className="h-4 w-4" /> : index}
          <span className="sr-only">
            {answered ? " (ตอบแล้ว)" : " (ยังไม่ตอบ)"}
          </span>
        </span>
        <span className="text-[15px] font-semibold text-zinc-900">
          {criteria.labelTh}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {criteria.allowMultiple
            ? "เลือกได้หลายข้อ · ไม่บังคับ"
            : "เลือก 1 ข้อ"}
        </span>
        <span className="ml-auto text-xs text-zinc-500">
          คะแนนหมวดนี้{" "}
          <span className="text-sm font-semibold tabular-nums text-zinc-900">
            {sectionScore}
          </span>
        </span>
      </legend>
      {isDisease ? (
        <div className="clear-both flex flex-col gap-4">
          <DiseaseGroup
            label="กลุ่มคะแนน 3"
            options={criteria.options.filter((o) => o.score < 6)}
            state={state}
            onToggle={toggleOption}
            onCustomLabelChange={setCustomLabel}
          />
          <DiseaseGroup
            label="กลุ่มคะแนน 6"
            options={criteria.options.filter((o) => o.score >= 6)}
            state={state}
            onToggle={toggleOption}
            onCustomLabelChange={setCustomLabel}
          />
        </div>
      ) : (
        <div className="clear-both grid gap-2 sm:grid-cols-2">
          {criteria.options.map((option) => {
            const checked = state.optionIds.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50/50 has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-950 has-checked:ring-1 has-checked:ring-blue-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600"
              >
                <input
                  type={inputType}
                  name={`criteria-${criteria.id}`}
                  checked={checked}
                  onChange={(e) => toggleOption(option.id, e.target.checked)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600 focus:outline-none"
                />
                <span className="flex-1">{option.labelTh}</span>
                <ScorePill score={option.score} />
              </label>
            );
          })}
        </div>
      )}
      <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50/50 has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-950 has-checked:ring-1 has-checked:ring-blue-600">
        <input
          type="checkbox"
          checked={state.notApplicable}
          onChange={(e) => toggleNotApplicable(e.target.checked)}
          className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600 focus:outline-none"
        />
        <span className="flex-1">N/A (ประเมินไม่ได้ / ไม่เกี่ยวข้อง)</span>
        <span className="shrink-0 text-xs text-zinc-500">0 คะแนน</span>
      </label>
    </fieldset>
  );
}

/** หมวดโรคที่เป็นอยู่ แบ่งเป็นกลุ่มคะแนน 3 / 6 ตามกระดาษจริง — ช่องกรอก "อื่นๆ" อยู่ใต้กลุ่มคะแนนของตัวเอง คะแนนคงที่ตามกลุ่ม แก้ไขเองไม่ได้ */
function DiseaseGroup({
  label,
  options,
  state,
  onToggle,
  onCustomLabelChange,
}: {
  label: string;
  options: SgaCriteriaOption[];
  state: CriteriaAnswerState;
  onToggle: (optionId: number, checked: boolean) => void;
  onCustomLabelChange: (optionId: number, value: string) => void;
}) {
  const otherOptions = options.filter(
    (o) => o.isOther && state.optionIds.includes(o.id),
  );
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = state.optionIds.includes(option.id);
          return (
            <label
              key={option.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50/50 has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-950 has-checked:ring-1 has-checked:ring-blue-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(option.id, e.target.checked)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600 focus:outline-none"
              />
              <span className="flex-1">{option.labelTh}</span>
              {option.isOther ? (
                <span className="shrink-0 text-xs text-zinc-500">
                  พิมพ์ชื่อโรค
                </span>
              ) : (
                <ScorePill score={option.score} />
              )}
            </label>
          );
        })}
      </div>
      {otherOptions.map((option) => (
        <div
          key={option.id}
          className="mt-2 flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50/60 p-3 sm:flex-row sm:items-end sm:gap-3"
        >
          <div className="flex-1">
            <Field label="ชื่อโรค" htmlFor={`other-label-${option.id}`} required>
              <Input
                id={`other-label-${option.id}`}
                placeholder="เช่น SLE"
                value={state.customLabels[option.id] ?? ""}
                onChange={(e) => onCustomLabelChange(option.id, e.target.value)}
                required
              />
            </Field>
          </div>
          <ScorePill score={option.score} />
        </div>
      ))}
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 2
      ? "bg-red-50 text-red-700 ring-red-200"
      : score > 0
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-zinc-100 text-zinc-600 ring-zinc-200";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ring-inset ${tone}`}
    >
      {score > 0 ? `+${score}` : score} คะแนน
    </span>
  );
}
