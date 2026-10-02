import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  required,
  children,
  hint,
  error,
  suffix,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  /** แสดงใต้ช่อง — ถ้าใส่ htmlFor ให้ผูก aria-describedby={`${htmlFor}-error`} ที่ input ด้วย */
  error?: string | null;
  /** หน่วยท้ายชื่อช่อง เช่น "ซม." */
  suffix?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">
        {label}
        {suffix && <span className="font-normal text-zinc-500"> ({suffix})</span>}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            {" "}*
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs font-medium text-red-600">
          {error}
        </span>
      ) : (
        hint && (
          <span id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs text-zinc-500">
            {hint}
          </span>
        )
      )}
    </label>
  );
}

const baseInputClass =
  "min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/25";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseInputClass} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseInputClass} cursor-pointer ${props.className ?? ""}`} />;
}
