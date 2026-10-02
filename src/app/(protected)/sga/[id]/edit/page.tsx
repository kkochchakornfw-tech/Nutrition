import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AssessmentForm } from "@/components/sga/AssessmentForm";
import { getAssessmentById } from "@/lib/sga/store";

export default async function EditAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getAssessmentById(Number(id));
  if (!assessment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900">
        แก้ไขการประเมิน SGA HN {assessment.hn} · ครั้งที่ {assessment.visitNo}
      </h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <AssessmentForm initial={assessment} />
      </Suspense>
    </div>
  );
}
