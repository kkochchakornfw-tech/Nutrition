import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getAssessmentById, listFullAssessmentsByHn } from "@/lib/sga/store";
import { SGA_RESULT_META } from "@/lib/sga/scoring";
import { buildNafFormData } from "@/lib/sga/nafData";
import { getHISProvider } from "@/lib/his/provider";
import { AuditTrail } from "@/components/AuditTrail";
import { EditIcon } from "@/components/ui/icons";
import { ExportImageButton } from "@/components/sga/ExportImageButton";

const INFO_SOURCE_LABEL: Record<string, string> = {
  patient: "ผู้ป่วย",
  relative: "ญาติ",
  other: "อื่นๆ",
};

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getAssessmentById(Number(id));
  if (!assessment) notFound();

  const meta = SGA_RESULT_META[assessment.sgaResult];
  const patient = await getHISProvider().getPatientByHN(assessment.hn);
  const history = await listFullAssessmentsByHn(assessment.hn);
  const nafData = buildNafFormData(assessment, patient, history);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">
          ผลการประเมิน HN {assessment.hn} · ครั้งที่ {assessment.visitNo}
        </h1>
        <div className="flex items-center gap-4">
          <Link href={`/sga?hn=${assessment.hn}`} className="text-sm font-medium text-blue-600 hover:underline">
            ดูประวัติทั้งหมดของ HN นี้
          </Link>
          <Link
            href={`/sga/${assessment.id}/edit`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <EditIcon className="h-4 w-4" />
            แก้ไข
          </Link>
          <ExportImageButton data={nafData} />
        </div>
      </div>

      <Card className={`border-2 ${meta.badgeClass}`}>
        <p className="text-sm text-zinc-600">คะแนนรวม</p>
        <p className="text-3xl font-bold text-zinc-900">
          {assessment.totalScore} คะแนน · {assessment.sgaResult}
        </p>
        <p className="mt-1 text-sm">
          {meta.label} — {meta.action}
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-700">ข้อมูลหัวฟอร์ม</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Item label="ชื่อผู้ป่วย" value={assessment.patientNameSnapshot} />
          <Item label="วันที่/เวลาประเมิน" value={new Date(assessment.assessedAt).toLocaleString("th-TH")} />
          <Item label="ผู้ประเมิน" value={assessment.assessorName} />
          <Item label="VN/AN" value={assessment.vnAn ?? "-"} />
          <Item label="ศาสนา" value={assessment.religion ?? "-"} />
          <Item label="ข้อมูลจาก" value={assessment.infoSource ? INFO_SOURCE_LABEL[assessment.infoSource] : "-"} />
          <Item label="Diet Order" value={assessment.dietOrder ?? "-"} />
          <Item label="ส่วนสูง" value={`${assessment.heightCm} ซม.`} />
          <Item label="น้ำหนัก" value={`${assessment.weightKg} กก.`} />
          <Item label="BMI" value={String(assessment.bmi)} />
          <Item label="อาการสำคัญ" value={assessment.chiefComplaint ?? "-"} full />
          <Item label="การวินิจฉัยโรค" value={assessment.diagnosisSnapshot ?? "-"} full />
          <Item label="Food Allergy" value={assessment.allergiesSnapshot ?? "-"} full />
        </dl>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-700">รายละเอียดคะแนนแต่ละหมวด</h2>
        <ul className="mt-3 divide-y divide-zinc-100">
          {assessment.answers.map((a, idx) => (
            <li key={idx} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-900">{a.criteriaLabelTh}</p>
                <p className="text-zinc-500">
                  {a.optionLabelTh}
                  {a.customLabel && ` — ${a.customLabel}`}
                </p>
              </div>
              <span className="font-semibold text-zinc-900">{a.scoreSnapshot} คะแนน</span>
            </li>
          ))}
        </ul>
      </Card>

      <AuditTrail kind="sga" recordId={assessment.id} />
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
