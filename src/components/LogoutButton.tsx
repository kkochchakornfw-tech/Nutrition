"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOutIcon, SpinnerIcon } from "@/components/ui/icons";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`flex cursor-pointer items-center gap-3 text-sm font-medium text-zinc-700 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? <SpinnerIcon className="h-5 w-5" /> : <LogOutIcon className="h-5 w-5" />}
      {loading ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
    </button>
  );
}
