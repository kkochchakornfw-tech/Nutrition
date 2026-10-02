import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AuthUser } from "./types";

export const SESSION_COOKIE = "nutrition_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

/**
 * กุญแจเซ็น session — ต้องตั้ง AUTH_SECRET ใน .env.local เสมอ (ดู .env.local.example)
 * [security] เดิมมี fallback เป็นสตริงคงที่ที่เผยแพร่อยู่ใน .env.local.example — ถ้าลืมตั้งค่าจริง
 * ใครก็เอาสตริงนั้นไปปลอม session (รวมถึงสวมสิทธิ์ admin) ได้ทันที จึงตัดออก:
 *   - production: ถ้าไม่ตั้งค่า ให้ล้มทันทีตอนเริ่มเซิร์ฟเวอร์ (fail-closed ดีกว่าเปิดช่องโหว่เงียบ ๆ)
 *   - dev/test: สุ่มกุญแจใหม่ตอนโปรเซสเริ่ม แทนค่าคงที่ที่คาดเดาได้ แล้วเก็บไว้ใน global
 *     (ไม่ใช่ module-level ตรง ๆ) เพราะ Next.js dev (Turbopack) แยก route handler กับ
 *     server component ไว้คนละ module graph กัน — ถ้าสุ่มใหม่ทุกครั้งที่ import ไฟล์นี้
 *     สอง context จะได้กุญแจคนละตัว เซ็น session ที่ /api/auth/login แล้ว getSession()
 *     ฝั่ง layout ตรวจไม่ผ่านทันที (พังจริงระหว่างพัฒนา — เจอและแก้แล้ว)
 *     ผลข้างเคียงที่ยอมรับได้: restart dev server แล้ว session เก่าใช้ไม่ได้ ต้อง login ใหม่
 */
declare global {
  var __devAuthSecret: string | undefined;
}

function loadSecret(): string {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET ไม่ได้ตั้งค่า (หรือสั้นเกินไป) — ต้องตั้งเป็นสตริงสุ่มอย่างน้อย 16 ตัวอักษรใน .env.local ก่อนรัน production เสมอ"
    );
  }
  if (!global.__devAuthSecret) global.__devAuthSecret = randomBytes(32).toString("hex");
  return global.__devAuthSecret;
}

const SECRET = loadSecret();

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(user: AuthUser): string {
  const payload = base64url(
    JSON.stringify({ user, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 })
  );
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): AuthUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      user: AuthUser;
      exp: number;
    };
    if (decoded.exp < Date.now()) return null;
    return decoded.user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Secure cookie ส่งได้เฉพาะ HTTPS (localhost ยกเว้น) — ถ้า deploy บน HTTP ในวง LAN เช่น
 * http://172.16.x.x เบราว์เซอร์จะทิ้ง cookie ทิ้ง ทำให้ login แล้วไม่ติด session
 * ค่าเริ่มต้นคือ secure ใน production; ตั้ง AUTH_COOKIE_SECURE=false เฉพาะเมื่อยังไม่มี HTTPS
 */
function cookieSecure(): boolean {
  const override = process.env.AUTH_COOKIE_SECURE;
  if (override === "false") return false;
  if (override === "true") return true;
  return process.env.NODE_ENV === "production";
}

export async function setSessionCookie(user: AuthUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
