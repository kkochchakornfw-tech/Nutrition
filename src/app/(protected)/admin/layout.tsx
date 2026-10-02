import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/** เฉพาะ role admin เท่านั้น — คนอื่นถูกเด้งกลับหน้าแรก (API เองก็เช็คซ้ำใน requireAdminApiSession) */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return <div className="flex flex-col gap-6">{children}</div>;
}
