import Link from "next/link";
import { ArrowRightIcon, CalculatorIcon, ShieldIcon, UserIcon } from "@/components/ui/icons";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <ShieldIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900 sm:text-3xl">ผู้ดูแลระบบ</h1>
          <p className="text-sm text-zinc-600">จัดการข้อมูลหลักที่ใช้ร่วมกันทั้งระบบ</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminCard
          href="/admin/dietitians"
          icon={UserIcon}
          tone="bg-emerald-50 text-emerald-700 ring-emerald-100"
          title="ผู้ประเมิน (Dietitian)"
          description="เพิ่ม แก้ชื่อ หรือปิดการใช้งานรายชื่อที่ขึ้นในช่อง “ผู้ประเมิน” ของแบบฟอร์ม SGA"
        />
        <AdminCard
          href="/admin/foods"
          icon={CalculatorIcon}
          tone="bg-amber-50 text-amber-700 ring-amber-100"
          title="ค่า fac อาหาร (ตาราง 3)"
          description="แก้ชื่อและค่า CHO/PRO/FAT/kcal ต่อส่วนของรายการอาหารที่ใช้คำนวณตาราง 3"
        />
      </div>

      <p className="rounded-lg bg-zinc-100 px-4 py-3 text-xs text-zinc-500">
        ยังไม่มีหน้าแก้ตัวเลือก/คะแนนของแบบประเมิน SGA — เกณฑ์ให้คะแนนอ้างอิงมาตรฐานทางการแพทย์
        การแก้ไขควรทำเป็นเวอร์ชันใหม่ของฟอร์มแทนการแก้ทับของเดิม เพื่อไม่ให้คะแนนในประวัติเก่าคลาดเคลื่อน
        ถ้าต้องแก้ ติดต่อผู้พัฒนาระบบ
      </p>
    </div>
  );
}

function AdminCard({
  href,
  icon: Icon,
  tone,
  title,
  description,
}: {
  href: string;
  icon: typeof UserIcon;
  tone: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 motion-reduce:hover:translate-y-0"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>
      <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-zinc-600" />
    </Link>
  );
}
