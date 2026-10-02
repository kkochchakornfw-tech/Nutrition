import { NextResponse } from "next/server";
import { getSession } from "./auth/session";
import type { AuthUser } from "./auth/types";

export async function requireApiSession(): Promise<AuthUser | NextResponse> {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }
  return user;
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

/** เหมือน requireApiSession แต่ต้องมี role เป็น admin เท่านั้น — ใช้กับ /api/admin/* */
export async function requireAdminApiSession(): Promise<AuthUser | NextResponse> {
  const session = await requireApiSession();
  if (isResponse(session)) return session;
  if (session.role !== "admin") {
    return NextResponse.json({ error: "ต้องเป็นผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }
  return session;
}

/**
 * [security] ชั้นป้องกัน CSRF เสริมนอกจาก SameSite=Lax cookie — เช็คว่า request ที่ทำให้
 * เกิดการเปลี่ยนแปลงข้อมูล (POST/PATCH/DELETE) มาจาก origin เดียวกับเว็บเราจริง ๆ
 * เบราว์เซอร์แนบ Origin (หรือ Referer เป็น fallback) มาให้เสมอสำหรับ cross-origin request
 * เรียกใช้ในทุก route ที่แก้ไขข้อมูล ก่อนอ่าน body
 */
export function requireSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 400 });

  // บาง client (เช่น เรียกตรงจาก server-to-server) ไม่ส่ง Origin มา — เบราว์เซอร์จะส่งเสมอ
  // สำหรับ fetch/POST ข้ามโดเมน จึงไม่ต้องบังคับให้ต้องมี header นี้เสมอไป แค่ถ้ามีแล้วต้องตรง
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 403 });
    }
    if (originHost !== host) {
      return NextResponse.json({ error: "คำขอถูกปฏิเสธ (origin ไม่ตรง)" }, { status: 403 });
    }
  }
  return null;
}
