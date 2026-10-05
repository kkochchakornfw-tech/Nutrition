"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LoginScene } from "@/components/LoginScene";
import { AlertIcon, EyeIcon, EyeOffIcon, IdCardIcon, LockIcon, SpinnerIcon } from "@/components/ui/icons";

export function LoginForm() {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [blinkKey, setBlinkKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  function togglePassword() {
    setShowPassword((v) => !v);
    setBlinkKey((k) => k + 1);
  }

  // รีสตาร์ทแอนิเมชันสั่นด้วยการปิด-เปิดคลาสคนละเฟรม (ไม่ remount ลูก ๆ จึงไม่ทำให้ฟิลด์ fade เข้าซ้ำ)
  function triggerShake() {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeCode, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      setLoading(false);
      triggerShake();
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen bg-zinc-50 lg:grid-cols-2">
      <LoginScene />

      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          {/* หัวข้อสำหรับมือถือ (จอกว้างใช้ LoginScene แทน) */}
          <div className="login-logo-in mb-6 flex items-center gap-3 lg:hidden">
            <Image src="/icons/logo.png" alt="" width={40} height={40} className="h-10 w-10" priority />
            <span className="font-display text-base font-semibold text-zinc-900">ระบบประเมินภาวะโภชนาการ</span>
          </div>

          <div
            onAnimationEnd={() => setShaking(false)}
            className={`login-card-in rounded-2xl bg-white p-7 shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-200 sm:p-8 ${
              shaking ? "login-shake" : ""
            }`}
            style={{ "--card-delay": "260ms" } as React.CSSProperties}
          >
            <div className="login-logo-in hidden lg:flex" style={{ animationDelay: "80ms" }}>
              <Image src="/icons/logo.png" alt="" width={44} height={44} className="mb-4 h-11 w-11" priority />
            </div>
            <h1 className="font-display text-xl font-semibold text-zinc-900">เข้าสู่ระบบ</h1>
            <p className="mt-1 text-sm text-zinc-500">กรอกรหัสพนักงานเพื่อใช้งานระบบประเมินภาวะโภชนาการ</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="login-field-in" style={{ "--field-delay": "560ms" } as React.CSSProperties}>
                <Field label="รหัสพนักงาน" htmlFor="employeeCode" required>
                  <div className="relative">
                    <IdCardIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="employeeCode"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      autoComplete="username"
                      autoFocus
                      required
                      className="pl-9"
                    />
                  </div>
                </Field>
              </div>

              <div className="login-field-in" style={{ "--field-delay": "630ms" } as React.CSSProperties}>
                <Field label="รหัสผ่าน" htmlFor="password" required>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={togglePassword}
                      aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      aria-pressed={showPassword}
                      className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-zinc-400 transition-colors hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600"
                    >
                      <span key={blinkKey} className="login-blink flex items-center justify-center">
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </span>
                    </button>
                  </div>
                </Field>
              </div>

              {error && (
                <p role="alert" className="login-banner-in flex items-center gap-2 text-sm text-red-600">
                  <AlertIcon className="login-icon-wobble h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <div className="login-field-in mt-1" style={{ "--field-delay": "700ms" } as React.CSSProperties}>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <SpinnerIcon />}
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
