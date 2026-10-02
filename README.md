# ระบบประเมินภาวะโภชนาการ

Next.js + TypeScript + Tailwind CSS. รายละเอียด requirement เต็มดูที่ [PROJECT_BRIEF.md](./PROJECT_BRIEF.md)

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — ระบบจะพาไปหน้า login ก่อน

บัญชีทดสอบ (mock auth):

| รหัสพนักงาน | รหัสผ่าน | role |
| --- | --- | --- |
| 10001 | 1234 | assessor |
| 10002 | 1234 | assessor |
| admin | admin | admin |

HN ทดสอบสำหรับดึงข้อมูลผู้ป่วยจำลอง (mock HIS): `1234567`, `2345678`, `3456789`
(HN อื่นจะขึ้น "ไม่พบข้อมูล" และให้กรอกชื่อผู้ป่วยเองเพื่อทดสอบต่อได้)

## สถานะปัจจุบัน

- ✅ เมนู 1: แบบประเมิน SGA/NAF ครบ flow (ค้นหา HN → กรอกฟอร์ม → ให้คะแนน 10 หมวด →
  บันทึก → ดูประวัติ/ย้อนดู record เดิม)
- ✅ การ์ดผู้ป่วย (ค้นด้วย HN หรือชื่อ), แถบ "ยังตอบไม่ครบ" ในฟอร์ม, export ฟอร์มเป็น JPEG
  (หน้ารายละเอียดผลประเมิน → "พิมพ์เป็นรูปภาพ") — วาดทับแม่แบบ `public/forms/naf-template.png`
  ที่ render จาก PDF M/R-NUT-001.1 Rev.4 พิกัดทุกช่องอยู่ใน `src/lib/sga/formLayout.ts`
  ถ้าฟอร์มขึ้น revision ใหม่ ต้อง render แม่แบบใหม่ (scale 3 = 1836x2376) แล้วอัปเดตพิกัด
- ⏳ เมนู 2: คำนวณแคลอรี่/สารอาหารต่อวัน — ยังไม่เริ่ม เพราะตารางที่ 3 (สัดส่วนอาหารต่อวัน)
  ยังต้องคุยรายละเอียดกับผู้ใช้ก่อน (ดู PROJECT_BRIEF.md)

## Auth และ HIS API — สถานะ mock

ทั้ง auth (`src/lib/auth/`) และการดึงข้อมูลผู้ป่วยจาก HIS (`src/lib/his/`) ถูกออกแบบเป็น
interface (`AuthProvider`, `HISProvider`) ที่มี mock implementation ใช้งานอยู่ตอนนี้
เมื่อได้ spec จริงจากทีม HIS/AD ให้เพิ่ม implementation ใหม่แล้วสลับใน
`src/lib/auth/provider.ts` / `src/lib/his/provider.ts` — ไม่กระทบโค้ดส่วนอื่น

## ฐานข้อมูล

ตอนนี้ assessment ถูกเก็บแบบ in-memory (`src/lib/sga/store.ts`, รีเซ็ตเมื่อ restart server)
เพื่อให้รันทดสอบได้ทันทีโดยไม่ต้องตั้ง MySQL ก่อน โครงสร้างข้อมูล/field ตรงกับ
`db/schema_v2.sql` ทุกจุด การย้ายไปใช้ MySQL จริงในอนาคตคือแก้แค่ไฟล์นี้ให้ query DB
แทน array — เกณฑ์การให้คะแนน (`src/lib/sga/data.ts`) ก็ตรงกับ `db/seed_sga_criteria.sql`
1:1 เช่นกัน

คัดลอก `.env.local.example` เป็น `.env.local` แล้วตั้งค่า `AUTH_SECRET` เป็นค่าสุ่มยาวๆ
ก่อน deploy จริง (ค่า default ใช้ได้เฉพาะตอน dev)
