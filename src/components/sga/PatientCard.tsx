import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import type { PatientInfo } from "@/lib/his/types";
import { formatAge, formatThaiDate, genderLabel } from "@/lib/format";
import { PatientPhoto } from "@/components/PatientPhoto";

function Item({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-full" : undefined}>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

export function PatientCard({
  patient,
  actions,
}: {
  patient: PatientInfo;
  actions?: ReactNode;
}) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/* รูป + ชื่อ อยู่ติดกัน ชื่ออยู่ขวารูป ชิดขอบล่างของรูป */}
        <div className="flex min-w-0 items-end gap-4">
          <PatientPhoto
            key={patient.hn}
            hn={patient.hn}
            name={patient.fullName}
          />
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">ชื่อผู้ป่วย</p>
            <h3 className="text-lg font-semibold text-zinc-900">
              {patient.fullName}
            </h3>
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <Item
          label="Date of birth"
          value={formatThaiDate(patient.dateOfBirth)}
        />
        <Item label="Age" value={formatAge(patient.dateOfBirth)} />
        <Item label="Gender" value={genderLabel(patient.gender)} />
        <Item label="HN" value={patient.hn} />
        <Item label="VN/AN" value={patient.vnAn ?? "-"} />
        <Item
          label="Visit/Admit date"
          value={formatThaiDate(patient.admitDate)}
        />
        <Item
          label="Allergies"
          value={patient.allergiesText?.trim() || "ไม่ระบุ"}
          wide
        />
      </dl>
    </Card>
  );
}
