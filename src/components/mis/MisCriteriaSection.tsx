"use client";

import type { MisCriteria } from "@/lib/mis/types";
import { CheckIcon } from "@/components/ui/icons";

export function MisCriteriaSection({
  criteria,
  selectedOptionId,
  onChange,
  id,
  index,
  highlighted = false,
}: {
  criteria: MisCriteria;
  /** ลำดับหัวข้อ (เริ่มที่ 1) แสดงในวงกลมหน้าชื่อหัวข้อ */
  index: number;
  selectedOptionId: number | null;
  onChange: (optionId: number) => void;
  id?: string;
  highlighted?: boolean;
}) {
  const answered = selectedOptionId !== null;

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
      <legend className="float-left mb-3 flex w-full flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
            answered
              ? "bg-green-600 text-white"
              : "border border-zinc-300 bg-white text-zinc-600"
          }`}
        >
          {answered ? <CheckIcon className="h-4 w-4" /> : index}
          <span className="sr-only">{answered ? " (ตอบแล้ว)" : " (ยังไม่ตอบ)"}</span>
        </span>
        <span className="text-[15px] font-semibold text-zinc-900">{criteria.labelEn}</span>
        <span className="ml-auto text-xs text-zinc-500">
          คะแนน{" "}
          <span className="text-sm font-semibold tabular-nums text-zinc-900">
            {selectedOptionId !== null
              ? (criteria.options.find((o) => o.id === selectedOptionId)?.score ?? 0)
              : "-"}
          </span>
        </span>
      </legend>
      <div className="clear-both grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {criteria.options.map((option) => {
          const checked = option.id === selectedOptionId;
          return (
            <label
              key={option.id}
              className="flex min-h-11 cursor-pointer flex-col justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50/50 has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-950 has-checked:ring-1 has-checked:ring-blue-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`mis-criteria-${criteria.id}`}
                  checked={checked}
                  onChange={() => onChange(option.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600 focus:outline-none"
                />
                <span className="flex-1 font-medium tabular-nums text-zinc-500">
                  {option.score}
                </span>
              </span>
              <span className="pl-6">{option.labelEn}</span>
              {option.labelTh && (
                <span className="pl-6 text-xs text-zinc-500">{option.labelTh}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
