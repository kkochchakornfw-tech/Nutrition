import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MisAssessmentForm } from "@/components/mis/MisAssessmentForm";
import { getMisAssessmentById } from "@/lib/mis/store";

export default async function EditMisAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getMisAssessmentById(Number(id));
  if (!assessment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900">แก้ไขการประเมิน MIS HN {assessment.hn}</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <MisAssessmentForm initial={assessment} />
      </Suspense>
    </div>
  );
}
