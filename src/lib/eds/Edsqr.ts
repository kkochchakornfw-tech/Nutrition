import QRCode from "qrcode";

/**
 * รูปแบบ QR ที่ระบบ HIS/EDScare เดิมใช้ (ถอดจาก QR ตัวอย่างจริง 2 อัน —
 * ไม่ใช่สเปกที่ IT ยืนยันเป็นลายลักษณ์อักษร ต้องทดสอบสแกน/import จริงก่อน
 * ใช้งานจริงเสมอ):
 *
 *   {HN 10 หลัก ไม่มีขีด} {ตัวอักษร}{เลข 10 หลัก ไม่มีขีด} {รหัสฟอร์ม 3 ตัว}{เลขหน้า 2 หลัก}{วันที่ YYYYMMDD}{เวลา HHmm} {CareProviderCode};{PrintSpid}
 *
 * ตัวอย่างจริงที่ถอดได้ (จาก Rehab): "6713019519 I6726008482 RAC01202608310823 67ORT10;67ORTDRA"
 * ตัวอย่างจริงจากจุดอื่น (เทียบโครงสร้าง): "0524012398 O0524065194 IAG00202502041426 05IWARD;05W4A"
 *
 * ── ช่องที่ 2 คือ "visit ref" ไม่ใช่ VN เสมอไป (ยืนยันกับ HIS จริงแล้ว) ──
 * HIS มีฟังก์ชัน format ที่ใส่ตัวอักษรนำหน้ามาให้ในตัวอยู่แล้ว:
 *   format_an('690009125')  → "I67-26-009125"  → ตัดขีด = "I6726009125"  (IPD)
 *   format_vn('6900143948') → "O67-26-143948"  → ตัดขีด = "O6726143948"  (OPD)
 * คนไข้ IPD ใช้ AN (ขึ้นต้น I) ส่วน OPD ใช้ VN (ขึ้นต้น O) — และ AN กับ VN
 * เป็นคนละเลขกันใน visit เดียวกัน (vn=6900156097 แต่ an=690009125)
 *
 * ดังนั้นห้ามตัดตัวอักษรนำหน้าทิ้งแล้วเดาใหม่จาก visit_type เด็ดขาด —
 * ให้ส่งค่าที่ HIS format มาแล้วเข้ามาตรง ๆ ที่ฟิลด์ visitRef
 */
