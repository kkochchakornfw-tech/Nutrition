import { NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/api-helpers";
import { getAuthProvider } from "@/lib/auth/provider";
import { setSessionCookie } from "@/lib/auth/session";
import { checkLoginRateLimit, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/rateLimit";

/** IP จริงของผู้เรียก เมื่ออยู่หลัง reverse proxy (เช่น nginx) ที่ตั้งค่า X-Forwarded-For ไว้ */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let body: { employeeCode?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { employeeCode, password } = body;
  if (!employeeCode?.trim() || !password) {
    return NextResponse.json({ error: "กรุณากรอกรหัสพนักงานและรหัสผ่าน" }, { status: 400 });
  }

  // [security] จำกัดจำนวนครั้งที่ลองผิดต่อ (IP + รหัสพนักงาน) กัน brute-force เดารหัสผ่าน
  const rateLimitKey = `${clientIp(request)}:${employeeCode.trim().toLowerCase()}`;
  const retryAfterSeconds = checkLoginRateLimit(rateLimitKey);
  if (retryAfterSeconds !== null) {
    return NextResponse.json(
      { error: `ลองผิดหลายครั้งเกินไป กรุณารอ ${retryAfterSeconds} วินาทีแล้วลองใหม่` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const result = await getAuthProvider().login(employeeCode, password);
  if (!result.ok) {
    recordFailedLogin(rateLimitKey);
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  clearLoginAttempts(rateLimitKey);
  await setSessionCookie(result.user);
  return NextResponse.json({ user: result.user });
}
