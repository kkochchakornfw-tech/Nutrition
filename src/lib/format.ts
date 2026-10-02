// วันที่แสดงเป็น พ.ศ. ตามที่ใช้ในเอกสารโรงพยาบาลไทย (ค่าที่เก็บ/ส่งระหว่างระบบยังเป็น ISO ค.ศ.)

function parseDateParts(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "1958-05-12" -> "12/05/2501" (พ.ศ.) */
export function formatThaiDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const parts = parseDateParts(iso);
  if (!parts) return "-";
  return `${pad(parts.d)}/${pad(parts.m)}/${parts.y + 543}`;
}

/** ISO datetime -> "16:57" (เวลาท้องถิ่นของเครื่อง) */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO datetime -> "24/09/2569" (เวลาท้องถิ่นของเครื่อง) */
export function formatThaiDateFromDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear() + 543}`;
}

export function calcAge(
  dateOfBirth: string | null | undefined,
  reference: Date = new Date()
): { years: number; months: number } | null {
  if (!dateOfBirth) return null;
  const parts = parseDateParts(dateOfBirth);
  if (!parts) return null;

  let years = reference.getFullYear() - parts.y;
  let months = reference.getMonth() + 1 - parts.m;
  if (reference.getDate() < parts.d) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return years < 0 ? null : { years, months };
}

/** "67 ปี 4 เดือน" */
export function formatAge(
  dateOfBirth: string | null | undefined,
  reference: Date = new Date()
): string {
  const age = calcAge(dateOfBirth, reference);
  if (!age) return "-";
  return age.months > 0 ? `${age.years} ปี ${age.months} เดือน` : `${age.years} ปี`;
}

/** "ศตวรรณ วงศ์สุทิน" -> ["ศตวรรณ", "วงศ์สุทิน"] — แยกชื่อ/นามสกุลสำหรับเขียน 2 บรรทัดในช่องแคบ (เช่น ชื่อผู้ประเมินบนฟอร์ม NAF) */
export function splitThaiName(fullName: string): [first: string, last: string] {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return [trimmed, ""];
  return [trimmed.slice(0, spaceIndex), trimmed.slice(spaceIndex + 1)];
}

export function genderLabel(gender: "M" | "F" | "Other" | null | undefined): string {
  if (gender === "M") return "ชาย";
  if (gender === "F") return "หญิง";
  if (gender === "Other") return "อื่นๆ";
  return "-";
}
