/**
 * ข้อผิดพลาดที่ตั้งใจโยนขึ้นมาเพื่อแสดงข้อความให้ผู้ใช้เห็นตรง ๆ (เช่น กรอกไม่ครบ,
 * เลือกตัวเลือกไม่ถูกต้อง) — ปลอดภัยที่จะส่ง .message กลับไปให้ client
 * ตรงข้ามกับ error อื่น ๆ ที่ไม่คาดคิด (เช่น DB ล่ม) ซึ่งไม่ควรส่งรายละเอียดกลับไป
 * เพราะอาจหลุดข้อมูลภายใน (ชื่อตาราง/คอลัมน์ ฯลฯ) ให้ log ไว้ฝั่งเซิร์ฟเวอร์แล้วตอบข้อความกลาง ๆ แทน
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** ใช้ใน catch block ของ API route: คืนข้อความที่ปลอดภัยจะแสดงกับ client + log ของจริงไว้ดูฝั่งเซิร์ฟเวอร์ */
export function safeErrorMessage(err: unknown, fallback: string): { message: string; status: number } {
  if (err instanceof ValidationError) {
    return { message: err.message, status: 400 };
  }
  // log ฝั่งเซิร์ฟเวอร์เท่านั้น ไม่ส่งรายละเอียดนี้กลับไปให้ client
  console.error(err);
  return { message: fallback, status: 500 };
}
