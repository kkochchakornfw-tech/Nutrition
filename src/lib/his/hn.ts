// lib/hn.ts
// แปลง HN ดิบ (12 หลัก) ของ iMed เป็นรูปแบบที่แสดง (hncode)
// เลียนแบบฟังก์ชัน public.format_hn() ของ PostgreSQL:
//   bu_code || '-' || YY || '-' || last-6-digits
// ตัวอย่าง: 640000001223 -> 67-21-001223
const BU_CODE = "67";

export function formatHn(hn: string | number | null | undefined): string {
  if (hn == null) return "";
  const s = String(hn).trim();
  if (!s) return "";
  if (s.includes("-")) return s; // เป็น hncode อยู่แล้ว
  if (s.length <= 3 || !/^\d+$/.test(s)) return s;

  const first2 = parseInt(s.slice(0, 2), 10);
  const gregYear = 2500 + first2 - 543; // 64 -> 2021
  const yy = String(gregYear).slice(-2); // -> "21"
  const last6 = s.slice(-6);
  return `${BU_CODE}-${yy}-${last6}`;
}

// กลับด้านของ formatHn: 67-26-005350 -> 690000005350
export function toRawHn(input: string): string {
  const s = input.trim();
  const m = s.match(/^\d{2}-(\d{2})-(\d{6})$/);
  if (!m) return s; // ไม่ใช่รูปแบบ hncode → ถือว่าเป็น HN ดิบอยู่แล้ว
  const [, yy, last6] = m;
  const beYY = String((2000 + Number(yy) + 543) % 100).padStart(2, "0"); // 26 -> 69
  return `${beYY}0000${last6}`;
}
