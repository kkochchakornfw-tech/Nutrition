import {
  formatThaiDate,
  formatThaiDateFromDateTime,
  formatTime,
  splitThaiName,
} from "@/lib/format";
import { SGA_CRITERIA } from "./data";
import {
  CHECKBOXES,
  CHECKBOX_SIZE,
  FIELDS,
  FORM_PAGE,
  INFO_SOURCE_BOXES,
  SCORE_ROWS,
  SGA_BOXES,
  SGA_BOX_SIZE,
  SUMMARY_BASELINES,
  VISIT_COLUMNS,
  VISIT_COLUMN_WIDTH,
  type BoxPos,
  type LineField,
} from "./formLayout";
import type { NafFormData } from "./nafData";
import type { Assessment, SgaResult } from "./types";

// หมึกสีดำสำหรับข้อมูลที่เติมลงฟอร์มเอกสาร
const INK = "#000000";
const FONT_FAMILY =
  '"Sarabun", "Leelawadee UI", "Tahoma", "Noto Sans Thai", sans-serif';
const CHECK_INK = "#dc2626";

type Ctx = CanvasRenderingContext2D;

/** เขียนข้อความชิดซ้ายบนเส้นประ ย่อขนาดตัวอักษรให้พอดีความกว้าง ถ้ายังไม่พอตัดด้วย … */
function drawFieldText(
  ctx: Ctx,
  S: number,
  field: LineField,
  raw: string | null | undefined,
) {
  const text = raw?.replace(/\s+/g, " ").trim();
  if (!text) return;
  // ยกขึ้นเล็กน้อยให้ตัวอักษรอยู่เหนือเส้นประ ไม่ถูกเส้นประขีดทับ
  drawFitText(
    ctx,
    S,
    text,
    field.x,
    field.baseline - LINE_LIFT,
    field.width,
    field.size,
    "left",
  );
}

const LINE_LIFT = 1.1;

/** ลบเส้นประ ".........." ในช่องก่อนเขียนค่าทับ */
function whiteOut(ctx: Ctx, S: number, cx: number, baseline: number) {
  const width = VISIT_COLUMN_WIDTH;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  // เว้นขอบบน/ล่างไว้ไม่ให้ลบเส้นตารางที่อยู่ติดกัน
  ctx.fillRect((cx - width / 2) * S, (baseline - 7.6) * S, width * S, 11 * S);
  ctx.restore();
}

// ระยะกึ่งกลาง (pt) ระหว่างบรรทัดชื่อ/นามสกุลผู้ประเมิน — เผื่อชื่อยาวเขียนไม่พอในบรรทัดเดียว
const DIETITIAN_LINE_GAP = 5;
// ยกชื่อทั้งสองบรรทัดขึ้นให้พ้นเส้นขอบล่างของช่อง
const DIETITIAN_LIFT = 2.5;
const DIETITIAN_MAX_WIDTH = 38;
const DIETITIAN_NAME_SIZE = 6.6;

/** เขียนชื่อผู้ประเมินแยกชื่อ/นามสกุลเป็น 2 บรรทัดซ้อนกลางช่องเดิม — เทมเพลตเดียวกันทุกชื่อ */
function drawAssessorName(
  ctx: Ctx,
  S: number,
  cx: number,
  baseline: number,
  fullName: string,
) {
  const width = VISIT_COLUMN_WIDTH;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect((cx - width / 2) * S, (baseline - 17) * S, width * S, 20 * S);
  ctx.restore();
  ctx.fillStyle = INK;
  const [first, last] = splitThaiName(fullName);
  drawFitText(
    ctx,
    S,
    first,
    cx,
    baseline - 0.8 - DIETITIAN_LINE_GAP - DIETITIAN_LIFT,
    DIETITIAN_MAX_WIDTH,
    DIETITIAN_NAME_SIZE,
    "center",
  );
  if (last) {
    drawFitText(
      ctx,
      S,
      last,
      cx,
      baseline - 0.8 + DIETITIAN_LINE_GAP - DIETITIAN_LIFT,
      DIETITIAN_MAX_WIDTH,
      DIETITIAN_NAME_SIZE,
      "center",
    );
  }
}

function drawFitText(
  ctx: Ctx,
  S: number,
  text: string,
  x: number,
  baseline: number,
  maxWidth: number,
  size: number,
  align: "left" | "center",
  bold = false,
) {
  const minSize = size * 0.6;
  let current = size;
  const setFont = () => {
    ctx.font = `${bold ? "bold " : ""}${current * S}px ${FONT_FAMILY}`;
  };
  setFont();
  while (ctx.measureText(text).width > maxWidth * S && current > minSize) {
    current -= 0.25;
    setFont();
  }
  let output = text;
  if (ctx.measureText(output).width > maxWidth * S) {
    while (
      output.length > 1 &&
      ctx.measureText(`${output}…`).width > maxWidth * S
    ) {
      output = output.slice(0, -1);
    }
    output = `${output}…`;
  }
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(output, x * S, baseline * S);
}

