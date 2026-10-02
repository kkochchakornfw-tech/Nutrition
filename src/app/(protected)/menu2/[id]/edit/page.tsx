import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalorieCalculator } from "@/components/calorie/CalorieCalculator";
import { getCalculationById } from "@/lib/calorie/store";

export default async function EditCalculationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const calculation = await getCalculationById(Number(id));
  if (!calculation) notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900">
        แก้ไขการคำนวณแคลอรี่ #{calculation.id} · HN {calculation.hn}
      </h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
        <CalorieCalculator initial={calculation} />
      </Suspense>
    </div>
  );
}
