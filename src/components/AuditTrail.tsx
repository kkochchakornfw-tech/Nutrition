import { Card } from "@/components/ui/Card";
import { listAuditForRecord, type AuditKind } from "@/lib/audit";

const fmt = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

/** ประวัติการแก้ไขของรายการนี้ — ใครแก้ เมื่อไหร่ แก้ช่องไหนจากอะไรเป็นอะไร */
export async function AuditTrail({ kind, recordId }: { kind: AuditKind; recordId: number }) {
  const entries = await listAuditForRecord(kind, recordId);
  if (entries.length === 0) return null;

  return (
    <Card>
      <h2 className="text-sm font-semibold text-zinc-700">ประวัติการแก้ไข</h2>
      <ol className="mt-3 flex flex-col gap-4">
        {entries.map((e) => (
          <li key={e.id} className="text-sm">
            <p className="font-medium text-zinc-900">
              {e.userName}
              <span className="font-normal text-zinc-500"> · {fmt.format(new Date(e.at))} น.</span>
            </p>
            <ul className="mt-1 flex flex-col gap-0.5 text-zinc-700">
              {e.changes.map((c, i) => (
                <li key={i}>
                  <span className="text-zinc-500">{c.label}:</span>{" "}
                  <span className="text-red-700 line-through decoration-red-300">{c.from}</span>
                  {" → "}
                  <span className="font-medium text-emerald-700">{c.to}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  );
}
