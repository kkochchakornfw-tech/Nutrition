import { Suspense } from "react";
import { MisAssessmentForm } from "@/components/mis/MisAssessmentForm";

export default function NewMisAssessmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900">ประเมินภาวะโภชนาการผู้ป่วยไตเทียมใหม่</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <MisAssessmentForm />
      </Suspense>
    </div>
  );
}
