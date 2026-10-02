import { Suspense } from "react";
import { AssessmentForm } from "@/components/sga/AssessmentForm";

export default function NewAssessmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900">ประเมินภาวะโภชนาการใหม่</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <AssessmentForm />
      </Suspense>
    </div>
  );
}
