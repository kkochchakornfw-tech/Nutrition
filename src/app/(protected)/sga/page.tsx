import { Suspense } from "react";
import { SgaSearch } from "@/components/sga/SgaSearch";
import { SgaHeroBanner } from "@/components/sga/SgaHeroBanner";

export default function SgaPage() {
  return (
    <div className="flex flex-col gap-6">
      <SgaHeroBanner />
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <SgaSearch />
      </Suspense>
    </div>
  );
}
