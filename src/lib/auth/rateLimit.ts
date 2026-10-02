import { timingSafeEqual } from "node:crypto";

/**
 * ป้องกัน brute-force เดารหัสผ่านแบบง่าย ๆ ด้วยหน่วยความจำในโปรเซส
 * (สอดคล้องกับที่แอปนี้เก็บ state อื่น ๆ แบบ in-memory global อยู่แล้ว)
 * ถ้าจะ deploy หลายอินสแตนซ์พร้อมกันในอนาคต ต้องย้ายไปเก็บที่ใช้ร่วมกันได้ เช่น Redis
 */
const WINDOW_MS = 5 * 60 * 1000; // 5 นาที
const MAX_ATTEMPTS = 8; // ต่อ key ต่อหน้าต่างเวลา

interface Bucket {
  count: number;
  windowStart: number;
}

declare global {
  var __loginAttempts: Map<string, Bucket> | undefined;
}

function store(): Map<string, Bucket> {
  if (!global.__loginAttempts) global.__loginAttempts = new Map();
  return global.__loginAttempts;
}

/** เรียกก่อนพยายาม login — คืนวินาทีที่ต้องรอถ้าถูกจำกัดแล้ว, null ถ้ายังทำได้ */
export function checkLoginRateLimit(key: string): number | null {
  const now = Date.now();
  const bucket = store().get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) return null;
  if (bucket.count >= MAX_ATTEMPTS) {
    return Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
  }
  return null;
}

/** เรียกหลัง login ไม่สำเร็จ เพื่อนับความพยายาม */
export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const bucket = store().get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    store().set(key, { count: 1, windowStart: now });
    return;
  }
  bucket.count += 1;
}

/** เรียกหลัง login สำเร็จ เพื่อล้างตัวนับของ key นั้น */
export function clearLoginAttempts(key: string): void {
  store().delete(key);
}

/**
 * เทียบสตริงแบบ constant-time กันโดนวัดเวลาแล้วไล่เดาทีละตัวอักษร (timing attack)
 * ความยาวต่างกันก็ยังคืน false แบบ constant-time เท่าที่ทำได้ (เทียบกับ buffer ที่ padded)
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // ยังคงทำงานเทียบ constant-time กับความยาวคงที่ เพื่อไม่ให้ early-return ทันที
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}
