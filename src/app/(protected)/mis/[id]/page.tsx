import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getMisAssessmentById } from "@/lib/mis/store";
import { NUTRITION_STATUS_META } from "@/lib/mis/scoring";
import { buildMisFormData } from "@/lib/mis/misData";
import { getHISProvider } from "@/lib/his/provider";
import { AuditTrail } from "@/components/AuditTrail";
import { EditIcon } from "@/components/ui/icons";
import { ExportMisImageButton } from "@/components/mis/ExportMisImageButton";

const ROLE_LABEL: Record<string, string> = {
  dietitian: "นักกำหนดอาหาร",
  nurse: "พยาบาลไตเทียม",
};

export default async function MisAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getMisAssessmentById(Number(id));
  if (!assessment) notFound();

  const meta = NUTRITION_STATUS_META[assessment.nutritionStatus];
  const patient = await getHISProvider().getPatientByHN(assessment.hn);
  const misData = buildMisFormData(assessment, patient);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">
          ผล MIS HN {assessment.hn}
        </h1>
        <div className="flex items-center gap-4">
          <Link href={`/mis?hn=${assessment.hn}`} className="text-sm font-medium text-blue-600 hover:underline">
            ดูประวัติทั้งหมดของ HN นี้
          </Link>
          <Link
            href={`/mis/${assessment.id}/edit`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <EditIcon className="h-4 w-4" />
            แก้ไข
          </Link>
          <ExportMisImageButton data={misData} />
        </div>
      </div>

      <Card className={`border-2 ${meta.badgeClass}`}>
        <p className="text-sm text-zinc-600">คะแนนรวม</p>
        <p className="text-3xl font-bold text-zinc-900">
          {assessment.totalScore} คะแนน
        </p>
        <p className="mt-1 text-sm">{meta.label}</p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-700">ข้อมูลหัวฟอร์ม</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Item label="ชื่อผู้ป่วย" value={assessment.patientNameSnapshot} />
          <Item label="วันที่/เวลาประเมิน" value={new Date(assessment.assessedAt).toLocaleString("th-TH")} />
          <Item label="ผู้ประเมิน" value={`${assessment.assessorName} (${ROLE_LABEL[assessment.assessorRole]})`} />
          <Item label="VN/AN" value={assessment.vnAn ?? "-"} />
          <Item label="Serum creatinine" value={assessment.serumCreatinine != null ? `${assessment.serumCreatinine} mg/dL` : "-"} />
          <Item label="BUN" value={assessment.bun != null ? `${assessment.bun} mg/dL` : "-"} />
          <Item label="Serum albumin" value={assessment.serumAlbumin != null ? `${assessment.serumAlbumin} g/dl` : "-"} />
          <Item label="Serum TIBC" value={assessment.serumTibc != null ? `${assessment.serumTibc} ug/dL` : "-"} />
          <Item label="ส่วนสูง" value={assessment.heightCm != null ? `${assessment.heightCm} ซม.` : "-"} />
          <Item label="Dry Weight" value={assessment.dryWeightKg != null ? `${assessment.dryWeightKg} กก.` : "-"} />
          <Item label="IBW" value={assessment.ibwKg != null ? `${assessment.ibwKg} กก.` : "-"} />
          <Item label="BMI" value={assessment.bmi != null ? String(assessment.bmi) : "-"} />
          <Item label="เส้นรอบเอว" value={assessment.waistCm != null ? `${assessment.waistCm} นิ้ว` : "-"} />
          <Item label="เส้นรอบวงแขน" value={assessment.armCm != null ? `${assessment.armCm} ซม.` : "-"} />
          <Item label="เส้นรอบวงขา" value={assessment.legCm != null ? `${assessment.legCm} ซม.` : "-"} />
          <Item label="โรคประจำตัวร่วม" value={assessment.comorbidityText ?? "-"} full />
          <Item label="Allergies" value={assessment.allergiesSnapshot ?? "-"} full />
        </dl>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-700">รายละเอียดคะแนนแต่ละหมวด</h2>
        <ul className="mt-3 divide-y divide-zinc-100">
          {assessment.answers.map((a, idx) => (
            <li key={idx} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-900">{a.criteriaLabelEn}</p>
                <p className="text-zinc-500">{a.optionLabelEn}</p>
              </div>
              <span className="font-semibold text-zinc-900">{a.score} คะแนน</span>
            </li>
          ))}
        </ul>
      </Card>

      <AuditTrail kind="mis" recordId={assessment.id} />
    </div>
  );
}

function Item({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-full" : undefined}>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-900">{value}</dd>
    </div>
  );
}