/** ตำแหน่งกรอบสี่เหลี่ยมจริงภายในสัญลักษณ์ ❑ เทียบกับมุมซ้ายบนของ glyph (สัดส่วนของขนาด glyph) */
const BOX_VISUAL = { dx: 0.05, dy: 0.2, w: 0.85, h: 0.75 };

function drawCheck(
  ctx: Ctx,
  S: number,
  [x, y]: BoxPos,
  size: { width: number; height: number },
) {
  const left = (x + size.width * BOX_VISUAL.dx) * S;
  const top = (y + size.height * BOX_VISUAL.dy) * S;
  const w = size.width * BOX_VISUAL.w * S;
  const h = size.height * BOX_VISUAL.h * S;

  ctx.save();
  ctx.strokeStyle = CHECK_INK;
  ctx.lineWidth = 1.5 * S;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(left + w * 0.12, top + h * 0.55);
  ctx.lineTo(left + w * 0.42, top + h * 0.88);
  ctx.lineTo(left + w * 1.02, top - h * 0.08);
  ctx.stroke();
  ctx.restore();
}

function criteriaScore(
  visit: Assessment,
  criteriaKey: string,
): number | "N/A" | null {
  const answers = visit.answers.filter((a) => a.criteriaKey === criteriaKey);
  if (answers.length === 0) return null;
  if (answers.every((a) => a.notApplicable)) return "N/A";
  return answers.reduce((sum, a) => sum + a.scoreSnapshot, 0);
}

function rowCenterBaseline(
  [top, bottom]: readonly [number, number],
  size: number,
): number {
  return (top + bottom) / 2 + size * 0.35;
}

function drawCheckmarks(ctx: Ctx, S: number, current: Assessment) {
  for (const answer of current.answers) {
    if (answer.notApplicable) continue; // ← เพิ่ม
    const criteria = SGA_CRITERIA.find((c) => c.id === answer.criteriaId);
    if (!criteria) continue;
    const optionIndex = criteria.options.findIndex(
      (o) => o.id === answer.optionId,
    );
    const box = CHECKBOXES[criteria.criteriaKey]?.[optionIndex];
    if (!box) continue;
    drawCheck(ctx, S, box, CHECKBOX_SIZE);

    // ตัวเลือก "อื่นๆ" ที่ผู้ประเมินพิมพ์ชื่อโรคเอง (คะแนนคงที่ตามกลุ่ม 3/6 แก้ไม่ได้)
    const option = criteria.options[optionIndex];
    if (option.isOther && answer.customLabel) {
      const field =
        option.score >= 6 ? FIELDS.diseaseOther6 : FIELDS.diseaseOther3;
      drawFieldText(ctx, S, field, answer.customLabel);
    }
  }
}

function drawVisitColumns(ctx: Ctx, S: number, visits: Assessment[]) {
  for (const visit of visits) {
    // แผ่นกระดาษมี 3 คอลัมน์เสมอ — ครั้งที่ 4, 7, ... (แผ่นถัดไป) ก็วนกลับมาคอลัมน์ 0
    const col = (visit.visitNo - 1) % 3;
    const cx = VISIT_COLUMNS[col];
    if (cx === undefined) continue;

    for (const [key, range] of Object.entries(SCORE_ROWS)) {
      const score = criteriaScore(visit, key);
      if (score === null) continue;
      drawFitText(
        ctx,
        S,
        String(score),
        cx,
        rowCenterBaseline(range, 11),
        30,
        9.5,
        "center",
        false,
      );
    }

    const cell = (text: string, baseline: number) => {
      whiteOut(ctx, S, cx, baseline);
      ctx.fillStyle = INK;
      drawFitText(
        ctx,
        S,
        text,
        cx,
        baseline - 0.8,
        VISIT_COLUMN_WIDTH,
        8.5,
        "center",
      );
    };

    whiteOut(ctx, S, cx, SUMMARY_BASELINES.totalScore);
    ctx.fillStyle = INK;
    drawFitText(
      ctx,
      S,
      String(visit.totalScore),
      cx,
      SUMMARY_BASELINES.totalScore - 0.5,
      30,
      9.5,
      "center",
      false,
    );
    const sgaIndex = (["A", "B", "C"] as SgaResult[]).indexOf(visit.sgaResult);
    const sgaBox = SGA_BOXES[col]?.[sgaIndex];
    if (sgaBox) drawCheck(ctx, S, sgaBox, SGA_BOX_SIZE);
    cell(formatThaiDateFromDateTime(visit.assessedAt), SUMMARY_BASELINES.date);
    cell(formatTime(visit.assessedAt), SUMMARY_BASELINES.time);
    drawAssessorName(
      ctx,
      S,
      cx,
      SUMMARY_BASELINES.dietitian,
      visit.assessorName,
    );
  }
}

