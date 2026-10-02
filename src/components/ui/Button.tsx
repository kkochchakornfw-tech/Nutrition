import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variantClass: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
  secondary: "bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 origin-center scale-100 transform-gpu cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:enabled:-translate-y-px active:enabled:translate-y-0 active:enabled:scale-[0.965] active:enabled:duration-100 active:enabled:[transition-timing-function:cubic-bezier(0.4,0,1,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:hover:translate-y-0 motion-reduce:transition-colors motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 ${variantClass[variant]} ${className}`}
    />
  );
}