export type EdsQrFields = {
  /** HN ไม่มีขีด เช่น "6713019519" (จาก HN "67-13-019519") */
  hn: string;
  /** เลขอ้างอิง visit พร้อมตัวอักษรนำหน้าจาก HIS — IPD ใช้ format_an()
   *  ("I67-26-009125") ส่วน OPD ใช้ format_vn() ("O67-26-143948")
   *  ใส่ขีดมาได้ เดี๋ยว buildEdsQrPayload() ตัดให้เอง
   *
   *  ถ้าค่าที่ส่งมาไม่มีตัวอักษรนำหน้าเลย (เช่น "6726009125" ดิบ ๆ จากฟอร์ม
   *  เก่า) จะ fallback ไปเติมจาก visitType ให้ — เป็นทางสำรองเท่านั้น */
  visitRef: string;
  /** ใช้เฉพาะตอน visitRef ไม่มีตัวอักษรนำหน้ามา — บอกว่าควรเติม I หรือ O */
  visitType?: "IPD" | "OPD";
  /** รหัสฟอร์ม 3 ตัวอักษร — Rehab ใช้ "RAC" ตามตัวอย่างจริงที่ถอดได้
   *  (ถ้าแต่ละฟอร์ม OPD/IPD/ฯลฯ ใช้รหัสต่างกัน ต้องขอตารางจาก IT) */
  formCode: string;
  /** เลขหน้า 2 หลัก เช่น "01" — ปกติคือ "01" สำหรับฟอร์มหน้าเดียว */
  pageNumber: string;
  /** วันที่พิมพ์ รูปแบบ Date object หรือ "YYYY-MM-DD" */
  printDate: Date | string;
  /** เวลาพิมพ์ รูปแบบ "HH:mm" หรือ "HH:mm:ss" */
  printTime: string;
  /** รหัสจุดบริการที่สั่งพิมพ์ (CareProviderCode) — ตัวอย่าง Rehab: "67ORT10" */
  careProviderCode: string;
  /** รหัส spid ที่สั่งพิมพ์ (PrintSpid) — ตัวอย่าง Rehab: "67ORTDRA" */
  printSpid: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateYYYYMMDD(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

function formatTimeHHmm(t: string): string {
  const match = t.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "0000";
  return `${match[1].padStart(2, "0")}${match[2]}`;
}

/** ตัดขีด/ช่องว่างออกจาก HN หรือ VN ให้เหลือแต่ตัวเลข/ตัวอักษรล้วน */
function stripSeparators(value: string): string {
  return value.replace(/[-\s]/g, "");
}

/**
 * แปลง visit_type เป็นตัวอักษรนำหน้า — ยืนยันแล้วว่า I=IPD, O=OPD
 *
 * ใช้เป็น "ทางสำรอง" เท่านั้น สำหรับกรณีที่ค่า visitRef ที่ส่งเข้ามาไม่มี
 * ตัวอักษรนำหน้าติดมาด้วย ปกติ HIS format มาให้แล้วไม่ต้องเรียกอันนี้
 */
export function vnPrefixFromVisitType(visitType: "IPD" | "OPD"): string {
  return visitType === "IPD" ? "I" : "O";
}

/**
 * ประกอบ string สำหรับเข้ารหัส QR ตาม pattern ที่ถอดได้
 *
 * ช่องที่ 2 ใช้ visitRef ที่ HIS format มาแล้วตรง ๆ (แค่ตัดขีดทิ้ง) —
 * ไม่ตัดตัวอักษรนำหน้าออกแล้วเดาใหม่ เพราะ I/O มาจากคนละเลขกัน
 * (I = AN ของคนไข้ใน, O = VN ของคนไข้นอก) ดูคำอธิบายหัวไฟล์
 */
export function buildEdsQrPayload(fields: EdsQrFields): string {
  const hn = stripSeparators(fields.hn);
  const dateStr = formatDateYYYYMMDD(fields.printDate);
  const timeStr = formatTimeHHmm(fields.printTime);

  // ตัดแค่ขีด/ช่องว่าง ตัวอักษรนำหน้าที่ HIS ใส่มาให้คงไว้
  let visitRef = stripSeparators(fields.visitRef);
  // ทางสำรอง: ค่าเก่าที่ไม่มีตัวอักษรนำหน้ามาเลย ค่อยเติมจาก visitType
  if (!/^[A-Za-z]/.test(visitRef) && fields.visitType) {
    visitRef = `${vnPrefixFromVisitType(fields.visitType)}${visitRef}`;
  }

  const part1 = hn;
  const part2 = visitRef;
  const part3 = `${fields.formCode}${fields.pageNumber}${dateStr}${timeStr}`;
  const part4 = `${fields.careProviderCode};${fields.printSpid}`;

  // บังคับตัวพิมพ์ใหญ่ทั้งหมด (ตัวอย่างจริงที่ถอดได้ใช้ตัวใหญ่ล้วน) กัน
  // input ต้นทางเป็นตัวเล็กหลุดเข้ามา
  return [part1, part2, part3, part4].join(" ").toUpperCase();
}

/**
 * สร้างรูป QR (PNG bytes) จาก string ที่ประกอบไว้แล้ว — เอาไปฝังใน PDF
 * ด้วย pdfDoc.embedPng() + page.drawImage() ได้เลย (วิธีเดียวกับรูปคนไข้)
 *
 * errorCorrectionLevel: เผื่อเครื่องสแกน/ตัวอ่านต้องการ level เฉพาะ —
 * default "M" (มาตรฐานทั่วไป) ถ้า IT บอก level อื่น เปลี่ยนตรงนี้
 */
export async function generateQrPng(
  payload: string,
  options?: { size?: number; errorCorrectionLevel?: "L" | "M" | "Q" | "H" },
): Promise<Uint8Array> {
  const buffer = await QRCode.toBuffer(payload, {
    type: "png",
    width: options?.size ?? 300,
    errorCorrectionLevel: options?.errorCorrectionLevel ?? "M",
    margin: 1,
  });
  return new Uint8Array(buffer);
}