// ⚠️ ประมาณจากภาพ ต้องจูนให้ตรงกรอบในแม่แบบ (หน่วยเดียวกับ FIELDS: x, y มุมซ้ายบน)
// ถ้ามีกรอบใน formLayout.ts อยู่แล้ว ให้ย้ายไปไว้ที่นั่นแล้ว import มาใช้
const PHOTO_BOX = { x: 242, y: 20, w: 68, h: 68 };
const PHOTO_INSET = 1; // เว้นจากเส้นกรอบของแม่แบบ ให้เส้นยังเห็นอยู่

/** วางรูปให้เต็มกรอบแบบ cover (ครอปส่วนเกิน ไม่ยืดรูป) */
function drawPatientPhoto(ctx: Ctx, S: number, img: HTMLImageElement) {
  ctx.strokeRect(
    PHOTO_BOX.x * S,
    PHOTO_BOX.y * S,
    PHOTO_BOX.w * S,
    PHOTO_BOX.h * S,
  );
  const x = (PHOTO_BOX.x + PHOTO_INSET) * S;
  const y = (PHOTO_BOX.y + PHOTO_INSET) * S;
  const w = (PHOTO_BOX.w - PHOTO_INSET * 2) * S;
  const h = (PHOTO_BOX.h - PHOTO_INSET * 2) * S;

  const boxRatio = w / h;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio; // รูปกว้างกว่ากรอบ → ตัดด้านข้าง
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio; // รูปสูงกว่ากรอบ → ตัดบนล่าง
    sy = (img.naturalHeight - sh) * 0.25; // เอนขึ้นบน ไม่ตัดใบหน้า
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * วาดข้อมูลลงบนแม่แบบฟอร์ม M/R-NUT-001.1 Rev.4
 * @param canvasWidth ความกว้างของ canvas ที่ template ถูกวาดเต็ม (ความสูงตามสัดส่วนหน้า PDF)
 */
export function drawNafForm(
  ctx: Ctx,
  template: CanvasImageSource,
  canvasWidth: number,
  data: NafFormData,
  photo: HTMLImageElement | null = null,
) {
  const S = canvasWidth / FORM_PAGE.width;
  const { patient, current } = data;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, FORM_PAGE.height * S);
  ctx.drawImage(template, 0, 0, canvasWidth, FORM_PAGE.height * S);
  if (photo) drawPatientPhoto(ctx, S, photo); // ← เพิ่มบรรทัดนี้
  ctx.fillStyle = INK;

  // กรอบข้อมูลผู้ป่วยมุมขวาบน
  drawFieldText(ctx, S, FIELDS.patientName, patient.name);
  drawFieldText(
    ctx,
    S,
    FIELDS.dateOfBirth,
    patient.dateOfBirth ? formatThaiDate(patient.dateOfBirth) : null,
  );
  drawFieldText(
    ctx,
    S,
    FIELDS.age,
    patient.ageText === "-" ? null : patient.ageText,
  );
  drawFieldText(ctx, S, FIELDS.hn, patient.hn);
  drawFieldText(ctx, S, FIELDS.vnAn, patient.vnAn);
  drawFieldText(
    ctx,
    S,
    FIELDS.admitDate,
    patient.admitDate ? formatThaiDate(patient.admitDate) : null,
  );
  drawFieldText(
    ctx,
    S,
    FIELDS.gender,
    patient.genderLabel === "-" ? null : patient.genderLabel,
  );
  drawFieldText(ctx, S, FIELDS.allergies, patient.allergies);

  // หัวฟอร์ม
  drawFieldText(ctx, S, FIELDS.chiefComplaint, current.chiefComplaint);
  drawFieldText(ctx, S, FIELDS.diagnosis, current.diagnosisSnapshot);
  drawFieldText(ctx, S, FIELDS.dietOrder, current.dietOrder);
  drawFieldText(ctx, S, FIELDS.religion, current.religion);
  if (current.infoSource)
    drawCheck(ctx, S, INFO_SOURCE_BOXES[current.infoSource], CHECKBOX_SIZE);
  if (current.infoSource === "other")
    drawFieldText(ctx, S, FIELDS.infoSourceOther, current.infoSourceOther);

  // 1. ส่วนสูง น้ำหนัก BMI
  drawFieldText(ctx, S, FIELDS.height, String(current.heightCm));
  drawFieldText(ctx, S, FIELDS.weight, String(current.weightKg));
  drawFieldText(ctx, S, FIELDS.bmi, String(current.bmi));

  drawCheckmarks(ctx, S, current);
  drawVisitColumns(ctx, S, data.visits);
}
